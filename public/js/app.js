// Web Ping API - Frontend JavaScript

// Global değişkenler
let sites = [];
let responseTimeChart;
let availabilityChart;
const API_URL = window.location.origin;

/**
 * Sayfa yüklendiğinde çalışacak kodlar
 */
document.addEventListener('DOMContentLoaded', () => {
  // Grafikleri başlat
  initCharts();
  
  // Siteleri yükle
  loadSites();
  
  // Ping tümünü butonuna tıklama olayı ekle
  document.getElementById('pingAllBtn').addEventListener('click', pingAllSites);
  
  // Yeni site ekleme modalını açma
  document.getElementById('addSiteBtn').addEventListener('click', () => {
    // Modalı sıfırla ve başlığı ayarla
    document.getElementById('siteForm').reset();
    document.getElementById('siteId').value = '';
    document.getElementById('modalTitle').textContent = 'Yeni Site Ekle';
    
    // Modalı aç
    const siteModal = new bootstrap.Modal(document.getElementById('siteModal'));
    siteModal.show();
  });
  
  // Site kaydetme butonuna tıklama olayı ekle
  document.getElementById('saveSiteBtn').addEventListener('click', () => {
    const form = document.getElementById('siteForm');
    if (form.checkValidity()) {
      saveSite();
    } else {
      form.reportValidity();
    }
  });
  
  // Site silme onayı butonuna tıklama olayı ekle
  document.getElementById('confirmDeleteBtn').addEventListener('click', deleteSite);
});

/**
 * Tüm siteleri API'den yükle
 */
async function loadSites() {
  try {
    const response = await fetch(`${API_URL}/api/sites`);
    sites = await response.json();
    renderSitesTable();
    updateCharts();
  } catch (error) {
    console.error('Error loading sites:', error);
    showAlert('Siteler yüklenirken bir hata oluştu.', 'danger');
  }
}

/**
 * Siteleri tabloya ekle
 */
