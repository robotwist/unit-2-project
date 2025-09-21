// routes/tradingRoutes.js

const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');
const isSignedIn = require('../middleware/isSignedIn');

// Create a new exchange request
router.post('/', isSignedIn, tradingController.createExchange);

// Get user's exchanges (as requester or owner)
router.get('/my-exchanges', isSignedIn, tradingController.getUserExchanges);

// Get available items for trading
router.get('/available-items', isSignedIn, tradingController.getAvailableItemsForTrade);

// Get a specific exchange
router.get('/:exchangeId', isSignedIn, tradingController.getExchange);

// Update exchange status (accept, decline, complete, etc.)
router.put('/:exchangeId/status', isSignedIn, tradingController.updateExchangeStatus);

// Add message to exchange
router.post('/:exchangeId/messages', isSignedIn, tradingController.addMessage);

// Complete exchange with rating and feedback
router.post('/:exchangeId/complete', isSignedIn, tradingController.completeExchange);

module.exports = router;
