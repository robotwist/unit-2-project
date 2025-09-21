// routes/itemsRoutes.js

const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const isSignedIn = require('../middleware/isSignedIn');
const Item = require('../models/Item'); // Import the Item model

// Create a new item (Protected Route with file upload)
router.post('/', isSignedIn, (req, res, next) => {
  const upload = req.app.locals.upload;
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).render('items/new', { 
        error: 'Error uploading images. Please ensure you are uploading image files only.',
        item: req.body 
      });
    }
    next();
  });
}, itemsController.createItem);

// Get all items (Protected Route if you want to restrict visibility)
router.get('/', isSignedIn, itemsController.getItems);

// Render form to create a new item (Optional: If using server-side rendering)
router.get('/new', isSignedIn, (req, res) => {
  res.render('items/new'); // Ensure 'items/new.ejs' exists
});

// Community inventory - shows all items with user info (MUST come before :itemId route)
router.get('/community', isSignedIn, itemsController.getCommunityInventory);

// Get a single item by ID (Protected Route if necessary)
router.get('/:itemId', isSignedIn, itemsController.getItemById);

// Render form to edit an existing item (Optional: If using server-side rendering)
router.get('/edit/:itemId', isSignedIn, async (req, res) => { // Corrected :id to :itemId
  try {
    const item = await Item.findById(req.params.itemId)
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