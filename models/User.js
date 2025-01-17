// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  passwordHash: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: '',
    maxlength: 250,
  },
  location: {
    type: String,
    default: '',
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  sphereId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sphere',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);