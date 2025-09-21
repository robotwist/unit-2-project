const mongoose = require('mongoose');

const exchangeSchema = new mongoose.Schema({
    // Item being exchanged
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    
    // Users involved in the exchange
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Exchange type and details
    exchangeType: {
        type: String,
        enum: ['Trade', 'Rent', 'Sell', 'Share'],
        required: true
    },
    
    // For trades - what item is being offered in return
    offeredItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: false // Only required for trades
    },
    
    // For rentals - rental terms
    rentalRate: {
        type: Number, // Rate per day/week/month
        required: false
    },
    rentalPeriod: {
        type: String,
        enum: ['day', 'week', 'month'],
        required: false
    },
    
    // For sales - price negotiation
    offeredPrice: {
        type: Number,
        required: false
    },
    acceptedPrice: {
        type: Number,
        required: false
    },
    
    // Exchange timeline
    proposedStartDate: {
        type: Date,
        required: false
    },
    proposedEndDate: {
        type: Date,
        required: false
    },
    actualStartDate: {
        type: Date,
        required: false
    },
    actualEndDate: {
        type: Date,
        required: false
    },
    
    // Exchange status and communication
    status: {
        type: String,
        enum: ['Pending', 'Negotiating', 'Accepted', 'Active', 'Completed', 'Cancelled', 'Disputed'],
        default: 'Pending'
    },
    
    // Messages and notes
    messages: [{
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Terms and conditions
    terms: {
        type: String,
        default: ''
    },
    
    // Completion details
    completionNotes: {
        type: String,
        default: ''
    },
    
    // Ratings and feedback
    requesterRating: {
        type: Number,
        min: 1,
        max: 5,
        required: false
    },
    ownerRating: {
        type: Number,
        min: 1,
        max: 5,
        required: false
    },
    requesterFeedback: {
        type: String,
        default: ''
    },
    ownerFeedback: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for efficient queries
exchangeSchema.index({ itemId: 1, status: 1 });
exchangeSchema.index({ requesterId: 1, status: 1 });
exchangeSchema.index({ ownerId: 1, status: 1 });

module.exports = mongoose.model('Exchange', exchangeSchema);