const Request = require('../models/Request');
const Item = require('../models/Item'); 

const requestsController = {
  // Create a new request
  createRequest: async (req, res) => {
    try {
      const { itemId } = req.params; 
      const requesterId = req.session.user._id; 
      const lenderId = await Item.findById(itemId).select('userId'); 

      const newRequest = new Request({
        itemId,
        requesterId,
        lenderId: lenderId.userId, 
      });

      await newRequest.save();
      res.redirect(`/items/${itemId}`); // Redirect to the item page after creating the request
    } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).send('Error creating request. Please try again.');
    }
  },

  // Get all requests (for a specific user - this can be refined later)
  getRequests: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const requests = await Request.find({ requesterId: userId }).populate('itemId').populate('lenderId');
      res.render('requests/index', { requests }); 
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).send('Error fetching requests.');
    }
  },

  // Get a single request (for details)
  getRequestById: async (req, res) => {
    try {
      const request = await Request.findById(req.params.requestId)
        .populate('itemId')
        .populate('requesterId')
        .populate('lenderId');
      if (!request) {
        return res.status(404).send('Request not found.');
      }
      res.render('requests/show', { request }); 
    } catch (error) {
      console.error('Error fetching request:', error);
      res.status(500).send('Error fetching request.');
    }
  },

  // Update request status (example: accept request)
  updateRequestStatus: async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const { status } = req.body; 

      const updatedRequest = await Request.findByIdAndUpdate(
        requestId,
        { status },
        { new: true } 
      );

      if (!updatedRequest) {
        return res.status(404).send('Request not found.');
      }

      // Update item availability status (if accepted)
      if (status === 'Accepted') {
        await Item.findByIdAndUpdate(updatedRequest.itemId, { availabilityStatus: 'On Loan' });
      }

      res.redirect('/requests'); // Redirect to the requests list 
    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).send('Error updating request status.');
    }
  },

  // Delete a request (might not always be necessary)
  deleteRequest: async (req, res) => {
    try {
      const requestId = req.params.requestId;
      await Request.findByIdAndDelete(requestId);
      res.redirect('/requests'); 
    } catch (error) {
      console.error('Error deleting request:', error);
      res.status(500).send('Error deleting request.');
    }
  },
};

module.exports = requestsController;