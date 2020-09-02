var path = require('path');
var fs = require('fs');
var db = require('../db');
var mongo = require('mongodb');
var createRoom = require('./create-room');
var readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

db.connect('VSCam', (err) => {
  if (err) {
    console.log(err);
    console.log('Failed to connect to mongodb. Terminating...');
    process.exit(1);
  } else {
    console.log('Connected to mongodb');
  }
});

rl.question('Enter Database ID of new room.', (id) => {
  db.getDB('VSCam')
    .collection('new-rooms')
    .find({ _id: new mongo.ObjectID(id) })
    .toArray((err, res) => {
      if (err) console.log('Failed to retrieve room from database with this ID.');
      else {
        var room = res[0];
        if (room) {
          console.log(room);
          createRoom(room, () => process.exit(0));
        }
      }
    });
});
