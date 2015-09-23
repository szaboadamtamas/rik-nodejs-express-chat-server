var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var config = require('./config');
var mongoose = require('mongoose');

mongoose.connect(config.mongoUri);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

var api = require('./api');
app.use('/api/v1', api);

app.use('/', router);
app.listen(config.port);

console.log('Mukodunk a ' + config.port + ' porton!');