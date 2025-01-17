const Item = require('../models/Item');

const itemsController = {
  // Create a new item
 createItem: async (req, res) => {
  console.log('req.body:', req.body);
  console.log('user:', req.session.user_id)
    try {
      //check if useer is logged in
      if (!req.session.user){
        return res.status(401).send('You must be logged in to create an item.');
      }
      const { name, description, category, condition, image } = req.body;
      const userId = req.session.user_id; // attach user id to form request

      if (!name || !description || !category || !condition) {
        return res.status(400).send('All fields except image are required.');
      }

      // Add validation for required fields here (e.g., name, description)
      const newItem = new Item({
        ...req.body
      });

      await newItem.save();
      res.redirect('/items'); // Redirect to a list of items after creation
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).send('Error creating item. Please try again.');
    }
  },

  // Get all items (you can add filtering later)
  getItems: async (req, res) => {
    try {
      const items = await Item.find().populate('userId'); // Populate the 'userId' field with user data
      res.render('items/index', { items }); 
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).send('Error fetching items.');
    }
  },

  // Get a single item by ID
  getItemById: async (req, res) => {
    try {
      const item = await Item.findById(req.params.itemId).populate('userId');
      if (!item) {
        return res.status(404).send('Item not found.');
      }
      res.render('items/show', { item });
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).send('Error fetching item.');
    }
  },

  // Update an item (example with basic updates)
  updateItem: async (req, res) => {
    try {
      const { name, description, category, condition, image } = req.body;
      const itemId = req.params.itemId;

      // Add validation for required fields here (e.g., name, description)

      const updatedItem = await Item.findByIdAndUpdate(
        itemId,
        { name, description, category, condition, image },
        { new: true } // Return the updated document
      );

      if (!updatedItem) {
        return res.status(404).send('Item not found.');
      }

      res.redirect(`/items/${itemId}`); // Redirect to the updated item's page
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).send('Error updating item.');
    }
  },

  // Delete an item
  deleteItem: async (req, res) => {
    try {
      const itemId = req.params.itemId;
      await Item.findByIdAndDelete(itemId); 
      res.redirect('/items'); // Redirect to the items list after deletion
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).send('Error deleting item.');
    }
  },
};

module.exports = itemsController;