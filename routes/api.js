var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var db = require('../db');

db.connect('VSCam', (err) => {
  if (err) {
    console.log(err);
    console.log('Failed to connect to mongodb. Terminating...');
    process.exit(1);
  } else {
    console.log('Connected to mongodb');
  }
});

var namespaces = fs
  .readFileSync(path.join(__dirname, '..', 'namespaces.txt'))
  .toString()
  .replace(/\r/g, '')
  .split('\n');

router.get('/rooms', (req, res, next) => {
  res.send(namespaces);
});

router.get('/rooms-details', (req, res, next) => {
  db.getDB('VSCam')
    .collection('rooms')
    .find({})
    .toArray((err, data) => {
      if (err) res.status(400).send('Database error');
      else if (data.length === 0) res.status(400).send('Room not found in database');
      else {
        res.json(data);
      }
    });
});

router.get('/room/:namespace', (req, res, next) => {
  if (namespaces.indexOf('/' + req.params.namespace) !== -1) {
    db.getDB('VSCam')
      .collection('rooms')
      .find({ namespace: '/' + req.params.namespace })
      .toArray((err, data) => {
        if (err) res.status(400).send('Database error');
        else if (data.length === 0) res.status(400).send('Room not found in database');
        else {
          res.json(data[0]);
        }
      });
  } else res.status(400).send('Room not found');
});

router.get('/room-thumbnail/:namespace', (req, res, next) => {
  if (namespaces.indexOf('/' + req.params.namespace) !== -1) {
    db.getDB('VSCam')
      .collection('rooms')
      .find({ namespace: '/' + req.params.namespace })
      .toArray((err, data) => {
        if (err) res.status(400).send('Database error');
        else if (data.length === 0) res.status(400).send('Room not found in database');
        else {
          var img = data[0].thumbnail ? data[0].thumbnail.buffer : null;
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img ? img.length : 0,
          });
          res.end(img);
        }
      });
  } else res.status(400).send('Room not found');
});

router.get('/rooms-featured', (req, res, next) => {
  db.getDB('VSCam')
    .collection('rooms')
    .find({})
    .toArray((err, data) => {
      if (err) res.status(400).send('Database error');
      else if (data.length === 0) res.status(400).send('Room not found in database');
      else {
        res.json(data);
      }
    });
});

var bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.post('/bug-report', (req, res) => {
  db.getDB('VSCam')
    .collection('bug-reports')
    .insertOne(
      {
        userIP: req.header('x-forwarded-for') || req.connection.remoteAddress,
        reportType: req.body.reportType,
        reportText: req.body.reportText,
      },
      (err, res) => {
        if (err) console.log('Failed to push a bug report form post to database');
        else console.log('Success pushing a bug report form post to database');
      }
    );
  res.sendFile(path.join(__dirname, '..', 'public', 'report-success.html'));
});

module.exports = router;
