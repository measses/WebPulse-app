# Web Ping API

Web sitelerinin erişilebilirliğini ve performansını izlemek için geliştirilmiş bir monitoring sistemi.

## Özellikler

- Web sitelerine düzenli aralıklarla HTTP istekleri gönderme
- Yanıt sürelerini (latency) ve durum kodlarını ölçme
- Prometheus formatında metrik çıktısı
- Grafana ile gerçek zamanlı görselleştirme
- Özelleştirilebilir alarm sistemleri
- Kullanıcı dostu web arayüzü

## Teknolojiler

- **Backend**: Node.js, Express
- **Metrik Toplama**: Prometheus
- **Görselleştirme**: Grafana
- **Konteynerizasyon**: Docker, Docker Compose

## Kurulum

1. Repoyu klonlayın:
```bash
git clone https://github.com/kullanici/web-ping-api.git
cd web-ping-api
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Docker Compose ile tüm servisleri başlatın:
```bash
docker-compose up -d
```

4. Tarayıcınızda aşağıdaki adreslere erişin:
   - Web Arayüzü: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001

## Kullanım

1. Web arayüzünden izlemek istediğiniz web sitelerini ekleyin
2. Grafana'da otomatik oluşturulan dashboard'u görüntüleyin
3. Alarm kurallarını özelleştirin

## Lisans

MIT
