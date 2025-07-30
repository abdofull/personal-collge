const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apierror');

const auth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (err) {
      return next(new ApiError(401, 'رمز الدخول غير صالح'));
    }
  }
  if (!token) {
    return next(new ApiError(401, 'غير مصرح'));
  }
};

module.exports = auth;