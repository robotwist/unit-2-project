
const Item = require('../models/Item'); // Adjust the path as necessary

// Utility function for validating item data
const validateItem = (data) => {
  const { name, description, category, condition, provenance, technicalDetails, tradeType, estimatedValue } = data;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string.');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string.');
  }

  const validCategories = ['Audio Equipment', 'Video Equipment', 'Photography', 'Books', 'Records', 'Tools', 'Art', 'Electronics', 'Crafts', 'Others'];
  if (!category || !validCategories.includes(category)) {
    errors.push(`Category is required and must be one of the following: ${validCategories.join(', ')}.`);
  }

  const validConditions = ['Excellent', 'Good', 'Fair'];
  if (!condition || !validConditions.includes(condition)) {
    errors.push(`Condition is required and must be one of the following: ${validConditions.join(', ')}.`);
  }

  const validTradeTypes = ['Trade', 'Rent', 'Sell', 'Share'];
  if (tradeType && !validTradeTypes.includes(tradeType)) {
    errors.push(`Trade type must be one of the following: ${validTradeTypes.join(', ')}.`);
  }

  if (estimatedValue && (isNaN(estimatedValue) || estimatedValue < 0)) {
    errors.push('Estimated value must be a positive number.');
  }

  return errors;
};

// Create a new item

const createItem = async (req, res) => {
  console.log(req.body, "req.body")
  console.log(req.files, "req.files")
  
  try {
    // Extract item details from request body
    const { name, description, category, condition, provenance, technicalDetails, tradeType, estimatedValue } = req.body;

    // Retrieve user ID from session
    const userId = req.session.user.id;

    // Handle uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

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
      images,
      provenance: provenance ? provenance.trim() : '',
      technicalDetails: technicalDetails ? technicalDetails.trim() : '',
      tradeType: tradeType || 'Share',
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
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

// Get all items with search and filtering
const getItems = async (req, res) => {
  try {
    const { search, category, condition, availability } = req.query;
    const userId = req.session.user ? req.session.user.id : null;
    
    // Build query object
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }
    
    // Condition filter
    if (condition && condition !== 'All') {
      query.condition = condition;
    }
    
    // Availability filter
    if (availability && availability !== 'All') {
      query.availabilityStatus = availability;
    }
    
    // User filter - show user's own items by default, or all items if specified
    const showAllItems = req.query.showAll === 'true';
    if (!showAllItems && userId) {
      query.userId = userId;
    }
    
    // Execute query with population
    const items = await Item.find(query)
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    
    // Get unique categories and conditions for filter dropdowns
    const categories = await Item.distinct('category') || [];
    const conditions = await Item.distinct('condition') || [];
    
    res.render('items/index', { 
      items,
      loggedInUser: userId,
      search: search || '',
      selectedCategory: category || 'All',
      selectedCondition: condition || 'All',
      selectedAvailability: availability || 'All',
      showAllItems: showAllItems || false,
      categories: ['All', ...categories],
      conditions: ['All', ...conditions],
      availabilities: ['All', 'Available', 'On Loan']
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('An unexpected error occurred while fetching items.');
  }
};

// Get community-wide inventory with user information
const getCommunityInventory = async (req, res) => {
  try {
    const { search, category, condition, availability } = req.query;
    const userId = req.session.user ? req.session.user.id : null;
    
    // Build query object
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }
    
    // Condition filter
    if (condition && condition !== 'All') {
      query.condition = condition;
    }
    
    // Availability filter
    if (availability && availability !== 'All') {
      query.availabilityStatus = availability;
    }
    
    // Execute query with full population of user information
    const items = await Item.find(query)
      .populate('userId', 'username bio location profilePicture')
      .sort({ createdAt: -1 });
    
    // Get unique categories and conditions for filter dropdowns
    const categories = await Item.distinct('category') || [];
    const conditions = await Item.distinct('condition') || [];
    
    // Get user statistics
    const userStats = await Item.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', itemCount: '$count' } },
      { $sort: { itemCount: -1 } }
    ]).catch(err => {
      console.error('Error getting user stats:', err);
      return [];
    });
    
    res.render('items/community', { 
      items,
      loggedInUser: userId,
      search: search || '',
      selectedCategory: category || 'All',
      selectedCondition: condition || 'All',
      selectedAvailability: availability || 'All',
      categories: ['All', ...categories],
      conditions: ['All', ...conditions],
      availabilities: ['All', 'Available', 'On Loan'],
      userStats: userStats.slice(0, 10) // Top 10 users by item count
    });
  } catch (error) {
    console.error('Error fetching community inventory:', error);
    res.status(500).send('An unexpected error occurred while fetching the community inventory.');
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
  getCommunityInventory,
  getItemById,
  updateItem,
  deleteItem,
};