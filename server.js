var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var config = require('./config');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

router.get('/', function(req, res) {
  res.json({ message: 'Hello world!' });
});

app.use('/', router);
app.listen(config.port);

console.log('Mukodunk a ' + config.port + ' porton!');