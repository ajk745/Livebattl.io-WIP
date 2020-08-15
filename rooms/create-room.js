var path = require('path');
var fs = require('fs');
var db = require('../db');

var namespaces = fs
  .readFileSync(path.join(__dirname, '..', 'namespaces.txt'))
  .toString()
  .replace(/\r/g, '')
  .split('\n');

db.connect('VSCam', (err) => {
  if (err) {
    console.log(err);
    console.log('Failed to connect to mongodb. Terminating...');
    process.exit(1);
  } else {
    console.log('Connected to mongodb');
  }
});

module.exports = function createRoom(roomData, callback) {
  if (!roomData) return;
  var roomProps = [
    'namespace',
    'description',
    ['rules', ['maxQueue', 'maxSpec', 'timeLimit', 'votingTime', 'endTime', 'turnMode']],
    ['style', ['mainColor', 'secondaryColor', 'background']],
  ];
  function checkProperties(data, props) {
    var newData = {};
    for (let i = 0; i < props.length; i++) {
      if (data[props[i]]) newData[props[i]] = data[props[i]];
      else if (props[i][0] === 'rules' || props[i][0] === 'style')
        newData[props[i][0]] = checkProperties(data[props[i][0]], props[i][1]);
    }
    return newData;
  }
  roomData = checkProperties(roomData, roomProps);
  console.log(roomData);
  //TODO Size limiter
  db.getDB('VSCam')
    .collection('rooms')
    .insertOne(roomData, (err, res) => {
      if (err) console.log('Failed to create new room: ' + roomData.namespace);
      else {
        console.log('Success creating new room: ' + roomData.namespace);
        namespaces.push(roomData.namespace);
        fs.writeFile(path.join(__dirname, '..', 'namespaces.txt'), namespaces.join('\n'), () => {
          console.log('Added' + roomData.namespace + 'to local room list');
          callback();
        });
      }
    });
};
