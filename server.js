const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();

const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');

const itemsRouter = require('./routes/itemsRoutes.js');
const requestsRouter = require('./routes/requestsRoutes.js');

const requestsController = require('./routes/requestsRoutes.js');
const itemsController = require('./controllers/itemsController.js');

const authController = require('./controllers/authController.js');
const isSignedIn = require('./middleware/isSignedIn.js');
const passUserToView = require('./middleware/passUserToView.js');

const port = process.env.PORT || 3045;

// MongoDB Connection (using environment variables)
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log(`Connected to MongoDB: ${mongoose.connection.name}`))
.catch(err => console.error(`MongoDB connection error: ${err}`));

// Improved Mongoose connection handling
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB: ${mongoose.connection.name}');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB connection disconnected.');
});

// Middleware
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded form data
app.use(express.json()); // Parse JSON payloads
app.use(methodOverride('_method')); // Support method override for PUT/DELETE
app.use(express.static('public')); // Serve static files from 'public' directory
app.use(morgan('dev')); // Log HTTP requests

// Session Configuration (using environment variables)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cookiecrisp',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false,
              httpOnly: true,
              maxAge: 1000 * 60 * 60 * 24 * 7
     },
  })
);

// View Engine
app.set('view engine', 'ejs');
app.set('views', './views');


// Custom Middleware to Pass User to Views
app.use(passUserToView);

// Routes
app.get('/', (req, res) => {
  res.render('index.ejs', {
    user: req.session.user,
  });
});

app.get('/sign-in', (req, res) => {
  res.render('sign-in'); // Ensure 'sign-in.ejs' exists in the 'views' directory
});

app.get('/vip-lounge', isSignedIn, (req, res) => {
  if (req.session.user) {
    res.send('Welcome to the party, ${req.session.user.username}.');
  } else {
    res.send('Sorry, no guests allowed.');
  }
});
// Auth Controller (mounted under '/auth')
app.use('/auth', authController);
app.use('/items', itemsRouter);
app.use('/requests', requestsRouter);

// Start Server
app.listen(port, () => {
  console.log('The Express app is running on http:localhost:${port}');
});

// Handle Graceful Shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed due to application termination.');
    process.exit(0);
  });
});