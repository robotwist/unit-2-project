const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); 
const User = require('../models/User'); 
const session = require('express-session'); 
const cookieParser = require('cookie-parser'); 

router.use(cookieParser()); 
router.use(session({
  secret: process.env.SESSION_SECRET || 'cookiecrisp', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to 'true' in production for HTTPS
}));

router.get('/sign-up', (req, res) => {
  res.render('auth/sign-up.ejs');
});

router.post('/sign-up', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Missing required fields: username, password, or email' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      passwordHash: hashedPassword,
      email,
     
    });

    await newUser.save();

      res.redirect('/auth/sign-in');
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});


router.get('/sign-in', (req, res) => {
  res.render('auth/sign-in');
});


router.post('/sign-in', async (req, res) => {
  const { username, password } = req.body;

  try {
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).render('auth/sign-in', { error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).render('auth/sign-in', { error: 'Invalid username or password.' });
    }
    
    req.session.user = {
      id: user._id,
      username: user.username,
    };

    res.redirect('/items');
  } catch (error) {
    console.error('Error during sign-in:', error);
    res.status(500).render('auth/sign-in', { error: 'An error occurred. Please try again.' });
  }
});

router.get('/sign-out', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session during sign-out:', err);
      return res.status(500).send('An error occurred during sign-out.');
      res.clearCookie('connect.sid');
    }
    res.redirect('/sign-in');
  });
});

module.exports = router;