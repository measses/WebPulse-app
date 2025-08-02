const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const prometheus = require('./utils/prometheus');
const logger = require('./utils/logger');
const pingRoutes = require('./routes/ping.routes');
const siteRoutes = require('./routes/site.routes');

// Çevre değişkenlerini yükle
dotenv.config();

// Express uygulamasını oluştur
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prometheus metriklerini topla
app.use(prometheus.requestCountMiddleware);
app.use(prometheus.responseTimeMiddleware);

// Statik dosyaları serve et
app.use(express.static(path.join(__dirname, '../public')));

// API rotaları
app.use('/api/ping', pingRoutes);
app.use('/api/sites', siteRoutes);

// Prometheus metrik endpoint'i
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  const metrics = await prometheus.register.metrics();
  res.end(metrics);
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Metrics available at http://localhost:${PORT}/metrics`);
  logger.info(`Web interface available at http://localhost:${PORT}`);
});

// Hata yakalama
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});
