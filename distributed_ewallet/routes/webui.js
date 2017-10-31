var express = require('express');
var router = express.Router();

let rp = require('request-promise');
let promise = require('bluebird');

let User = require('../models/user');

router.get('/', function(req, res, next) {
  res.render('index', { env: process.env });
});

router.get('/ping', function(req, res, next) {
  res.render('ping', { env: process.env });
});

router.get('/register', function(req, res, next) {
  res.render('register', { env: process.env });
});

router.get('/transfer', function(req, res, next) {
  res.render('transfer', { env: process.env });
});

router.get('/saldo', function(req, res, next) {
  res.render('saldo', { env: process.env });
});

router.get('/totalSaldo', function(req, res, next) {
  res.render('totalSaldo', { env: process.env });
});

module.exports = router;
