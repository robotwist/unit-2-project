const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Audio Equipment', 'Video Equipment', 'Photography', 'Books', 'Records', 'Tools', 'Art', 'Electronics', 'Crafts', 'Others'],
        default: 'Others'
    },
    condition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair'],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: [{
        type: String, // Array of image URLs
        required: false
    }],
    provenance: {
        type: String, // History and origin of the item
        default: ''
    },
    technicalDetails: {
        type: String, // Technical specifications and details
        default: ''
    },
    tradeType: {
        type: String,
        enum: ['Trade', 'Rent', 'Sell', 'Share'],
        default: 'Share'
    },
    estimatedValue: {
        type: Number, // Estimated value in dollars
        default: 0
    },
    
    // Community engagement tracking
    viewCount: {
        type: Number,
        default: 0
    },
    lastViewed: {
        type: Date,
        default: null
    },
    
    // Documentation quality score
    documentationScore: {
        type: Number,
        default: 0
    },
    availabilityStatus: {
        type: String,
        enum: ['Available', 'On Loan'],
        default: 'Available'
    },
}, {
  timestamps: true,
});


module.exports = mongoose.model('Item', itemSchema);