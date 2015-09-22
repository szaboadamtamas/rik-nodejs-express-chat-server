# rik-nodejs-express-chat-server

Express Chat server Live

## Postman:

https://www.getpostman.com/collections/39194b08148c389d522f


## Base server.js

```
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

console.log('Mukodunk a ' + port + ' porton!');
```


## Auth/index.js
```
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../users/model');

passport.use(new BasicStrategy(
  function(username, password, callback) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return callback(err); }

      // No user found with that username
      if (!user) { return callback(null, false); }

      // Make sure the password is correct
      user.verifyPassword(password, function(err, isMatch) {
        if (err) { return callback(err); }

        // Password did not match
        if (!isMatch) { return callback(null, false); }

        // Success
        return callback(null, user);
      });
    });
  }
));

module.exports.isAuthenticated = passport.authenticate('basic', { session : false });
```

## Account/index.js skeleton
```
var express = require('express');
var app = module.exports = express();
var User = require('../users/model');
var Auth = require('../auth');

app.get('/me', Auth.isAuthenticated, function (req, res, next) {
	#TODO
});

app.post('/register', function (req, res, next) {
	#TODO
});
```
## Room

### app/rooms/model.js
```
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

var Model = mongoose.model('Room', roomSchema);

module.exports = Model;
```

### app/rooms/index.js
```
var express = require('express');
var app = module.exports = express();
var Room = require('./model');
var Auth = require('../auth');

app.get('/', function (req, res, next) {
  Room.find().exec(function (err, rooms) {
    if (err) {
      return next(err);
    }
    res.json(rooms);
  });
});

app.post('/', Auth.isAuthenticated, function (req, res, next) {
  var room = new Room({
    name: req.body.name,
    creatorId: req.user._id
  });
  room.save(function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

app.get('/:roomId', function (req, res, next) {
  Room.findById(req.params.roomId, function (err, room) {
    if (err) {
      return next(err);
    }
    res.json(room);
  });
});

app.put('/:roomId', Auth.isAuthenticated, function (req, res, next) {
  Room.update({
    _id: req.params.roomId,
    creatorId: req.user._id
  }, {
    $set: {
      name: req.body.name
    }
  }, {new: true}, function (err, user) {
    if (err) {
      return next(err);
    }
    res.json(user);
  });
});

app.delete('/:roomId', Auth.isAuthenticated, function (req, res, next) {
  Room.remove({
    _id: req.params.roomId,
    creatorId: req.user._id
  }, function (err, result) {
    if (err) {
      return next(err);
    }
    res.json(result);
  });
});
```

## Messages

### app/rooms/messages/model.js
```
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  }
});

var Model = mongoose.model('Message', messageSchema);

module.exports = Model;
```
### app/rooms/messages/index.js
```
var express = require('express');
var app = module.exports = express.Router({mergeParams: true});
var Room = require('../model');
var Message = require('./model');
var Auth = require('../../auth');

app.get('/', function (req, res, next) {
  Message.find({roomId: req.params.roomId})
    .sort({_id: -1})
    .exec(function (err, messages) {
      res.json(messages);
    });
});

app.post('/', Auth.isAuthenticated, function (req, res, next) {
  Message.create({
    text: req.body.text,
    roomId: req.params.roomId,
    authorId: req.user._id
  }, function(err, message) {
    if (err) {
      return next(err);
    }
    res.json(message);
  });
});

app.delete('/:messageId', Auth.isAuthenticated, function (req, res, next) {
  Message.remove({
    _id: req.params.messageId,
    roomId: req.params.roomId
  }, function(err, message) {
    if (err) {
      return next(err);
    }
    res.json(message);
  });
});
```
### Socket listener
```
var io = module.exports.socketIO = require('socket.io').listen(server);
io.on('connection', function (socket) {
  console.log('User connected');
  socket.on('disconnect', function () {
    console.log('User disconnected');
  });
  socket.on('subscribe', function(data) {
    socket.join(data.room);
    console.log('User joined to room:' + data.room);
  });
  socket.on('unsubscribe', function(data) {
    socket.leave(data.room);
    console.log('User left room:' + data.room);
  });
});
```
### Room & User mapping
```
var express = require('express');
var app = module.exports = express.Router({mergeParams: true});
var Room = require('../model');
var Auth = require('../../auth');

app.get('/', function (req, res, next) {
  Room.findById(req.params.roomId)
    .lean()
    .populate('users')
    .exec(function (err, room) {
    if (err) {
      return next(err);
    }
    if (!room) {
      return res.status(404).send();
    }
    res.json(room.users);
  });
});

app.post('/', Auth.isAuthenticated, function (req, res, next) {
  Room.findByIdAndUpdate(req.params.roomId, {
    $addToSet: {
      users: req.body.users
    }
  }, {new: true}, function(err, room) {
    if (err) {
      return next(err);
    }
    res.json(room);
  });
});

app.delete('/:userId', Auth.isAuthenticated, function (req, res, next) {
  Room.findByIdAndUpdate(req.params.roomId, {
    $pull: {
      users: req.params.userId
    }
  }, {new: true}, function(err, room) {
    if (err) {
      return next(err);
    }
    res.json(room);
  });
});
```

