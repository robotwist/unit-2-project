const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');

// Create a new item
router.post('/', itemsController.createItem);

// Get all items
router.get('/', itemsController.getItems);

// Get a single item
router.get('/:itemId', itemsController.getItemById);

// Update an item
router.put('/:itemId', itemsController.updateItem);

// Delete an item
router.delete('/:itemId', itemsController.deleteItem);

module.exports = router;