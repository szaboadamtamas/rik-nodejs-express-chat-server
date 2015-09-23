var express = require('express');
var app = module.exports = express();

app.get('/', function(req, res) {
  res.json({
    message: 'API v1 home'
  });
});

app.use('/users', require('./users'));

app.use(function(err, req, res, next) {
  if(err.code === 11000 || err.name === 'ValidationError') {
    console.error(err.stack);
    return res.status(400).json({
      error: "Validation Error",
      message: err.message
    });
  } else {
    next();
  }
});