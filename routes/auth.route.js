const router = require('express').Router();
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const passport = require('passport');

// Helper for sending validation errors
const sendValidationErrors = (errors, res) => {
  const errorMessages = errors.array().map(err => err.msg);
  return res.status(400).json({ error: errorMessages.join(', ') });
};

router.post('/login', ensureNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ error: info.message || 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    });
  })(req, res, next);
});

router.post('/register', ensureNotAuthenticated, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Email must be a valid email').normalizeEmail().toLowerCase().custom(value => {
    if (!value.endsWith('@lnmiit.ac.in')) {
      throw new Error('Email must end with @lnmiit.ac.in');
    }
    return true;
  }),
  body('password').trim().isLength(8).withMessage('Password should be of minimum length 8'),
  body('password2').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  body('mobileNo').trim().isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationErrors(errors, res);
    }

    const { email } = req.body;
    const doesExist = await User.findOne({ email });
    if (doesExist) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = new User(req.body);
    await user.save();
    return res.json({ success: true, message: 'Successfully registered! Please Log in.' });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', ensureAuthenticated, (req, res, next) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

router.get('/me', ensureAuthenticated, (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      mobileNo: req.user.mobileNo
    }
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

function ensureNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.status(400).json({ error: 'User already authenticated' });
  }
  next();
}

module.exports = router;
