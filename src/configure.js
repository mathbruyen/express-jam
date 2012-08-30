// Copyright (c) 2012 Mathieu Bruyen
// See the file license.txt for copying permission.

var express = require('express');
var filed   = require('filed');
var fs      = require('fs');
var crypto  = require('crypto');

var config = {
  'rootDir'     : process.env.PROJECT_DIR || process.cwd()
  ,'jamDir'     : process.env.JAM_DIR || '/jam'
  ,'jamViewKey' : process.env.JAM_VIEW_KEY || 'jam_uri'
};

function addSetting(app, setting, key, value) {
  var c = app.settings[setting] || {};
  c[key] = value;
  app.set(setting, c);
}

function development(app, done) {
  var main = config.jamDir + '/require.js';
  fs.exists(config.rootDir + main, function(exists) {
    if (exists) {
      addSetting(app, 'view options', config.jamViewKey, main);
      app.get(/^\/jam\/.*\.js$/, express.static(config.rootDir));
      done();
    } else {
      done("Jam is not installed");
    }
  });
}

function production(app, done) {
  var catalog = config.rootDir + config.jamDir + '/catalog.js';
  fs.exists(catalog, function(exists) {
    if (exists) {
      var shasum = crypto.createHash('sha1');
      var s = fs.ReadStream(catalog);
      s.on('data', function(data) {
        shasum.update(data);
      });
      s.on('end', function() {
        var hash = shasum.digest('hex');
        var uri = config.jamDir + '/catalog_' + hash + '.js';
        addSetting(app, 'view options', config.jamViewKey, uri);
        app.get(uri, function (req, resp) {
          req.pipe(filed(catalog)).pipe(resp);
        });
        done();
      });
    } else {
      done("Jam is not packaged in a catalog");
    }
  });
}

module.exports = function(app, done) {
  app.configure('development', function() {
    development(app, done);
  });
  app.configure('production', function() {
    production(app, done);
  });
};
