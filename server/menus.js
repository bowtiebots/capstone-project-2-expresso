const express = require('express');
const menusRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menu-items');


//menuId param
menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = `SELECT * FROM Menu
               WHERE Menu.id = $menuId`;
  const values = {$menuId: menuId};
  db.get(sql, values, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {res.status(404).send();}
  });
});


//GET all saved menus
menusRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM Menu`;
  db.all(sql, (err, menus) => {
    if (err) {
      next(err);
    } else {res.status(200).json({menus: menus});}
  });
});



//POST creates a new mune.  Requires title.
menusRouter.post('/', (req, res, next) => {
  const newMenu = req.body.menu;
  if (!newMenu.title) {
    res.status(400).send();
  }
  const sql = `INSERT INTO Menu (title)
  VALUES ($title)`;
  const values = {$title: newMenu.title};
  db.run(sql, values, function (err) {
    if (err) {
      res.status(400).send();
    }
    db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
      (err, row) => {
        if (err) {
          next(err);
        } else {res.status(201).json({menu: row});}
      });
  });
});



//GET menu based on Id
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});


//PUT updates an existing menu option based on id.
//Requires menu title
menusRouter.put('/:menuId', (req, res, next) => {
  const updatedMenu = req.body.menu;
  if (!updatedMenu.title) {
    res.status(400).send();
  };
  const sql = `UPDATE Menu SET title = $title
               WHERE Menu.id = $menuId`;
  const values = {
    $title: updatedMenu.title,
    $menuId: req.params.menuId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu
              WHERE Menu.id = ${req.params.menuId}`,
        (error, menu) => {
            res.status(200).json({menu: menu});
        });
      }
  });
});


//DELETE menu based on menuId
menusRouter.delete('/:menuId', (req, res, next) => {
  const sql = `SELECT * FROM MenuItem
               WHERE MenuItem.menu_id = $menuId`;
  const values = {$menuId: req.params.menuId};
  db.get(sql, values, (err, menuItems) => {
    if (err) {
      next(err);
    } else if (menuItems) {
      res.status(400).send();
    } else {
      db.run(`DELETE FROM Menu
              WHERE Menu.id = ${req.params.menuId}`,
        function (err) {
          if (err) {
            next(err);
          } else {res.status(204).json({});}
        });
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

module.exports = menusRouter;
