// Controllers translate HTTP <-> service calls. They stay thin on purpose:
// read validated input, call the service, send the response.
// (Express 5 automatically forwards errors thrown in async handlers to the error handler.)
const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');

async function signup(req, res) {
  const { username, email, password } = req.body;
  const user = await userService.signup({ username, email, password });
  sendSuccess(res, 201, 'User created successfully', user);
}

async function login(req, res) {
  const { username, email, password } = req.body;
  const result = await userService.login({ username, email, password });
  sendSuccess(res, 200, 'Login successful', result);
}

module.exports = { signup, login };
