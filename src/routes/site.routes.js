const express = require('express');
const router = express.Router();
const pingService = require('../services/ping.service');
const logger = require('../utils/logger');

/**
 * @route   GET /api/sites
 * @desc    Tüm siteleri listele
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const sites = pingService.getSites();
    res.json(sites);
  } catch (error) {
    logger.error('Error getting sites:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/sites
 * @desc    Yeni site ekle
 * @access  Public
 */
router.post('/', (req, res) => {
  try {
    const { url, name, interval } = req.body;
    
    // URL kontrolü
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // URL formatı kontrolü
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    const newSite = pingService.addSite({
      url,
      name: name || url,
      interval: interval || 60
    });
    
    res.status(201).json(newSite);
  } catch (error) {
    logger.error('Error adding site:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   DELETE /api/sites/:id
 * @desc    Site sil
 * @access  Public
 */
router.delete('/:id', (req, res) => {
  try {
    const success = pingService.deleteSite(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    res.json({ message: 'Site deleted' });
  } catch (error) {
    logger.error(`Error deleting site ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   PUT /api/sites/:id
 * @desc    Site güncelle
 * @access  Public
 */
router.put('/:id', (req, res) => {
  try {
    const { url, name, interval } = req.body;
    
    // URL formatı kontrolü (eğer varsa)
    if (url) {
      try {
        new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }
    
    const updatedSite = pingService.updateSite(req.params.id, {
      url,
      name,
      interval
    });
    
    if (!updatedSite) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    res.json(updatedSite);
  } catch (error) {
    logger.error(`Error updating site ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
