const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Render Sign-Up Page
router.get('/sign-up', authController.signUpPage);

// Render Sign-In Page
router.get('/sign-in', authController.signInPage);

// Handle Sign-Out
router.get('/sign-out', authController.signOut);

// Sign-Up Route
router.post('/sign-up', authController.signUp);

// Sign-In Route
router.post('/sign-in', authController.signIn);

module.exports = router;
