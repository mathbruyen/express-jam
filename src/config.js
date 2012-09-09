// Copyright (c) 2012 Mathieu Bruyen
// See the file license.txt for copying permission.

var fs        = require('fs');
var npmLoader = require('npm');

module.exports = function(done) {
  npmLoader.load(function(err, npm) {
    if (err) {
      done(err);
    } else {
      var root = npm.prefix;
      fs.readFile(root + '/package.json', 'utf-8', function(err, content) {
        if (err) {
          done(err);
        } else {
          try {
            var pack = JSON.parse(content);
            var jamDir = '/jam';
            if (pack.jam ) {
              if (pack.jam.packageDir) {
                jamDir = '/' + pack.jam.packageDir;
              }
            }
            var jamViewKey = process.env.JAM_VIEW_KEY || 'jam_uri';

            //TODO accept configuration as parameter
            var config = {
              'rootDir'    : root,
              'jamDir'     : jamDir,
              'jamViewKey' : jamViewKey,
              'catalog'    : '/catalog.js',
              'production' : (process.env.NODE_ENV == 'production')
            };

            done(null, config);
          } catch(ex) {
            done(ex);
          }
        }
      });
    }
  });
};
