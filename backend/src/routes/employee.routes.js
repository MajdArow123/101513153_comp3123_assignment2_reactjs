// Routes under /api/v1/emp — all of them require a valid JWT.
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const rules = require('../validators/employee.validators');
const employeeController = require('../controllers/employee.controller');

const router = express.Router();

// Applied to every route below: no valid token -> 401 before anything else runs.
router.use(auth);

router.get('/employees', employeeController.list);
// Must be registered BEFORE '/employees/:eid', otherwise Express would treat
// the word "search" as an employee id.
router.get('/employees/search', rules.searchRules, validate, employeeController.search);
router.post('/employees', rules.createRules, validate, employeeController.create);
router.get('/employees/:eid', rules.getByIdRules, validate, employeeController.getById);
router.put('/employees/:eid', rules.updateRules, validate, employeeController.update);
// DELETE takes the id from the query string (?eid=...), as the assignment specifies.
router.delete('/employees', rules.deleteRules, validate, employeeController.remove);

module.exports = router;
