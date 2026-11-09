// Employee controllers. The user id ALWAYS comes from req.user (set by the auth
// middleware from the JWT), never from the body, params, or query string.
const employeeService = require('../services/employee.service');
const { sendSuccess } = require('../utils/response');

async function list(req, res) {
  const employees = await employeeService.listEmployees(req.user.id);
  sendSuccess(res, 200, 'Employees retrieved successfully', employees);
}

async function create(req, res) {
  const employee = await employeeService.createEmployee(req.user.id, req.body);
  sendSuccess(res, 201, 'Employee created successfully', employee);
}

async function getById(req, res) {
  const employee = await employeeService.getEmployee(req.user.id, req.params.eid);
  sendSuccess(res, 200, 'Employee retrieved successfully', employee);
}

async function update(req, res) {
  const employee = await employeeService.updateEmployee(req.user.id, req.params.eid, req.body);
  sendSuccess(res, 200, 'Employee updated successfully', employee);
}

async function remove(req, res) {
  await employeeService.deleteEmployee(req.user.id, req.query.eid);
  // 204 No Content: success, and by definition there is no response body.
  res.status(204).end();
}

module.exports = { list, create, getById, update, remove };
