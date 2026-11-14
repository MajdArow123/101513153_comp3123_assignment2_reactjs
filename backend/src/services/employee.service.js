// Business logic for employees.
// Every function receives the logged-in user's id (from the JWT) and uses it in
// EVERY database query, so a user can only ever see or change their own employees.
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const escapeRegex = require('../utils/escapeRegex');
const { toPublicPath, deleteUpload } = require('../utils/uploadFiles');

// Only these fields can be set by a client. Anything else (user, _id, timestamps)
// is dropped, so the owner can never be set or changed from the request body.
const EDITABLE_FIELDS = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];

function pickEditable(data) {
  const out = {};
  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) out[field] = data[field];
  }
  return out;
}

// Loads an employee and checks the caller owns it.
// We look it up by id first (not by id + owner) so we can tell apart:
//   404 -> the employee does not exist at all
//   403 -> it exists, but belongs to someone else
async function findOwnedEmployee(userId, employeeId, action) {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  if (employee.user.toString() !== userId) {
    // Someone tried to touch another user's data: worth recording.
    logger.warn('Authorization failed: user does not own this employee', {
      action,
      userId,
      employeeId,
    });
    throw new AppError('Forbidden: you do not have access to this employee', 403);
  }

  return employee;
}

async function listEmployees(userId) {
  return Employee.find({ user: userId }).sort({ created_at: -1 });
}

// Case-insensitive partial match on department and/or position.
// The filter ALWAYS starts with the owner, so a search can never return
// another user's employees, whatever the search terms are.
async function searchEmployees(userId, { department, position }) {
  const filter = { user: userId };

  // The text is escaped first, so it is matched literally (no regex tricks).
  if (department) filter.department = { $regex: escapeRegex(department), $options: 'i' };
  if (position) filter.position = { $regex: escapeRegex(position), $options: 'i' };

  const employees = await Employee.find(filter).sort({ created_at: -1 }); // same order as the list

  // Log which fields were searched and how many matched, but not the search text itself.
  logger.info('Employee search', {
    userId,
    fields: Object.keys(filter).filter((key) => key !== 'user'),
    resultCount: employees.length,
  });

  return employees; // [] when nothing matches -> still a 200
}

// `file` is the uploaded picture from Multer (or undefined). If saving fails,
// the error handler deletes the file, so no orphan images are left behind.
async function createEmployee(userId, data, file) {
  // The owner is set from the JWT; any "user" in the body was already discarded by pickEditable.
  const employee = await Employee.create({
    ...pickEditable(data),
    profile_picture: file ? toPublicPath(file.filename) : null,
    user: userId,
  });
  logger.info('Employee created', { userId, employeeId: employee.id, withPicture: Boolean(file) });
  return employee;
}

async function getEmployee(userId, employeeId) {
  return findOwnedEmployee(userId, employeeId, 'read');
}

async function updateEmployee(userId, employeeId, data, file) {
  // Ownership is checked BEFORE any picture is attached. If this throws 403/404,
  // the error handler deletes the newly uploaded file, so nobody can put a picture
  // on another user's employee.
  const existing = await findOwnedEmployee(userId, employeeId, 'update');

  const changes = pickEditable(data);
  if (file) changes.profile_picture = toPublicPath(file.filename);

  // The filter includes the owner too, so even the write itself can only
  // ever touch this user's document (defence in depth).
  const updated = await Employee.findOneAndUpdate(
    { _id: employeeId, user: userId },
    changes,
    { returnDocument: 'after', runValidators: true } // return the new version, and enforce schema rules on updates
  );

  // Only after the database points at the new picture do we delete the old file.
  // (If the update had failed, the old picture would still be in use.)
  if (file && existing.profile_picture) {
    await deleteUpload(existing.profile_picture);
  }

  logger.info('Employee updated', { userId, employeeId, pictureReplaced: Boolean(file) });
  return updated;
}

async function deleteEmployee(userId, employeeId) {
  const employee = await findOwnedEmployee(userId, employeeId, 'delete');
  await Employee.deleteOne({ _id: employeeId, user: userId });

  // Remove the stored picture too, so deleted employees don't leave files behind.
  await deleteUpload(employee.profile_picture);

  logger.info('Employee deleted', { userId, employeeId });
}

module.exports = { listEmployees, searchEmployees, createEmployee, getEmployee, updateEmployee, deleteEmployee };
