import winston from 'winston';

export const errorHandler = (err, req, res, next) => {
  winston.error(`${err.name}: ${err.message} \nStack: ${err.stack}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ success: false, error: messages });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ 
      success: false, 
      error: `Duplicate field value entered: ${field}. Please use another value.` 
    });
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: `Resource not found with id of ${err.value}` });
  }

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
