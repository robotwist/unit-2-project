const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();

const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
const multer = require('multer');
const path = require('path');

const itemsRouter = require('./routes/itemsRoutes.js');
const requestsRouter = require('./routes/requestsRoutes.js');
const exchangeRouter = require('./routes/exchangeRoutes.js');
const tradingRouter = require('./routes/tradingRoutes.js');
const inventoryRouter = require('./routes/inventoryRoutes.js');
const benefitsRouter = require('./routes/benefitsRoutes.js');

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded form data
app.use(express.json()); // Parse JSON payloads
app.use(methodOverride('_method')); // Support method override for PUT/DELETE
app.use(express.static('public')); // Serve static files from 'public' directory
app.use(morgan('dev')); // Log HTTP requests

// Make upload middleware available to routes
app.locals.upload = upload;

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
  res.render('auth/sign-in'); 
});

app.get('/critique', isSignedIn, (req, res) => {
  if (req.session.user) {
    res.render('critique/index', { user: req.session.user });
  } else {
    res.redirect('/auth/sign-in');
  }
});

app.get('/trading', isSignedIn, (req, res) => {
  if (req.session.user) {
    res.render('trading/index', { user: req.session.user });
  } else {
    res.redirect('/auth/sign-in');
  }
});

app.get('/inventory', isSignedIn, (req, res) => {
  if (req.session.user) {
    res.render('inventory/personal', { user: req.session.user });
  } else {
    res.redirect('/auth/sign-in');
  }
});

app.get('/benefits', (req, res) => {
  res.render('benefits/index', { user: req.session.user });
});

app.get('/dashboard', isSignedIn, (req, res) => {
  if (req.session.user) {
    res.render('dashboard/index', { user: req.session.user });
  } else {
    res.redirect('/auth/sign-in');
  }
});
// Auth Controller (mounted under '/auth')
app.use('/auth', authController);
app.use('/items', itemsRouter);
app.use('/requests', requestsRouter);
app.use('/exchanges', exchangeRouter);
app.use('/trading', tradingRouter);
app.use('/inventory', inventoryRouter);
app.use('/benefits', benefitsRouter);

// Start Server
app.listen(port, '0.0.0.0', () => {
  console.log(`The Express app is running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
});
  
// Handle Graceful Shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed due to application termination.');
    process.exit(0);
  });
});