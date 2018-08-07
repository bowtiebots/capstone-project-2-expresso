const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//menu-itemId param
menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = `SELECT * FROM MenuItem
               WHERE MenuItem.id = $menuItemId`;
  const values = {$menuItemId: menuItemId};
  db.get(sql, values, (err, menuItem) => {
    if (err) {
      next(err);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.status(404).send();
    }
  });
});


//GET all saved menu items
menuItemsRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM MenuItem
               WHERE MenuItem.menu_id = $menuId`;
  const values = {$menuId: req.params.menuId};
  db.all(sql, values, (err, menuItems) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({menuItems: menuItems});
    }
  });
});



//POST creates a new menu item and saves to the database
//Requires name, inventory, and price.
menuItemsRouter.post('/', (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  if (!newMenuItem.name || !newMenuItem.inventory || !newMenuItem.price) {
    res.status(400).send();
  }
  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
               VALUES ($name, $description, $inventory, $price, $menu_id)`;
  const values = {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menu_id: req.params.menuId
  };

  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    }
    db.get(`SELECT * FROM MenuItem
            WHERE MenuItem.id = ${this.lastID}`,
      (err, row) => {
        if (err) {
          next(err);
        } else {
          res.status(201).json({menuItem: row});
        }
      });
  });
});

//PUT updates an existing menu item based on menu-itemId
//Requires name, desription, inventory, and price
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const updatedMenuItem = req.body.menuItem;
  if (!updatedMenuItem.name || !updatedMenuItem.description || !updatedMenuItem.inventory || !updatedMenuItem.price) {
    res.status(400).send();
  };
  const sql = `UPDATE MenuItem
               SET name = $name, description = $description, inventory = $inventory, price = $price
               WHERE MenuItem.id = $menuItemId`;
  const values = {
    $name: updatedMenuItem.name,
    $description: updatedMenuItem.description,
    $inventory: updatedMenuItem.inventory,
    $price: updatedMenuItem.price,
    $menuItemId: req.params.menuItemId
  };

  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM MenuItem
              WHERE MenuItem.id = ${req.params.menuItemId}`,
        (error, menuItem) => {
            res.status(200).json({menuItem: menuItem});
        });
      }
  });
});


//DELETE an existing menu item
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = `DELETE FROM MenuItem
               WHERE MenuItem.id = $menuItemId`;
  const values = {$menuItemId: req.params.menuItemId};
  db.run(sql, values, function(err) {
    if (err) {
      next (err);
    } else {res.status(204).json({});}
  });
})


module.exports = menuItemsRouter;
