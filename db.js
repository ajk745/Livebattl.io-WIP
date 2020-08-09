const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').config();

const url = (name) => {
  return process.env.MONGO_URI + '/' + name + '?retryWrites=true&w=majority';
};
const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true };

var states = {};

const connect = function (db, cb) {
  MongoClient.connect(url(db), mongoOptions, (err, client) => {
    if (err) cb(err);
    else {
      var db1 = client.db(db);
      states[db] = db1;
      cb();
    }
  });
};

const getPrimaryKey = function (_id) {
  return ObjectID(_id);
};

const getDB = function (db) {
  return states[db];
};

module.exports = { getDB, connect, getPrimaryKey };
