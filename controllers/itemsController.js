
const Item = require('../models/Item'); // Adjust the path as necessary

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

// Create a new item

const createItem = async (req, res) => {
  console.log(req.body, "req.body")
  
  try {
    // Extract item details from request body
    const { name, description, category, condition, image } = req.body;

    // Retrieve user ID from session
    const userId = req.session.user.id;

    // Validate input data
    const validationErrors = validateItem(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).render('items/new', { errors: validationErrors, item: req.body });
    }

    // Create and save the new item
    const newItem = new Item({
      name: name.trim(),
      description: description.trim(),
      category,
      condition,
      image: image ? image.trim() : '',
      userId: userId,
    });

    await newItem.save();

    // Redirect to the items list after successful creation
    
    res.redirect('items/new');
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).render('items/new', { error: 'An unexpected error occurred while creating the item. Please try again later.' });
  }
};

// Get all items (optionally filtered by the authenticated user)
const getItems = async (req, res) => {
  console.log(req.session.user.id , "req.session.user.id")
  try {
    let items;
    if (req.session.user && req.session.user.id) {
      // Retrieve items created by the authenticated user
      items = await Item.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
    } else {
      // Retrieve all items (or you can restrict to authenticated users only)
      items = await Item.find().sort({ createdAt: -1 });

    }
   
    res.render('items/index', { 
      items,
      loggedInUser: req.session.user ? req.session.user.id : null} )
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('An unexpected error occurred while fetching items.');
  }
};

// Get a single item by ID
const getItemById = async (req, res) => {
  const { itemId } = req.params;
  const item = await Item.findById(itemId)
    res.render('items/show', { item });
};

// Update an item
const updateItem = async (req, res) => {
  console.log(req.body, "req.body")
  try {
    const { itemId } = req.params;
    const { name, description, category, condition, image } = req.body;

    // Validate user authentication
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).send('You must be logged in to update an item.');
    }

    // Validate input data
    const validationErrors = validateItem(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).render('items/edit', { errors: validationErrors, item: req.body, itemId });
    }

    // Find the item to ensure it exists and belongs to the user
    const existingItem = await Item.findById(itemId);
    if (!existingItem) {
      return res.status(404).send('Item not found.');
    }

    if (existingItem.userId.toString() !== req.session.user.id) {
      return res.status(403).send('You are not authorized to update this item.');
    }

    // Update the item
    existingItem.name = name.trim();
    existingItem.description = description.trim();
    existingItem.category = category;
    existingItem.condition = condition;
    existingItem.image = image ? image.trim() : '';

    await existingItem.save();

    // Redirect to the updated item's page
    res.redirect(`/items/${existingItem._id}`);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).send('An unexpected error occurred while updating the item.');
  }
};

// Delete an item
const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).send('Item not found.');
    }

    if (item.userId.toString() !== req.session.user.id) {
      return res.status(403).send('You are not authorized to delete this item.');
     
    
    }

    await Item.findByIdAndDelete(itemId);

    // Redirect to the items list after deletion
    res.redirect('/items');
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).send('An unexpected error occurred while deleting the item.');
  }
};


module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
};