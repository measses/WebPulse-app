const express = require('express');
const router = express.Router();
const pingService = require('../services/ping.service');
const logger = require('../utils/logger');

/**
 * @route   GET /api/ping
 * @desc    Tüm sitelere ping at
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const results = await pingService.pingAllSites();
    res.json(results);
  } catch (error) {
    logger.error('Error pinging all sites:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/ping/:id
 * @desc    Belirli bir siteye ping at
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pingService.pingSiteById(req.params.id);
    res.json(result);
  } catch (error) {
    logger.error(`Error pinging site ID ${req.params.id}:`, error);
    
    if (error.message === 'Site not found') {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/ping/start
 * @desc    Periyodik ping işlemlerini başlat
 * @access  Public
 */
router.post('/start', (req, res) => {
  try {
    pingService.startPeriodicPings();
    res.json({ message: 'Periodic pings started' });
  } catch (error) {
    logger.error('Error starting periodic pings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/ping/stop
 * @desc    Periyodik ping işlemlerini durdur
 * @access  Public
 */
router.post('/stop', (req, res) => {
  try {
    pingService.stopPeriodicPings();
    res.json({ message: 'Periodic pings stopped' });
  } catch (error) {
    logger.error('Error stopping periodic pings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
