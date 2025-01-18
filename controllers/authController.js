const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // For password hashing
const User = require('../models/User'); // Import your User model
const session = require('express-session'); // For session management
const cookieParser = require('cookie-parser'); // For parsing cookies

// Configure session middleware (replace with your preferred configuration)
router.use(cookieParser()); // Add cookie parsing middleware
router.use(session({
  secret: process.env.SESSION_SECRET || 'cookiecrisp', // Replace with a strong, unique secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to 'true' in production for HTTPS
}));

// Sign-up route (GET)
router.get('/sign-up', (req, res) => {
  res.render('auth/sign-up.ejs');
});

// Sign-up route (POST)
router.post('/sign-up', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validate required fields
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Missing required fields: username, password, or email' });
    }

    // Check for existing username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object with hashed password
    const newUser = new User({
      username,
      passwordHash: hashedPassword,
      email,
      // Add other user properties as needed
    });

    // Save the user to the database
    await newUser.save();

    // Redirect to login page or send success response (flexible approach)
    if (process.env.NODE_ENV === 'production') {
      // Send success JSON response for production environments (API)
      res.status(201).json({ message: 'User created successfully' });
    } else {
      // Redirect to login page for development environments
      res.redirect('/auth/login');
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Sign-in route (GET)
router.get('/sign-in', (req, res) => {
  res.render('auth/sign-in.ejs');
});

// Sign-In Handler (POST /auth/sign-in)
router.post('/sign-in', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username (assuming usernames are unique)
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).render('sign-in', { error: 'Invalid username or password.' });
    }

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).render('sign-in', { error: 'Invalid username or password.' });
    }


    // User authenticated, store user information in session
    req.session.user = {
      id: user._id,
      username: user.username,
    };

    // Redirect to items list after successful sign-in
    res.redirect('/items');
  } catch (error) {
    console.error('Error during sign-in:', error);
    res.status(500).render('sign-in', { error: 'An error occurred. Please try again.' });
  }
});

// Sign-Out Handler (GET /auth/sign-out)
router.get('/sign-out', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session during sign-out:', err);
      return res.status(500).send('An error occurred during sign-out.');
    }
    res.redirect('/sign-in');
  });
});

module.exports = router;