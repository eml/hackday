#!/usr/bin/env node

var express = require('express'),
    gather = require('./lib/gather.js'),
    http = require('http'),
    path = require('path');

var app = express();

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.compress());
app.use(express.methodOverride());
app.use(express['static'](path.join(__dirname, 'public')));

app.get("/news", function(req, res, next) {
  gather.findByGoogleRSS(req.query.q, function(err, result) {
    res.json(result);
  });
});

app.get("/tweets", function(req, res, next) {
  gather.findTweets(req.query.q, function(err, result) {
    res.json(result);
  });
});

app.set('port', 8000);

http.createServer(app).listen(app.get('port'), function() {
  console.log('listening on port ' + app.get('port'));
});
