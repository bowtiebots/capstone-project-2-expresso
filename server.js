const express = require('express');
const app = express();

const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');

//Router setup
const apiRouter = require('./api/api.js');
app.use('/api/', apiRouter);
const PORT = process.env.PORT || 4000;

//Middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors());
app.use(errorhandler());

//Router active message
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

module.exports = app;
