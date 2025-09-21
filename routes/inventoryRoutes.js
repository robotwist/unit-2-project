// routes/inventoryRoutes.js

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const isSignedIn = require('../middleware/isSignedIn');

// Get user's personal inventory with analytics
router.get('/', isSignedIn, inventoryController.getPersonalInventory);

// Export inventory data
router.get('/export', isSignedIn, inventoryController.exportInventory);

// Get inventory insights and recommendations
router.get('/insights', isSignedIn, inventoryController.getInventoryInsights);

module.exports = router;
