// Copyright (c) 2012 Mathieu Bruyen
// See the file license.txt for copying permission.

var connect  = require('connect');
var filed    = require('filed');
var fs       = require('fs');
var crypto   = require('crypto');
var readConf = require('./config');

// Polyfill for Regexp.quote from
// http://stackoverflow.com/questions/494035/how-do-you-pass-a-variable-to-a-regular-expression-javascript/494122#494122
if (!RegExp.quote) {
  RegExp.quote = function(str) {
    return str.replace(/([.?*+\^$\[\]\\(){}|-])/g, "\\$1");
  };
}

function middleware(key, uri) {
  return function(req, res, next) {
    res[key] = uri;
    next();
  };
}

function addSetting(app, setting, key, value) {
  var c = app.settings[setting] || {};
  c[key] = value;
  app.set(setting, c);
}

function development(app, config, done) {
  var main = '/require.js';
  fs.exists(config.rootDir + config.jamDir + main, function(exists) {
    if (exists) {
      addSetting(app, 'view options', config.jamViewKey, config.jamDir + main);
      app.get(new RegExp('^' + RegExp.quote(config.jamDir) + '\\/.*\\.js$'), connect.static(config.rootDir));
      done(null, middleware(config.jamViewKey, config.jamDir + main));
    } else {
      done('Jam is not installed');
    }
  });
}

function production(app, config, done) {
  fs.exists(config.rootDir + config.jamDir + config.catalog, function(exists) {
    if (exists) {
      var shasum = crypto.createHash('sha1');
      var s = fs.ReadStream(config.rootDir + config.jamDir + config.catalog);
      s.on('data', function(data) {
        shasum.update(data);
      });
      s.on('end', function() {
        var hash = shasum.digest('hex');
        var uri = config.jamDir + '/catalog_' + hash + '.js';
        addSetting(app, 'view options', config.jamViewKey, uri);
        app.get(uri, function (req, resp) {
          req.pipe(filed(config.rootDir + config.jamDir + config.catalog)).pipe(resp);
        });
        done(null, middleware(config.jamViewKey, uri));
      });
    } else {
      done('Jam is not packaged in a catalog');
    }
  });
}

module.exports = function(app, done) {
  readConf(function(err, config) {
    if (err) {
      done(err);
    } else {
      app.configure('development', function() {
        development(app, config, done);
      });
      app.configure('production', function() {
        production(app, config, done);
      });
    }
  });
};
