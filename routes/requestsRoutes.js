const express = require('express');
const router = express.Router();
const requestsController = require('../controllers/requestsController');

// Create a new request
router.post('/items/:itemId/requests', requestsController.createRequest); 

// Get all requests for the current user
router.get('/', requestsController.getRequests);

// Get a single request
router.get('/:requestId', requestsController.getRequestById);

// Update request status (e.g., accept, deny)
router.put('/:requestId/status', requestsController.updateRequestStatus);

// Delete a request
router.delete('/:requestId', requestsController.deleteRequest);

module.exports = router;
