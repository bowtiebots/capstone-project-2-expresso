const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets');

//employeeId param
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = `SELECT * FROM Employee
               WHERE Employee.id = $employeeId`;
  const values = {$employeeId: employeeId};

  db.get(sql, values, (err, employee) => {
    if (err) {
      next(err);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {res.status(404).send();}
  })
});

//GET all currently-employed employees
employeesRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM Employee
               WHERE is_current_employee = 1`;

  db.all(sql, (err, employees) => {
    if (err) {
      next(err);
    } else {res.status(200).json({employees: employees});}
  });
});

//POST a new employee. Requires name, position, wage.
employeesRouter.post('/', (req, res, next) => {
  const newEmployee = req.body.employee;
  if (!newEmployee.name || !newEmployee.position || !newEmployee.wage) {
    res.status(400).send();
  }
  const sql = `INSERT INTO Employee (name, position, wage)
               VALUES ($name, $position, $wage)`;
  const values = {
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage
  };

  db.run(sql, values, function (err) {
    if (err) {
      (err);
    }
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
      (err, row) => {
        if (err) {
          next(err);
        } else {res.status(201).json({employee: row});}
      });
  });
});

//GET employee from supllied employeeId
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});


//PUT update information on emlployee.  Requires name, position, wage.
employeesRouter.put('/:employeeId', (req, res, next) => {
  const updatedEmployee = req.body.employee;
  if (!updatedEmployee.name || !updatedEmployee.position || !updatedEmployee.wage) {
    res.status(400).send();
  };
  const sql = `UPDATE Employee
               SET name = $name,
                   position = $position,
                   wage = $wage
               WHERE Employee.id = $employeeId`;
  const values = {
    $name: updatedEmployee.name,
    $position: updatedEmployee.position,
    $wage: updatedEmployee.wage,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee
              WHERE Employee.id = ${req.params.employeeId}`,
        (err, employee) => {
            res.status(200).json({employee: employee});
        });
      }
  });
});


//DELETE updates employee to unemployed (is_current_employee = 0)
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = `UPDATE Employee
               SET is_current_employee = $is_current_employee
               WHERE Employee.id = $employeeId`;
  const values = {
    $is_current_employee: 0,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee
              WHERE Employee.id = ${req.params.employeeId}`,
        (err, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

module.exports = employeesRouter;
