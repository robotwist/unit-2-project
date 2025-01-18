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
        enum: ['Books', 'Records', 'Games', 'Art', 'Electronics', 'Others'],
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
    image: {
        type: String, // URL to the image
        default: ''
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