function renderSitesTable() {
  const tableBody = document.getElementById('sitesTableBody');
  tableBody.innerHTML = '';
  
  if (sites.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center">İzlenen site bulunmamaktadır.</td>
      </tr>
    `;
    return;
  }
  
  sites.forEach(site => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${site.id}</td>
      <td>${site.name}</td>
      <td><a href="${site.url}" target="_blank">${site.url}</a></td>
      <td>${site.interval} saniye</td>
      <td><span class="badge bg-secondary">Bilinmiyor</span></td>
      <td>-</td>
      <td>-</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-primary ping-site" data-id="${site.id}" title="Ping At">
            <i class="bi bi-arrow-repeat"></i>
          </button>
          <button class="btn btn-info edit-site" data-id="${site.id}" title="Düzenle">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-danger delete-site" data-id="${site.id}" title="Sil">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Ping butonlarına olay dinleyicileri ekle
  document.querySelectorAll('button.ping-site').forEach(button => {
    button.addEventListener('click', (e) => {
      const siteId = e.currentTarget.dataset.id;
      pingSite(siteId);
    });
  });
  
  // Düzenleme butonlarına olay dinleyicileri ekle
  document.querySelectorAll('button.edit-site').forEach(button => {
    button.addEventListener('click', (e) => {
      const siteId = e.currentTarget.dataset.id;
      editSite(siteId);
    });
  });
  
  // Silme butonlarına olay dinleyicileri ekle
  document.querySelectorAll('button.delete-site').forEach(button => {
    button.addEventListener('click', (e) => {
      const siteId = e.currentTarget.dataset.id;
      confirmDeleteSite(siteId);
    });
  });
}

/**
 * Site kaydet (ekle veya güncelle)
 */
async function saveSite() {
  try {
    const siteId = document.getElementById('siteId').value;
    const name = document.getElementById('siteName').value;
    const url = document.getElementById('siteUrl').value;
    const interval = parseInt(document.getElementById('checkInterval').value);
    
    let method = 'POST';
    let apiUrl = `${API_URL}/api/sites`;
    let successMessage = 'Site başarıyla eklendi.';
    
    // Eğer site ID varsa güncelleme yap
    if (siteId) {
      method = 'PUT';
      apiUrl = `${API_URL}/api/sites/${siteId}`;
      successMessage = 'Site başarıyla güncellendi.';
    }
    
    const response = await fetch(apiUrl, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, url, interval })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Modalı kapat
    const modal = bootstrap.Modal.getInstance(document.getElementById('siteModal'));
    modal.hide();
    
    // Siteleri yeniden yükle
    loadSites();
    
    showAlert(successMessage, 'success');
  } catch (error) {
    console.error('Error saving site:', error);
    showAlert('Site kaydedilirken bir hata oluştu.', 'danger');
  }
}

/**
 * Site düzenleme modalını aç
 */
function editSite(siteId) {
  const site = sites.find(s => s.id === parseInt(siteId));
  if (!site) return;
  
  document.getElementById('siteId').value = site.id;
  document.getElementById('siteName').value = site.name;
  document.getElementById('siteUrl').value = site.url;
  document.getElementById('checkInterval').value = site.interval;
  
  document.getElementById('modalTitle').textContent = 'Site Düzenle';
  
  const siteModal = new bootstrap.Modal(document.getElementById('siteModal'));
  siteModal.show();
}

/**
 * Site silme onayı
 */
function confirmDeleteSite(siteId) {
  const site = sites.find(s => s.id === parseInt(siteId));
  if (!site) return;
  
  if (confirm(`"${site.name}" sitesini silmek istediğinizden emin misiniz?`)) {
    deleteSite(siteId);
  }
}

/**
 * Site sil
 */
async function deleteSite(siteId) {
  try {
    const response = await fetch(`${API_URL}/api/sites/${siteId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Siteleri yeniden yükle
    loadSites();
    
    showAlert('Site başarıyla silindi.', 'success');
  } catch (error) {
    console.error('Error deleting site:', error);
    showAlert('Site silinirken bir hata oluştu.', 'danger');
  }
}

/**
 * Ping sonuçlarını yükle ve tabloya ekle
 */
async function loadPingResults() {
  try {
    const response = await fetch(`${API_URL}/api/ping`);
    const results = await response.json();
    
    console.log('Ping sonuçları:', results);
    
    // Sonuçları tabloya ekle
    results.forEach(result => {
      console.log('İşlenen sonuç:', result);
      
      // URL'yi temizle (protokol ve www kısmını kaldır)
      const cleanUrl = result.url.replace(/^https?:\/\/(?:www\.)?/, '');
      
      // Site URL'sine göre eşleştirme yap
      const siteRow = Array.from(document.querySelectorAll('#sitesTableBody tr')).find(row => {
        const urlCell = row.cells[2]?.querySelector('a');
        if (!urlCell) return false;
        
        const rowUrl = urlCell.href.replace(/^https?:\/\/(?:www\.)?/, '');
        console.log(`Karşılaştırma: ${cleanUrl} - ${rowUrl}`);
        return rowUrl.includes(cleanUrl) || cleanUrl.includes(rowUrl);
      });
      
      if (!siteRow) {
        console.log(`${result.url} için eşleşen satır bulunamadı`);
        return;
      }
      
      console.log('Eşleşen satır bulundu:', siteRow);
      
      const statusCell = siteRow.cells[4];
      const responseTimeCell = siteRow.cells[5];
      const lastCheckedCell = siteRow.cells[6];
      
      // Durum badge'i
      if (result.success) {
        statusCell.innerHTML = '<span class="badge bg-success">Çalışıyor</span>';
      } else {
        statusCell.innerHTML = '<span class="badge bg-danger">Hata</span>';
      }
      
      // Yanıt süresi
      responseTimeCell.textContent = `${result.responseTime} ms`;
      
      // Son kontrol zamanı
      const timestamp = new Date(result.timestamp);
      lastCheckedCell.textContent = timestamp.toLocaleTimeString();
    });
    
    // Grafikleri güncelle
    updateCharts(results);
    
  } catch (error) {
    console.error('Error loading ping results:', error);
  }
}

/**
 * Tüm sitelere ping at
 */
async function pingAllSites() {
  try {
    const pingBtn = document.getElementById('pingAllBtn');
    pingBtn.disabled = true;
    pingBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Ping Atılıyor...';
    
    const response = await fetch(`${API_URL}/api/ping`);
    const results = await response.json();
    
    pingBtn.disabled = false;
    pingBtn.innerHTML = '<i class="bi bi-arrow-repeat me-2"></i>Tümünü Ping At';
    
    // Sonuçları doğrudan tabloya ekle
    loadPingResults();
    
    showAlert('Tüm sitelere ping atıldı.', 'success');
  } catch (error) {
    console.error('Error pinging all sites:', error);
    showAlert('Ping işlemi sırasında bir hata oluştu.', 'danger');
    
    const pingBtn = document.getElementById('pingAllBtn');
    pingBtn.disabled = false;
    pingBtn.innerHTML = '<i class="bi bi-arrow-repeat me-2"></i>Tümünü Ping At';
  }
}

/**
 * Belirli bir siteye ping at
 */
async function pingSite(siteId) {
  try {
    const button = document.querySelector(`button.ping-site[data-id="${siteId}"]`);
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    
    const response = await fetch(`${API_URL}/api/ping/${siteId}`);
    const result = await response.json();
    
    button.disabled = false;
    button.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
    
    // Sonuçları tabloya ekle
    const row = button.closest('tr');
    const statusCell = row.cells[4];
    const responseTimeCell = row.cells[5];
    const lastCheckedCell = row.cells[6];
    
    // Durum badge'i
    if (result.success) {
      statusCell.innerHTML = '<span class="badge bg-success">Çalışıyor</span>';
    } else {
      statusCell.innerHTML = '<span class="badge bg-danger">Hata</span>';
    }
    
    // Yanıt süresi
    responseTimeCell.textContent = `${result.responseTime} ms`;
    
    // Son kontrol zamanı
    const timestamp = new Date(result.timestamp);
    lastCheckedCell.textContent = timestamp.toLocaleTimeString();
    
    // Grafikleri güncelle
    loadPingResults();
    
  } catch (error) {
    console.error(`Error pinging site ${siteId}:`, error);
    showAlert('Ping işlemi sırasında bir hata oluştu.', 'danger');
    
    const button = document.querySelector(`button.ping-site[data-id="${siteId}"]`);
    button.disabled = false;
    button.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
  }
}

/**
/**
 * Site silme onayı
 */
function confirmDeleteSite(siteId) {
  const site = sites.find(s => s.id === parseInt(siteId));
  if (!site) return;
  
  if (confirm(`"${site.name}" sitesini silmek istediğinizden emin misiniz?`)) {
    deleteSite(siteId);
  }
}

/**
 * Site sil
 */
async function deleteSite(siteId) {
  try {
    const response = await fetch(`${API_URL}/api/sites/${siteId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Site silinirken bir hata oluştu.');
    }
    
    // Siteleri yeniden yükle
    loadSites();
    
    showAlert('Site başarıyla silindi.', 'success');
  } catch (error) {
    console.error('Error deleting site:', error);
    showAlert(error.message || 'Site silinirken bir hata oluştu.', 'danger');
  }
}

/**
 * Grafikleri başlat
 */
function initCharts() {
  // Yanıt süresi grafiği
  const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
  responseTimeChart = new Chart(responseTimeCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Web Sitesi Yanıt Süreleri (ms)'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // Erişilebilirlik grafiği
  const availabilityCtx = document.getElementById('availabilityChart').getContext('2d');
  availabilityChart = new Chart(availabilityCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Erişilebilirlik (%)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        data: []
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Web Sitesi Erişilebilirliği (%)'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

/**
 * Grafikleri güncelle
 */
function updateCharts(results = []) {
  if (!responseTimeChart || !availabilityChart) {
    console.error('Grafikler henüz başlatılmamış!');
    return;
  }
  
  if (results.length === 0) {
    // Eğer sonuç yoksa, site adlarını kullan
    if (sites && sites.length > 0) {
      const labels = sites.map(site => site.name);
      const emptyData = new Array(sites.length).fill(0);
      
      responseTimeChart.data.labels = labels;
      responseTimeChart.data.datasets = [{
        label: 'Yanıt Süresi (ms)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        data: emptyData
      }];
      responseTimeChart.update();
      
      availabilityChart.data.labels = labels;
      availabilityChart.data.datasets[0].data = emptyData;
      availabilityChart.update();
    }
    return;
  }
  
  // Site adları
  const labels = results.map(result => result.name);
  
  // Yanıt süreleri
  const responseTimes = results.map(result => result.responseTime);
  
  // Erişilebilirlik yüzdeleri
  const availabilities = results.map(result => result.success ? 100 : 0);
  
  // Yanıt süresi grafiğini güncelle
  responseTimeChart.data.labels = labels;
  responseTimeChart.data.datasets = [{
    label: 'Yanıt Süresi (ms)',
    backgroundColor: 'rgba(54, 162, 235, 0.2)',
    borderColor: 'rgba(54, 162, 235, 1)',
    borderWidth: 1,
    data: responseTimes
  }];
  responseTimeChart.update();
  
  // Erişilebilirlik grafiğini güncelle
  availabilityChart.data.labels = labels;
  availabilityChart.data.datasets[0].data = availabilities;
  availabilityChart.update();
}

/**
 * Modern uyarı mesajı göster
 */
function showAlert(message, type = 'info') {
  // Mevcut uyarıları temizle
  const existingAlerts = document.querySelectorAll('.custom-alert');
  existingAlerts.forEach(alert => {
    alert.style.animation = 'slideOut 0.5s forwards';
    setTimeout(() => alert.remove(), 500);
  });
  
  // İkon belirleme
  let icon = '';
  switch(type) {
    case 'success':
      icon = '<i class="bi bi-check-circle-fill alert-icon"></i>';
      break;
    case 'danger':
      icon = '<i class="bi bi-exclamation-triangle-fill alert-icon"></i>';
      break;
    case 'warning':
      icon = '<i class="bi bi-exclamation-circle-fill alert-icon"></i>';
      break;
    default:
      icon = '<i class="bi bi-info-circle-fill alert-icon"></i>';
      break;
  }
  
  // Yeni uyarı oluştur
  const alertDiv = document.createElement('div');
  alertDiv.className = `custom-alert ${type}`;
  alertDiv.innerHTML = `
    ${icon}
    <div class="alert-content">${message}</div>
    <button type="button" class="alert-close" aria-label="Kapat">&times;</button>
  `;
  
  // Uyarıyı sayfaya ekle
  document.body.appendChild(alertDiv);
  
  // Kapatma butonuna tıklama olayı ekle
  const closeButton = alertDiv.querySelector('.alert-close');
  closeButton.addEventListener('click', () => {
    alertDiv.style.animation = 'slideOut 0.5s forwards';
    setTimeout(() => alertDiv.remove(), 500);
  });
  
  // 5 saniye sonra otomatik kapat
  setTimeout(() => {
    if (document.body.contains(alertDiv)) {
      alertDiv.style.animation = 'slideOut 0.5s forwards';
      setTimeout(() => alertDiv.remove(), 500);
    }
  }, 5000);
}
