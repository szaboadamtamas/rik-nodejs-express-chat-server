var config = {};
config.port = process.env.PORT || 8080;
config.mongoUri = process.env.MONGODB_URI ||
  'mongodb://localhost/chatdemo_2';

module.exports = config;