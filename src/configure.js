// Copyright (c) 2012 Mathieu Bruyen
// See the file license.txt for copying permission.

var express   = require('express');//TODO use connect
var filed     = require('filed');
var fs        = require('fs');
var crypto    = require('crypto');
var reader    = require('npm-package-reader');
var async     = require('async');
var npmLoader = require('npm');

function addSetting(app, setting, key, value) {
  var c = app.settings[setting] || {};
  c[key] = value;
  app.set(setting, c);
}

function development(app, done) {
  var main = '/require.js';
  fs.exists(config.rootDir + config.jamDir + main, function(exists) {
    if (exists) {
      addSetting(app, 'view options', config.jamViewKey, config.baseUrl + main);
      //TODO honor baseUrl in regular expression
      app.get(/^\/jam\/.*\.js$/, express.static(config.rootDir));
      done();
    } else {
      done('Jam is not installed');
    }
  });
}

function production(app, done) {
  var catalog = '/catalog.js';
  fs.exists(config.rootDir + config.jamDir + catalog, function(exists) {
    if (exists) {
      var shasum = crypto.createHash('sha1');
      var s = fs.ReadStream(config.rootDir + config.jamDir + catalog);
      s.on('data', function(data) {
        shasum.update(data);
      });
      s.on('end', function() {
        var hash = shasum.digest('hex');
        var uri = config.baseUrl + '/catalog_' + hash + '.js';
        addSetting(app, 'view options', config.jamViewKey, uri);
        app.get(uri, function (req, resp) {
          req.pipe(filed(config.rootDir + config.jamDir + catalog)).pipe(resp);
        });
        done();
      });
    } else {
      done('Jam is not packaged in a catalog');
    }
  });
}

module.exports = function(app, done) {
  async.parallel([npmLoader.load, reader.on], function(err, results) {
    var rootDir = results[0].prefix;
    var jamDir =  '/jam';
    var baseUrl = '/jam';
    if (results[1].jam ) {
      if (results[1].jam.packageDir) {
        jamDir = results[1].jam.packageDir;
      }
      if (results[1].jam.baseUrl) {
        baseUrl = results[1].jam.baseUrl;
      }
    }
    var jamViewKey = process.env.JAM_VIEW_KEY || 'jam_uri';

    //TODO accept configuration as parameter
    var config = {
      'rootDir'    : rootDir,
      'jamDir'     : jamDir,
      'baseUrl'    : baseUrl,
      'jamViewKey' : jamViewKey
    };

    app.configure('development', function() {
      development(app, done);
    });
    app.configure('production', function() {
      production(app, done);
    });
  });
};
