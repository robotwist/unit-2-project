const express = require('express');
const router = express.Router();
const exchangesController = require('../controllers/exchangesController');

// Create a new exchange
router.post('/', exchangesController.createExchange); 

// Get all exchanges for the current user
router.get('/', exchangesController.getExchanges);

// Get a single exchange
router.get('/:exchangeId', exchangesController.getExchangeById);

// Update exchange status (e.g., "Returned")
router.put('/:exchangeId/status', exchangesController.updateExchangeStatus);

module.exports = router;