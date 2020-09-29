var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var db = require('../db');
var request = require('request');
var queryString = require('querystring');

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

router.get('/room-background/:namespace', (req, res, next) => {
  if (namespaces.indexOf('/' + req.params.namespace) !== -1) {
    db.getDB('VSCam')
      .collection('rooms')
      .find({ namespace: '/' + req.params.namespace })
      .toArray((err, data) => {
        if (err) res.status(400).send('Database error');
        else if (data.length === 0) res.status(400).send('Room not found in database');
        else {
          var img = data[0].style.background ? data[0].style.background.buffer : null;
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
        res.json(
          data
            .sort((room1, room2) => {
              return (room2.players || 0) - (room1.players || 0);
            })
            .slice(0, 3)
        );
      }
    });
});

var bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.post('/bug-report', (req, res, next) => {
  var query = queryString.stringify({
    secret: process.env.CAPTCHA_SECRET,
    response: req.body['g-recaptcha-response'],
  });
  var verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;

  request(verifyURL, (err, fetchRes, body) => {
    body = JSON.parse(body);
    if (body.success !== undefined && !body.success)
      res.sendFile(path.join(__dirname, '..', 'public', 'report-fail.html'));
    else {
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
    }
  });
});

var formidable = require('formidable');
var form = formidable.IncomingForm();
router.post('/new-room', (req, res, next) => {
  var formBody = {};
  var fileSize = 0;
  const BYTE = 1048576;
  form
    .parse(req)
    .on('field', (name, field) => {
      formBody[name] = field;
    })
    .on('file', (name, file) => {
      fileSize += file.size;
      if (fileSize > 4 * BYTE) {
        return res.sendFile(path.join(__dirname, '..', 'public', 'new-room-fail.html'));
      } else formBody[name] = fs.readFileSync(file.path);
    })
    .on('aborted', (error) => {
      let message = error.message;
      res.render('error', { message, error });
    })
    .on('error', (err) => {
      console.error('Error', err);
      let message = err.message;
      res.status(err.status || 500);
      res.render('error', { message, error: err });
    })
    .on('end', () => {
      var query = queryString.stringify({
        secret: process.env.CAPTCHA_SECRET,
        response: formBody['g-recaptcha-response'],
      });
      var verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;
      request(verifyURL, (err, fetchRes, body) => {
        if (body.success !== undefined && !body.success)
          res.sendFile(path.join(__dirname, '..', 'public', 'new-room-fail.html'));
        else {
          var newRoom = {
            namespace: formBody.namespace,
            description: formBody.description,
            rules: {
              turnMode: Boolean.valueOf(formBody.turnMode),
              timeLimit: formBody.timeLimit,
            },
            style: {
              mainColor: formBody.mainColor,
              secondaryColor: formBody.secondaryColor,
              background: formBody.background,
            },
          };
          if (newRoom.namespace[0] !== '/') newRoom.namespace = '/' + newRoom.namespace;

          db.getDB('VSCam')
            .collection('new-rooms')
            .insertOne(
              {
                ...newRoom,
                userIP: req.header('x-forwarded-for') || req.connection.remoteAddress,
              },
              (err, res) => {
                if (err) console.log('Failed to push a new room form post to database');
                else console.log('Success pushing a new room form post to database');
              }
            );
          res.sendFile(path.join(__dirname, '..', 'public', 'new-room-success.html'));
        }
      });
    });
});

module.exports = router;
