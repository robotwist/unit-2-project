// routes/itemsRoutes.js

const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const isSignedIn = require('../middleware/isSignedIn');
const Item = require('../models/Item'); // Import the Item model
// Create a new item (Protected Route)
router.post('/', isSignedIn, itemsController.createItem);

// Get all items (Protected Route if you want to restrict visibility)
router.get('/', isSignedIn, itemsController.getItems);

// Render form to create a new item (Optional: If using server-side rendering)
router.get('/new', isSignedIn, (req, res) => {
  res.render('items/new'); // Ensure 'items/new.ejs' exists
});

// Get a single item by ID (Protected Route if necessary)
router.get('/:itemId', isSignedIn, itemsController.getItemById);

// Render form to edit an existing item (Optional: If using server-side rendering)
router.get('/:itemId/edit', isSignedIn, async (req, res) => { // Corrected :id to :itemId
  try {
    const item = await Item.findById(req.params.itemId); // Corrected req.params.id to req.params.itemId
    if (!item) {
      return res.status(404).send('Item not found.');
    }
    // Check if the current user is the owner
    if (item.userId.toString() !== req.session.user.id) {
      return res.status(403).send('You are not authorized to edit this item.');
    }
    res.render('items/edit', { item });
  } catch (error) {
    console.error('Error fetching item for edit:', error);
    res.status(500).send('An unexpected error occurred.');
  }
});

// Update an item (Protected Route)
router.put('/:itemId', isSignedIn, itemsController.updateItem);

// Delete an item (Protected Route)
router.delete('/:itemId', isSignedIn, itemsController.deleteItem);

module.exports = router;