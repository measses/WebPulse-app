const promClient = require('prom-client');
const logger = require('./logger');

// Prometheus kayıt defterini oluştur
const register = new promClient.Registry();

// Default metrikleri ekle
promClient.collectDefaultMetrics({
  register,
  prefix: 'web_ping_api_'
});

// HTTP istek sayacı
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// HTTP yanıt süresi histogramı
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 300, 500, 1000, 2000, 5000],
  registers: [register]
});

// Web ping metrikleri
const pingDuration = new promClient.Gauge({
  name: 'http_ping_duration_ms',
  help: 'HTTP ping request duration in milliseconds',
  labelNames: ['url'],
  registers: [register]
});

const pingStatus = new promClient.Gauge({
  name: 'http_request_status',
  help: 'HTTP ping request status code',
  labelNames: ['url'],
  registers: [register]
});

const pingAvailability = new promClient.Gauge({
  name: 'http_request_availability_percent',
  help: 'HTTP ping request availability percentage',
  labelNames: ['url'],
  registers: [register]
});

const pingErrorsTotal = new promClient.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP ping request errors',
  labelNames: ['url', 'error_type'],
  registers: [register]
});

// HTTP istek sayacı middleware
const requestCountMiddleware = (req, res, next) => {
  const end = res.end;
  res.end = function () {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    });
    end.apply(res, arguments);
  };
  next();
};

// HTTP yanıt süresi middleware
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  const end = res.end;
  res.end = function () {
    const duration = Date.now() - start;
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode
      },
      duration
    );
    end.apply(res, arguments);
  };
  next();
};

// Ping metrikleri güncelleme fonksiyonu
const updatePingMetrics = (url, duration, statusCode, isError = false, errorType = null) => {
  try {
    pingDuration.set({ url }, duration);
    pingStatus.set({ url }, statusCode);
    
    // Erişilebilirlik yüzdesi güncelleme
    if (isError) {
      pingAvailability.set({ url }, 0);
      pingErrorsTotal.inc({ url, error_type: errorType || 'unknown' });
    } else {
      pingAvailability.set({ url }, 100);
    }
  } catch (error) {
    logger.error(`Error updating metrics for ${url}:`, error);
  }
};

module.exports = {
  register,
  requestCountMiddleware,
  responseTimeMiddleware,
  updatePingMetrics,
  pingDuration,
  pingStatus,
  pingAvailability,
  pingErrorsTotal
};
