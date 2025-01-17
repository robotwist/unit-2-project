const Item = require('../models/Item');

// Utility function for validating item data
const validateItem = (data) => {
  const { name, description, category, condition, image } = data;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string.');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string.');
  }

  const validCategories = ['Books', 'Records', 'Games', 'Art', 'Electronics', 'Others'];
  if (!category || !validCategories.includes(category)) {
    errors.push(`Category is required and must be one of the following: ${validCategories.join(', ')}.`);
  }

  const validConditions = ['Excellent', 'Good', 'Fair'];
  if (!condition || !validConditions.includes(condition)) {
    errors.push(`Condition is required and must be one of the following: ${validConditions.join(', ')}.`);
  }

  if (image && typeof image !== 'string') {
    errors.push('Image URL must be a string.');
  }

  return errors;
};

const itemsController = {
  // Create a new item
  createItem: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.session.user) {
        return res.status(401).send('You must be logged in to create an item.');
      }

      const { name, description, category, condition, image } = req.body;
      const userId = req.session.user_id; // Attach user ID to form request

      // Validate input data
      const validationErrors = validateItem(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      const newItem = new Item({
        name: name.trim(),
        description: description.trim(),
        category,
        condition,
        image: image ? image.trim() : '',
        userId,
      });

      await newItem.save();
      res.redirect('/items'); // Redirect to a list of items after creation
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).send('An unexpected error occurred while creating the item. Please try again later.');
    }
  },

  // Get all items (you can add filtering later)
  getItems: async (req, res) => {
    try {
      const items = await Item.find().populate('userId'); // Populate the 'userId' field with user data
      res.render('items/index', { items });
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).send('An unexpected error occurred while fetching items.');
    }
  },

  // Get a single item by ID
  getItemById: async (req, res) => {
    try {
      const { itemId } = req.params;

      if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).send('Invalid item ID format.');
      }

      const item = await Item.findById(itemId).populate('userId');
      if (!item) {
        return res.status(404).send('Item not found.');
      }
      res.render('items/show', { item });
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).send('An unexpected error occurred while fetching the item.');
    }
  },

  // Update an item (example with basic updates)
  updateItem: async (req, res) => {
    try {
      // Check if user is authorized to update the item
      if (!req.session.user) {
        return res.status(401).send('You must be logged in to update an item.');
      }

      const { itemId } = req.params;
      const { name, description, category, condition, image } = req.body;

      // Validate input data
      const validationErrors = validateItem(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      // Ensure the item exists and belongs to the user
      const existingItem = await Item.findById(itemId);
      if (!existingItem) {
        return res.status(404).send('Item not found.');
      }

      if (existingItem.userId.toString() !== req.session.user_id) {
        return res.status(403).send('You are not authorized to update this item.');
      }

      const updatedItem = await Item.findByIdAndUpdate(
        itemId,
        {
          name: name.trim(),
          description: description.trim(),
          category,
          condition,
          image: image ? image.trim() : '',
        },
        { new: true, runValidators: true } // Return the updated document and run validators
      );

      res.redirect(`/items/${updatedItem._id}`); // Redirect to the updated item's page
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).send('An unexpected error occurred while updating the item.');
    }
  },

  // Delete an item
  deleteItem: async (req, res) => {
    try {
      // Check if user is authorized to delete the item
      if (!req.session.user) {
        return res.status(401).send('You must be logged in to delete an item.');
      }

      const { itemId } = req.params;

      if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).send('Invalid item ID format.');
      }

      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).send('Item not found.');
      }

      if (item.userId.toString() !== req.session.user_id) {
        return res.status(403).send('You are not authorized to delete this item.');
      }

      await Item.findByIdAndDelete(itemId);
      res.redirect('/items'); // Redirect to the items list after deletion
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).send('An unexpected error occurred while deleting the item.');
    }
  },
};

module.exports = itemsController;