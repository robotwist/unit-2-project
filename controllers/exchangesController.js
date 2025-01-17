const Exchange = require('../models/Exchange');
const Item = require('../models/Item');
const Request = require('../models/Request'); // Add request line
const exchangesController = {
  // Create a new exchange (when a request is accepted)
  createExchange: async (req, res) => {
    try {
      const requestId = req.params.requestId; 

      const request = await Request.findById(requestId)
        .populate('itemId')
        .populate('requesterId')
        .populate('lenderId');

      if (!request) {
        return res.status(404).send('Request not found.');
      }

      if (request.status !== 'Accepted') {
        return res.status(400).send('Only accepted requests can be converted to exchanges.');
      }

      const newExchange = new Exchange({
        itemId: request.itemId,
        borrowerId: request.requesterId,
        lenderId: request.lenderId,
        startDate: Date.now(), 
        dueDate: // Calculate due date (you can implement your own logic here) 
      });

      await newExchange.save();

      // Update request status to "Borrowed"
      await Request.findByIdAndUpdate(requestId, { status: 'Borrowed' });

      res.redirect(`/exchanges/${newExchange._id}`); 
    } catch (error) {
      console.error('Error creating exchange:', error);
      res.status(500).send('Error creating exchange. Please try again.');
    }
  },

  // Get all exchanges for the current user (borrower or lender)
  getExchanges: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const exchanges = await Exchange.find()
        .or([{ borrowerId: userId }, { lenderId: userId }]) 
        .populate('itemId')
        .populate('borrowerId')
        .populate('lenderId'); 
      res.render('exchanges/index', { exchanges }); 
    } catch (error) {
      console.error('Error fetching exchanges:', error);
      res.status(500).send('Error fetching exchanges.');
    }
  },

  // Get a single exchange
  getExchangeById: async (req, res) => {
    try {
      const exchange = await Exchange.findById(req.params.exchangeId)
        .populate('itemId')
        .populate('borrowerId')
        .populate('lenderId'); 
      if (!exchange) {
        return res.status(404).send('Exchange not found.');
      }
      res.render('exchanges/show', { exchange }); 
    } catch (error) {
      console.error('Error fetching exchange:', error);
      res.status(500).send('Error fetching exchange.');
    }
  },

  // Update exchange status (e.g., "Returned")
  updateExchangeStatus: async (req, res) => {
    try {
      const exchangeId = req.params.exchangeId;
      const { status } = req.body;

      const updatedExchange = await Exchange.findByIdAndUpdate(
        exchangeId,
        { status },
        { new: true } 
      );

      if (!updatedExchange) {
        return res.status(404).send('Exchange not found.');
      }

      // Update item availability status if returned
      if (status === 'Returned') {
        await Item.findByIdAndUpdate(updatedExchange.itemId, { availabilityStatus: 'Available' });
      }

      res.redirect('/exchanges'); 
    } catch (error) {
      console.error('Error updating exchange status:', error);
      res.status(500).send('Error updating exchange status.');
    }
  },
};

module.exports = exchangesController;