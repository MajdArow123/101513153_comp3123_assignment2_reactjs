// Business logic for user accounts (signup + login).
// Controllers call these functions; they don't touch req/res, which keeps them easy to reason about.
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const config = require('../config/env');
const logger = require('../utils/logger');

// A real bcrypt hash of a random string. When the user does not exist we still
// run bcrypt.compare against this, so "unknown user" takes the same time as
// "wrong password" and an attacker can't tell them apart by timing.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

async function signup({ username, email, password }) {
  // We pick the fields explicitly, so nothing else from the request can sneak in.
  // Duplicate username/email is caught by the unique index (E11000 -> 409 in errorHandler).
  // Relying on the index (instead of "check then insert") also avoids race conditions.
  const user = await User.create({ username, email, password });
  logger.info('User signed up', { userId: user.id });
  return user;
}

function generateToken(userId) {
  // "sub" (subject) is the standard JWT claim for "who this token is about".
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

async function login({ username, email, password }) {
  const filter = username ? { username } : { email };
  const loginBy = username ? 'username' : 'email';

  // Password has select:false on the model, so we must ask for it explicitly here.
  const user = await User.findOne(filter).select('+password');

  const passwordMatches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  if (!user || !passwordMatches) {
    // The log records the real reason; the client only ever sees a generic message.
    logger.warn('Login failed', {
      loginBy,
      identifier: username || email,
      reason: user ? 'wrong_password' : 'user_not_found',
    });
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user.id);
  logger.info('Login successful', { userId: user.id, loginBy });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: config.jwtExpiresIn,
    user, // toJSON on the model removes the password hash
  };
}

module.exports = { signup, login };
