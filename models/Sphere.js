// models/Sphere.js
const mongoose = require('mongoose');

const sphereSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100, // Prevent excessively long names
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true, // Optimize queries by creatorId
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: function (value) {
                // Ensure no duplicates in the members array
                return Array.isArray(value) && new Set(value.map(String)).size === value.length;
            },
            message: 'Members array contains duplicate entries.',
        },
    }],
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

// Ensure creatorId is not included in members
sphereSchema.pre('save', function (next) {
    if (this.members.includes(this.creatorId)) {
        return next(new Error('Creator cannot be a member of the sphere.'));
    }
    next();
});

module.exports = mongoose.model('Sphere', sphereSchema);
