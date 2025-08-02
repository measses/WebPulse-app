const axios = require('axios');
const logger = require('../utils/logger');
const prometheus = require('../utils/prometheus');

// Site listesi (gerçek uygulamada veritabanından gelecek)
let sites = [
  { id: 1, url: 'https://www.google.com', name: 'Google', interval: 60 },
  { id: 2, url: 'https://www.github.com', name: 'GitHub', interval: 60 },
  { id: 3, url: 'https://www.example.com', name: 'Example', interval: 30 }
];

// Ping işlemlerini yöneten zamanlayıcılar
const pingTimers = new Map();

/**
 * Bir web sitesine ping atma işlemi
 * @param {Object} site - Ping atılacak site bilgileri
 * @returns {Promise<Object>} - Ping sonuçları
 */
const pingWebsite = async (site) => {
  const startTime = Date.now();
  let statusCode = 0;
  let responseTime = 0;
  let error = null;

  try {
    logger.info(`Pinging ${site.name} (${site.url})`);
    
    const response = await axios.get(site.url, {
      timeout: 5000, // 5 saniye timeout
      validateStatus: () => true // Tüm HTTP durum kodlarını kabul et
    });
    
    statusCode = response.status;
    responseTime = Date.now() - startTime;
    
    logger.info(`Ping to ${site.name} completed: ${statusCode} in ${responseTime}ms`);
    
    // Prometheus metriklerini güncelle
    const isError = statusCode >= 400;
    prometheus.updatePingMetrics(
      site.url, 
      responseTime, 
      statusCode, 
      isError,
      isError ? `HTTP_${statusCode}` : null
    );
    
    return {
      url: site.url,
      name: site.name,
      statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      success: !isError
    };
  } catch (err) {
    error = err;
    responseTime = Date.now() - startTime;
    
    logger.error(`Ping to ${site.name} failed: ${err.message}`);
    
    // Prometheus metriklerini güncelle
    prometheus.updatePingMetrics(
      site.url, 
      responseTime, 
      0, 
      true,
      err.code || 'NETWORK_ERROR'
    );
    
    return {
      url: site.url,
      name: site.name,
      statusCode: 0,
      responseTime,
      timestamp: new Date().toISOString(),
      success: false,
      error: err.message
    };
  }
};

/**
 * Tüm sitelere ping atma işlemi
 * @returns {Promise<Array>} - Tüm ping sonuçları
 */
const pingAllSites = async () => {
  const results = await Promise.all(
    sites.map(site => pingWebsite(site))
  );
  return results;
};

/**
 * Belirli bir siteye ping atma işlemi
 * @param {number} id - Site ID'si
 * @returns {Promise<Object>} - Ping sonucu
 */
const pingSiteById = async (id) => {
  const site = sites.find(s => s.id === parseInt(id));
  if (!site) {
    throw new Error('Site not found');
  }
  return await pingWebsite(site);
};

/**
 * Tüm sitelerin periyodik ping işlemlerini başlatma
 */
const startPeriodicPings = () => {
  // Önce mevcut zamanlayıcıları temizle
  stopPeriodicPings();
  
  // Her site için zamanlayıcı oluştur
  sites.forEach(site => {
    const intervalMs = site.interval * 1000;
    const timerId = setInterval(async () => {
      try {
        await pingWebsite(site);
      } catch (error) {
        logger.error(`Error in periodic ping for ${site.name}:`, error);
      }
    }, intervalMs);
    
    pingTimers.set(site.id, timerId);
    logger.info(`Started periodic ping for ${site.name} every ${site.interval} seconds`);
  });
};

/**
 * Tüm periyodik ping işlemlerini durdurma
 */
const stopPeriodicPings = () => {
  pingTimers.forEach((timerId, siteId) => {
    clearInterval(timerId);
    logger.info(`Stopped periodic ping for site ID ${siteId}`);
  });
  pingTimers.clear();
};

/**
 * Site listesini alma
 * @returns {Array} - Site listesi
 */
const getSites = () => {
  return sites;
};

/**
 * Yeni site ekleme
 * @param {Object} siteData - Eklenecek site verileri
 * @returns {Object} - Eklenen site
 */
const addSite = (siteData) => {
  const newId = sites.length > 0 ? Math.max(...sites.map(s => s.id)) + 1 : 1;
  
  const newSite = {
    id: newId,
    url: siteData.url,
    name: siteData.name || siteData.url,
    interval: siteData.interval || 60
  };
  
  sites.push(newSite);
  
  // Yeni site için periyodik ping başlat
  const intervalMs = newSite.interval * 1000;
  const timerId = setInterval(async () => {
    try {
      await pingWebsite(newSite);
    } catch (error) {
      logger.error(`Error in periodic ping for ${newSite.name}:`, error);
    }
  }, intervalMs);
  
  pingTimers.set(newSite.id, timerId);
  logger.info(`Added new site: ${newSite.name} (${newSite.url})`);
  
  return newSite;
};

/**
 * Site silme
 * @param {number} id - Silinecek site ID'si
 * @returns {boolean} - Silme işlemi başarılı mı?
 */
const deleteSite = (id) => {
  const siteId = parseInt(id);
  const siteIndex = sites.findIndex(s => s.id === siteId);
  
  if (siteIndex === -1) {
    return false;
  }
  
  // Site için periyodik ping durdur
  if (pingTimers.has(siteId)) {
    clearInterval(pingTimers.get(siteId));
    pingTimers.delete(siteId);
  }
  
  // Siteyi listeden kaldır
  sites.splice(siteIndex, 1);
  logger.info(`Deleted site with ID ${siteId}`);
  
  return true;
};

/**
 * Site güncelleme
 * @param {number} id - Güncellenecek site ID'si
 * @param {Object} siteData - Güncellenecek site verileri
 * @returns {Object|null} - Güncellenen site veya null
 */
const updateSite = (id, siteData) => {
  const siteId = parseInt(id);
  const siteIndex = sites.findIndex(s => s.id === siteId);
  
  if (siteIndex === -1) {
    return null;
  }
  
  const updatedSite = {
    ...sites[siteIndex],
    ...siteData,
    id: siteId // ID değiştirilemesin
  };
  
  sites[siteIndex] = updatedSite;
  
  // Site için periyodik ping güncelle
  if (pingTimers.has(siteId)) {
    clearInterval(pingTimers.get(siteId));
  }
  
  const intervalMs = updatedSite.interval * 1000;
  const timerId = setInterval(async () => {
    try {
      await pingWebsite(updatedSite);
    } catch (error) {
      logger.error(`Error in periodic ping for ${updatedSite.name}:`, error);
    }
  }, intervalMs);
  
  pingTimers.set(siteId, timerId);
  logger.info(`Updated site: ${updatedSite.name} (${updatedSite.url})`);
  
  return updatedSite;
};

// Uygulama başladığında periyodik pinglari başlat
startPeriodicPings();

module.exports = {
  pingWebsite,
  pingAllSites,
  pingSiteById,
  startPeriodicPings,
  stopPeriodicPings,
  getSites,
  addSite,
  deleteSite,
  updateSite
};
