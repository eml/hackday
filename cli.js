#!/usr/bin/env node

var gather = require('./lib/gather'),
    _ = require('underscore');


gather.findTweets('calvin harris', function(err, results) {
  console.log(results);

  gather.findByGoogleRSS('calvin harris', function(err, results) {
    console.log(results);
  });
});
