var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');
//var usersRouter = require('./routes/users');

var app = express();

app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, 'public')));

// catch 404
app.use(function (req, res, next) {
  res.sendFile(path.join(__dirname, 'public', 'not-found.html'));
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res
    .status(500)
    .send(
      '500: Seems like there was an internal error on the server. Please go back... <br><br><br> battl.live'
    );
});

module.exports = app;
