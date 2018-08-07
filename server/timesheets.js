const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//timesheetId param
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = `SELECT * FROM Timesheet
               WHERE Timesheet.id = $timesheetId`;
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (err, timesheet) => {
    if (err) {
      next(err);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {res.status(404).send();}
  })
});

//GET all saved timesheets
timesheetsRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM Timesheet
               WHERE Timesheet.employee_id = $employeeId`;
  const values = {$employeeId: req.params.employeeId};
  db.all(sql, values, (err, timesheets) => {
    if (err) {
      next(err);
    } else {res.status(200).json({timesheets: timesheets});}
  });
});


//POST a new timesheet.  Requires hours, rate, and date.
timesheetsRouter.post('/', (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date) {
    res.status(400).send();
  }
  const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
               VALUES ($hours, $rate, $date, $employee_id)`;
  const values = {
    $hours: newTimesheet.hours,
    $rate: newTimesheet.rate,
    $date: newTimesheet.date,
    $employee_id: req.params.employeeId
  };
  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    }
    db.get(`SELECT * FROM Timesheet
            WHERE Timesheet.id = ${this.lastID}`,
      (err, row) => {
        if (err) {
          next(err);
        } else {res.status(201).json({timesheet: row});}
      });
  });
});

//PUT updates an existing timesheet and saves it to the database.
//Requires hours, rate, and date.
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const updatedTimesheet = req.body.timesheet;
  if (!updatedTimesheet.hours || !updatedTimesheet.rate || !updatedTimesheet.date) {
    return res.status(400).send();
  };
  const sql = `UPDATE Timesheet
               SET hours = $hours, rate = $rate, date = $date
               WHERE Timesheet.id = $timesheetId`;
  const values = {
    $hours: updatedTimesheet.hours,
    $rate: updatedTimesheet.rate,
    $date: updatedTimesheet.date,
    $timesheetId: req.params.timesheetId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Timesheet
              WHERE Timesheet.id = ${req.params.timesheetId}`,
        (error, timesheet) => {
            res.status(200).json({timesheet: timesheet});
        });
      }
  });
});


//DELETE a timesheet. Requires timesheetId.
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = `DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId`;
  const values = {$timesheetId: req.params.timesheetId};
  db.run(sql, values, function(err) {
    if (err) {
      next (err);
    } else {return res.status(204).json({});}
  });
})



module.exports = timesheetsRouter;
