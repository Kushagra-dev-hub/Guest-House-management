const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const { ensureAuthenticated, ensureAdmin } = require('./middlewares/auth');
const { roles } = require('./utils/constants');
const serverless = require('serverless-http');  // Ensure this is required for serverless deployment
const MongoStore = require('connect-mongo'); // Import directly
const path = require('path');

const app = express();

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session handling for Vercel (with a fallback for production)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure cookies in production
      sameSite: 'Strict',
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, 
      dbName: process.env.DB_NAME,
      ttl: 60 * 60, // 1 hour session expiry
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 100000,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err.message));

app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth.route'));
app.use('/user', ensureAuthenticated, require('./routes/user.route'));

app.use(
  '/admin', ensureAuthenticated, ensureAdmin,
  require('./routes/admin.route')
);

app.use('/bookings', require('./routes/booking.route'));

// 404 handler
app.use((req, res, next) => {
  next(createHttpError.NotFound());
});

// General error handler
app.use((error, req, res, next) => {
  error.status = error.status || 500;
  res.status(error.status).json({
    error: error.message || 'Internal Server Error',
    status: error.status
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
