// Backend Input Validation Middleware
// Intercepts requests and validates schema constraints before routes run

export const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || name.trim() === '') {
    const err = new Error('Name is required.');
    err.statusCode = 400;
    return next(err);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    const err = new Error('Please enter a valid email address.');
    err.statusCode = 400;
    return next(err);
  }

  if (!password || password.length < 6) {
    const err = new Error('Password must be at least 6 characters long.');
    err.statusCode = 400;
    return next(err);
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const err = new Error('Email and password are required.');
    err.statusCode = 400;
    return next(err);
  }

  next();
};

export const validateGoogleLogin = (req, res, next) => {
  const { email } = req.body;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    const err = new Error('Valid email is required for Google Sign-In.');
    err.statusCode = 400;
    return next(err);
  }
  
  next();
};

export const validateMedicine = (req, res, next) => {
  const { 
    name, totalQuantity, currentQuantity, dosesPerDay, refillThreshold, startDate, endDate,
    pillShape, pillColor, refillsRemaining, pharmacyPhone
  } = req.body;

  if (!name || name.trim() === '') {
    const err = new Error('Medication name is required.');
    err.statusCode = 400;
    return next(err);
  }

  if (totalQuantity === undefined || totalQuantity < 1) {
    const err = new Error('Total capacity quantity must be at least 1.');
    err.statusCode = 400;
    return next(err);
  }

  if (currentQuantity === undefined || currentQuantity < 0) {
    const err = new Error('Current stock quantity cannot be negative.');
    err.statusCode = 400;
    return next(err);
  }

  if (currentQuantity > totalQuantity) {
    const err = new Error('Current stock cannot exceed total capacity.');
    err.statusCode = 400;
    return next(err);
  }

  if (dosesPerDay === undefined || dosesPerDay < 1) {
    const err = new Error('Scheduled daily doses must be at least 1.');
    err.statusCode = 400;
    return next(err);
  }

  if (refillThreshold !== undefined && (isNaN(refillThreshold) || refillThreshold < 0)) {
    const err = new Error('Refill alert threshold must be 0 or greater.');
    err.statusCode = 400;
    return next(err);
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    const err = new Error('Medication start date cannot be after the end date.');
    err.statusCode = 400;
    return next(err);
  }

  if (pillShape && !['Tablet', 'Capsule', 'Liquid', 'Drops'].includes(pillShape)) {
    const err = new Error('Invalid pill shape.');
    err.statusCode = 400;
    return next(err);
  }

  if (pillColor && !['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'White'].includes(pillColor)) {
    const err = new Error('Invalid pill color.');
    err.statusCode = 400;
    return next(err);
  }

  if (refillsRemaining !== undefined && (isNaN(refillsRemaining) || refillsRemaining < 0)) {
    const err = new Error('Refills remaining must be 0 or greater.');
    err.statusCode = 400;
    return next(err);
  }

  next();
};


