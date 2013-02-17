#!/usr/bin/env node

/*
 * various keys needed for things:
 */

var consumer_key = 'DEADBEEF',
    consumer_secret = 'CAFEFEED',
    access_token = 'DEAFDEED',
    access_token_secret = 'FADCAD',
    echonest_api = 'EEEEEEEEE';

var echonest = require('echonest'),
    en = new echonest.Echonest({
      api_key: echonest_api
    }),
    fermata = require('fermata'),
    async = require('async'),
    Apricot = require('apricot').Apricot,
    Twit = require('twit'),
    parser = require('feedparser'),
    jquery = require('jQuery'),
    _ = require('underscore'),
    title, 
    artist;

exports.findByGoogleRSS = function(artist, done) {
  var results = [];

  parser.parseUrl('http://news.google.com/news/feeds?q=' + encodeURIComponent(artist))

  .on('article', function(article) {
    var excerpt;

    Apricot.parse(article.description, function(err, doc) {
      if (err) { process.exit(); }

      var $ = jquery.create(doc.window);

      excerpt = $('div.lh font:nth-child(5)')[0].innerHTML;
    });

    results.push({
      url: article.link,
      title: article.title,
      excerpt: excerpt
    });
  })

  .on('end', function(err) {
     done(err, results);
  })

  .on('error', function(err) {
    done(err);
  });
}

function findByGoogleHtml(artist) {
  Apricot.open('http://www.google.com/search?tbm=nws&q=calvin%20harris', function(err, doc) {
    if (err) { console.log("err!", err); process.exit(); }

    var $ = require('jQuery').create(doc.window),
        matches = [];

    $('h3 a').each(function(index, match) {
      matches.push({
        url: match.href.slice(14)
      });
    });

    formatViaReadability(matches);
  });
}

exports.findTweets = function(artist, done) {
  en.artist.twitter({ name: artist }, function(err, resp) {
    if (err) { return done(err); }

    var screenName = resp.artist.twitter;

    var T = new Twit({
      consumer_key: consumer_key,
      consumer_secret: consumer_secret,
      access_token: access_token,
      access_token_secret: access_token_secret
    });

    T.get('statuses/user_timeline', { screen_name: screenName, count: 20, exclude_replies: true }, function(err, tweets) {

      var results = _.map(tweets, function(tweet) {
        return {
          username: tweet.user.screen_name,
          avatar: tweet.user.profile_image_url,
          tweet: tweet.text,
          link: 'https://twitter.com/' + screenName + '/status/' + tweet.id_str
        }
      });

      done(null, results);
    });

  });
}

function findByEchonest(artist, done) {
  // find the artist
  en.artist.search({ name: artist }, function(err, resp) {
    if (err) { return done(err); }

    done(null, resp.artists[0].id);
  });
}

function getReviews(artistId, results) {
  en.artist.reviews({ id: artistId, results: 4 }, function(err, result) {
    var total = result.total;

    _.each(result.reviews, function(item) {
      results.push({
        url: item.url,
        name: item.name,
        html: item.summary
      });
    });

    getNews(artistId, results);
  });
}

function getNews(artistId, results) {
  en.artist.news({ id: artistId, results: 100 }, function(err, result) {
    var total = result.total;

    _.each(result.news, function(item) {
      results.push({
        url: item.url,
        html: item.summary
      });
    });

    console.log("found:", results);

    //formatViaReadability(results);
  });
}

function formatViaReadability(results) {
  // send the result to readability, one at a time
  var site = fermata.json('https://readability.com/');

  async.mapLimit(results, 2, function(item, done) {
    var site = fermata.json('https://readability.com/');
    
    site.api.content.v1.parser({ 
      url: item.url, 
      token: '6fb388c5490458e68eca22a2e3fa160b06fb4fe2' 
    })
    
    .get(function(err, resp) {
      item.title = resp.title;
      item.excerpt = resp.excerpt;
      done(null, {
        url: item.url,
        title: resp.title,
        excerpt:  resp.excerpt
      });
    });

  }, function(err, formatted) {

    console.log("formatted is", formatted);

  });
}

