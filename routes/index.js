var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var namespaces = fs
  .readFileSync(path.join(__dirname, '..', 'namespaces.txt'))
  .toString()
  .replace(/\r/g, '')
  .split('\n');

router.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'home.html'));
});

router.get('/c/:namespace', (req, res, next) => {
  if (namespaces.indexOf('/' + req.params.namespace) !== -1)
    res.sendFile(path.join(__dirname, '..', 'public', 'c-namespace.html'));
  else res.sendFile(path.join(__dirname, '..', 'public', 'not-found.html'));
});

router.get('/rooms', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'rooms.html'));
});

router.get('/about', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'about.html'));
});

router.get('/bugs', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'report-bugs.html'));
});

router.get('/roomerror', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'not-found.html'));
});

router.get('/tos', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'terms.html'));
});

module.exports = router;
