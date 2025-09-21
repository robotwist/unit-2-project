// routes/benefitsRoutes.js

const express = require('express');
const router = express.Router();
const benefitsController = require('../controllers/benefitsController');
const isSignedIn = require('../middleware/isSignedIn');

// Get user's personal benefits calculation
router.get('/my-benefits', isSignedIn, benefitsController.calculateUserBenefits);

// Get community benefits overview (public)
router.get('/community-overview', benefitsController.getCommunityBenefitsOverview);

module.exports = router;
