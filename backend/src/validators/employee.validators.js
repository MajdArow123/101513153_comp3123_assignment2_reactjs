// Input rules for employee routes (express-validator).
const { body, param, query, checkExact } = require('express-validator');

// Builds the rule for a required-or-optional text field: trim -> not empty -> length check.
// Values are stored exactly as typed (e.g. "O'Brien"), not HTML-escaped. This is a JSON API,
// so escaping is the job of whatever page eventually displays the data.
function textField(name, label, max, { optional }) {
  let chain = body(name);
  chain = optional
    ? chain.optional()
    : chain.exists({ values: 'null' }).withMessage(`${label} is required`).bail();

  return chain
    .isString().withMessage(`${label} must be a string`).bail()
    .trim()
    .notEmpty().withMessage(`${label} cannot be empty`).bail()
    .isLength({ max }).withMessage(`${label} must be at most ${max} characters`);
}

// The shared set of field rules. `optional` is true for updates (PUT can change a subset).
// These work for JSON and for multipart forms: in a form every value arrives as a string,
// and toFloat()/toDate() convert salary and date_of_joining to the right types.
// The picture is a file (req.file), not a body field, so checkExact never sees it, and a
// text field called "profile_picture" is rejected as unknown (clients can't set the path).
function employeeFields({ optional }) {
  const required = (chain, label) =>
    optional ? chain.optional() : chain.exists({ values: 'null' }).withMessage(`${label} is required`).bail();

  return [
    textField('first_name', 'First name', 50, { optional }),
    textField('last_name', 'Last name', 50, { optional }),

    required(body('email'), 'Email')
      .isString().withMessage('Email must be a string').bail()
      .trim()
      .isLength({ max: 254 }).withMessage('Email is too long')
      .isEmail().withMessage('Email format is invalid')
      .toLowerCase(),

    textField('position', 'Position', 100, { optional }),

    required(body('salary'), 'Salary')
      // gt: 0 -> must be strictly positive; max stops absurd values.
      .isFloat({ gt: 0, max: 1_000_000_000 }).withMessage('Salary must be a number greater than 0')
      .toFloat(),

    required(body('date_of_joining'), 'Date of joining')
      // strict: rejects impossible dates like 2024-02-30.
      .isISO8601({ strict: true }).withMessage('Date of joining must be a valid ISO 8601 date (e.g. 2024-01-15)')
      .toDate(),

    textField('department', 'Department', 100, { optional }),
  ];
}

const eidParamRule = param('eid').isMongoId().withMessage('Invalid employee id');

const createRules = [
  ...employeeFields({ optional: false }),
  // The owner always comes from the JWT. A "user" field in the body is allowed
  // through validation but ignored by the service, as the assignment requires.
  body('user').optional(),
  checkExact([], { message: 'Unknown fields are not allowed', locations: ['body'] }),
];

const updateRules = [
  eidParamRule,
  ...employeeFields({ optional: true }),
  // Changing the owner is never allowed, so we reject it clearly instead of silently ignoring it.
  body('user').not().exists().withMessage('The owner (user) field cannot be changed'),
  // checkExact only knows about the rules that ran BEFORE it, so it must come
  // before the whole-body check below (which would otherwise mark every field as "known").
  checkExact([], { message: 'Unknown fields are not allowed', locations: ['body'] }),
  // An empty PUT would be a no-op; tell the client instead.
  // A new picture on its own counts as a change, so a picture-only PUT is allowed.
  body().custom((value, { req }) => {
    if (req.file) return true;
    if (!value || Object.keys(value).length === 0) throw new Error('Provide at least one field to update');
    return true;
  }),
];

const getByIdRules = [eidParamRule];

const deleteRules = [
  // For DELETE the id comes from the query string: /employees?eid=xxx
  query('eid')
    .exists({ values: 'falsy' }).withMessage('Query parameter eid is required').bail()
    .isMongoId().withMessage('Invalid employee id'),
];

// One optional search term from the query string: must be a single string, trimmed, max 100 chars.
// (?department=a&department=b would arrive as an array, and isString rejects it.)
function searchTerm(name, label) {
  return query(name)
    .optional()
    .isString().withMessage(`${label} must be a single text value`).bail()
    .trim()
    .isLength({ max: 100 }).withMessage(`${label} must be at most 100 characters`);
}

// Not sent, or only spaces. (Wrong types such as arrays are NOT "missing";
// searchTerm() reports those with a clearer message.)
const isMissing = (value) => value === undefined || (typeof value === 'string' && value.trim() === '');

const searchRules = [
  // A search with no terms would just be the full list, so require at least one.
  // This check runs FIRST on purpose: each rule stores the value it saw, and the last
  // rule for a field wins in matchedData(). Running the trim rules below last means
  // the controller gets the trimmed values.
  query('department').custom((department, { req }) => {
    if (isMissing(department) && isMissing(req.query.position)) {
      throw new Error('Provide at least one search term: department or position');
    }
    return true;
  }),
  searchTerm('department', 'Department'),
  searchTerm('position', 'Position'),
  // Reject anything else in the query string (e.g. ?salary=1 or ?department[$ne]=x).
  checkExact([], { message: 'Unknown query parameters are not allowed', locations: ['query'] }),
];

module.exports = { createRules, updateRules, getByIdRules, deleteRules, searchRules };
