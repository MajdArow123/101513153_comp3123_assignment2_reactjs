// Input rules for signup and login (express-validator).
// Each export is an array of middleware; the `validate` middleware runs after them.
const { body, checkExact } = require('express-validator');

// bcrypt only uses the first 72 bytes of a password, so longer ones would be
// silently truncated. Capping at 72 keeps what users type and what is checked identical.
const PASSWORD_MAX = 72;

// Treat missing, null and "" the same way ("not provided").
const isProvided = (value) => value !== undefined && value !== null && value !== '';

const signupRules = [
  body('username')
    .exists({ values: 'falsy' }).withMessage('Username is required').bail()
    .isString().withMessage('Username must be a string').bail()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    // Only safe characters, so usernames can't contain spaces or symbols like < > or quotes.
    .matches(/^[A-Za-z0-9_.-]+$/).withMessage('Username may only contain letters, numbers, _ . and -'),

  body('email')
    .exists({ values: 'falsy' }).withMessage('Email is required').bail()
    .isString().withMessage('Email must be a string').bail()
    .trim()
    .isLength({ max: 254 }).withMessage('Email is too long')
    .isEmail().withMessage('Email format is invalid')
    .toLowerCase(),

  body('password')
    .exists({ values: 'falsy' }).withMessage('Password is required').bail()
    .isString().withMessage('Password must be a string').bail()
    .isLength({ min: 8, max: PASSWORD_MAX }).withMessage(`Password must be 8-${PASSWORD_MAX} characters`)
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  // Note: passwords are never trimmed, because that would change the password.

  // Reject any field we did not define above (e.g. someone trying to send "role": "admin").
  checkExact([], { message: 'Unknown fields are not allowed' }),
];

const loginRules = [
  body('username')
    .optional({ values: 'falsy' })
    .isString().withMessage('Username must be a string').bail()
    .trim()
    .isLength({ max: 30 }).withMessage('Username is too long'),

  body('email')
    .optional({ values: 'falsy' })
    .isString().withMessage('Email must be a string').bail()
    .trim()
    .isEmail().withMessage('Email format is invalid')
    .toLowerCase(),

  body('password')
    .exists({ values: 'falsy' }).withMessage('Password is required').bail()
    .isString().withMessage('Password must be a string')
    .isLength({ max: PASSWORD_MAX }).withMessage('Password is too long'),

  // The client must identify themselves with exactly one of username OR email.
  body('username').custom((username, { req }) => {
    const hasUsername = isProvided(username);
    const hasEmail = isProvided(req.body?.email);
    if (hasUsername === hasEmail) {
      throw new Error('Provide exactly one of username or email');
    }
    return true;
  }),

  checkExact([], { message: 'Unknown fields are not allowed' }),
];

module.exports = { signupRules, loginRules };
