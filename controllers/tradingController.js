const Exchange = require('../models/Exchange');
const Item = require('../models/Item');
const User = require('../models/User');

// Create a new exchange request
const createExchange = async (req, res) => {
    try {
        const { 
            itemId, 
            exchangeType, 
            offeredItemId, 
            offeredPrice, 
            rentalRate, 
            rentalPeriod,
            proposedStartDate,
            proposedEndDate,
            message,
            terms
        } = req.body;

        const requesterId = req.session.user.id;

        // Validate that the item exists and get owner info
        const item = await Item.findById(itemId).populate('userId', 'username');
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const ownerId = item.userId._id;

        // Can't request your own item
        if (requesterId === ownerId.toString()) {
            return res.status(400).json({ error: 'Cannot request your own item' });
        }

        // Validate exchange type specific requirements
        if (exchangeType === 'Trade' && !offeredItemId) {
            return res.status(400).json({ error: 'Trade item required for trades' });
        }

        if (exchangeType === 'Rent' && (!rentalRate || !rentalPeriod)) {
            return res.status(400).json({ error: 'Rental rate and period required for rentals' });
        }

        if (exchangeType === 'Sell' && !offeredPrice) {
            return res.status(400).json({ error: 'Offered price required for sales' });
        }

        // Check for existing pending exchange for this item
        const existingExchange = await Exchange.findOne({
            itemId,
            requesterId,
            status: { $in: ['Pending', 'Negotiating'] }
        });

        if (existingExchange) {
            return res.status(400).json({ error: 'You already have a pending request for this item' });
        }

        // Create the exchange
        const exchange = new Exchange({
            itemId,
            requesterId,
            ownerId,
            exchangeType,
            offeredItemId: exchangeType === 'Trade' ? offeredItemId : undefined,
            offeredPrice: exchangeType === 'Sell' ? offeredPrice : undefined,
            rentalRate: exchangeType === 'Rent' ? rentalRate : undefined,
            rentalPeriod: exchangeType === 'Rent' ? rentalPeriod : undefined,
            proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : undefined,
            proposedEndDate: proposedEndDate ? new Date(proposedEndDate) : undefined,
            terms: terms || '',
            messages: message ? [{
                senderId: requesterId,
                message: message
            }] : []
        });

        await exchange.save();

        // Populate the exchange with user and item details
        await exchange.populate([
            { path: 'requesterId', select: 'username' },
            { path: 'ownerId', select: 'username' },
            { path: 'itemId', select: 'name category' },
            { path: 'offeredItemId', select: 'name category' }
        ]);

        res.status(201).json({ 
            message: 'Exchange request created successfully',
            exchange 
        });

    } catch (error) {
        console.error('Error creating exchange:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get exchanges for a user (as requester or owner)
const getUserExchanges = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { type = 'all', status = 'all' } = req.query;

        let query = {
            $or: [
                { requesterId: userId },
                { ownerId: userId }
            ]
        };

        if (status !== 'all') {
            query.status = status;
        }

        const exchanges = await Exchange.find(query)
            .populate('requesterId', 'username')
            .populate('ownerId', 'username')
            .populate('itemId', 'name category images')
            .populate('offeredItemId', 'name category images')
            .sort({ createdAt: -1 });

        // Filter by type if specified
        let filteredExchanges = exchanges;
        if (type !== 'all') {
            filteredExchanges = exchanges.filter(exchange => exchange.exchangeType === type);
        }

        res.json({ exchanges: filteredExchanges });

    } catch (error) {
        console.error('Error fetching user exchanges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a specific exchange
const getExchange = async (req, res) => {
    try {
        const { exchangeId } = req.params;
        const userId = req.session.user.id;

        const exchange = await Exchange.findById(exchangeId)
            .populate('requesterId', 'username email')
            .populate('ownerId', 'username email')
            .populate('itemId')
            .populate('offeredItemId');

        if (!exchange) {
            return res.status(404).json({ error: 'Exchange not found' });
        }

        // Check if user is involved in this exchange
        if (exchange.requesterId._id.toString() !== userId && exchange.ownerId._id.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ exchange });

    } catch (error) {
        console.error('Error fetching exchange:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update exchange status (accept, decline, complete, etc.)
const updateExchangeStatus = async (req, res) => {
    try {
        const { exchangeId } = req.params;
        const { status, message, acceptedPrice, terms } = req.body;
        const userId = req.session.user.id;

        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return res.status(404).json({ error: 'Exchange not found' });
        }

        // Only the owner can accept/decline, both parties can complete/cancel
        if (status === 'Accepted' && exchange.ownerId.toString() !== userId) {
            return res.status(403).json({ error: 'Only the item owner can accept requests' });
        }

        // Update the exchange
        exchange.status = status;
        
        if (acceptedPrice) {
            exchange.acceptedPrice = acceptedPrice;
        }
        
        if (terms) {
            exchange.terms = terms;
        }

        // Add message if provided
        if (message) {
            exchange.messages.push({
                senderId: userId,
                message: message
            });
        }

        // Set actual dates when status changes to Active
        if (status === 'Active') {
            exchange.actualStartDate = new Date();
        }

        // Set end date when status changes to Completed
        if (status === 'Completed') {
            exchange.actualEndDate = new Date();
        }

        await exchange.save();

        res.json({ 
            message: 'Exchange status updated successfully',
            exchange 
        });

    } catch (error) {
        console.error('Error updating exchange status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add message to exchange
const addMessage = async (req, res) => {
    try {
        const { exchangeId } = req.params;
        const { message } = req.body;
        const userId = req.session.user.id;

        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return res.status(404).json({ error: 'Exchange not found' });
        }

        // Check if user is involved in this exchange
        if (exchange.requesterId.toString() !== userId && exchange.ownerId.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Add the message
        exchange.messages.push({
            senderId: userId,
            message: message
        });

        // Update status to Negotiating if it's still Pending
        if (exchange.status === 'Pending') {
            exchange.status = 'Negotiating';
        }

        await exchange.save();

        res.json({ 
            message: 'Message added successfully',
            exchange 
        });

    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Complete exchange with rating and feedback
const completeExchange = async (req, res) => {
    try {
        const { exchangeId } = req.params;
        const { rating, feedback, completionNotes } = req.body;
        const userId = req.session.user.id;

        const exchange = await Exchange.findById(exchangeId);
        if (!exchange) {
            return res.status(404).json({ error: 'Exchange not found' });
        }

        // Check if user is involved in this exchange
        if (exchange.requesterId.toString() !== userId && exchange.ownerId.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Determine if user is requester or owner and set appropriate fields
        if (exchange.requesterId.toString() === userId) {
            exchange.requesterRating = rating;
            exchange.requesterFeedback = feedback;
        } else {
            exchange.ownerRating = rating;
            exchange.ownerFeedback = feedback;
        }

        if (completionNotes) {
            exchange.completionNotes = completionNotes;
        }

        // Mark as completed if both parties have rated
        if (exchange.requesterRating && exchange.ownerRating) {
            exchange.status = 'Completed';
            exchange.actualEndDate = new Date();
        }

        await exchange.save();

        res.json({ 
            message: 'Exchange completion updated successfully',
            exchange 
        });

    } catch (error) {
        console.error('Error completing exchange:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get available items for trading (items the user owns)
const getAvailableItemsForTrade = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const items = await Item.find({
            userId: userId,
            availabilityStatus: 'Available'
        }).select('name category images tradeType estimatedValue');

        res.json({ items });

    } catch (error) {
        console.error('Error fetching available items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createExchange,
    getUserExchanges,
    getExchange,
    updateExchangeStatus,
    addMessage,
    completeExchange,
    getAvailableItemsForTrade
};
