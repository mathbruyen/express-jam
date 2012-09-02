// Copyright (c) 2012 Mathieu Bruyen
// See the file license.txt for copying permission.

var connect   = require('connect');
var filed     = require('filed');
var fs        = require('fs');
var crypto    = require('crypto');
var npmLoader = require('npm');

// Polyfill for Regexp.quote from
// http://stackoverflow.com/questions/494035/how-do-you-pass-a-variable-to-a-regular-expression-javascript/494122#494122
if (!RegExp.quote) {
  RegExp.quote = function(str) {
    return str.replace(/([.?*+\^$\[\]\\(){}|-])/g, "\\$1");
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
      done();
    } else {
      done('Jam is not installed');
    }
  });
}

function production(app, config, done) {
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
        var uri = config.jamDir + '/catalog_' + hash + '.js';
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
  npmLoader.load(function(err, npm) {
    var root = npm.prefix;
    fs.readFile(root + '/package.json', 'utf-8', function(err, content) {
      try {
        var pack = JSON.parse(content);
        var jamDir = '/jam';
        if (pack.jam ) {
          if (pack.jam.packageDir) {
            jamDir = '/' + pack.jam.packageDir;
          }
        }
        var jamViewKey = process.env.JAM_VIEW_KEY || 'jam_uri';

        //"postinstall": ""

        //TODO accept configuration as parameter
        var config = {
          'rootDir'    : root,
          'jamDir'     : jamDir,
          'jamViewKey' : jamViewKey
        };

        app.configure('development', function() {
          development(app, config, done);
        });
        app.configure('production', function() {
          production(app, config, done);
        });
      } catch(ex) {
        process.nextTick(function () {
          done(ex);
        });
      }
    });
  });
};
