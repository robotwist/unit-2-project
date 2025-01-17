// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50, // Ensure reasonable username length
  },
  email: {
    type: String,
    required: true, // Email is now required
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
    maxlength: 250, // Limit bio length
  },
  location: {
    type: String,
    default: '',
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150', // Default placeholder
  },
  sphereId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sphere',
  },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

// Password hashing before saving
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('passwordHash')) return next(); // Skip hashing if password is not modified

    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10; // Use env variable or fallback to 10
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (err) {
    next(err); // Pass errors to the next middleware
  }
});

// Method to compare entered password with stored hash
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
