// Routes under /api/v1/user
// Each route runs: rate limiter -> validation rules -> validate (400 on failure) -> controller.
// The limiter goes first so that even invalid requests count towards the limit.
const express = require('express');
const { signupRules, loginRules } = require('../validators/user.validators');
const validate = require('../middleware/validate');
const { signupLimiter, loginLimiter } = require('../middleware/rateLimiters');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.post('/signup', signupLimiter, signupRules, validate, userController.signup);
router.post('/login', loginLimiter, loginRules, validate, userController.login);

module.exports = router;
