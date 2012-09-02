#!/usr/bin/env node

// Copyright (c) 2012 Mathieu Bruyen
// See the file license.txt for copying permission.

var jam      = require('jamjs');
var readConf = require('./config');

function onError(err) {
  console.log(err);
  process.exit(1);
}

function onSuccess() {
  console.log('Jam installed successfully');
  process.exit(0);
}

readConf(function(err, config) {
  if (err) {
    onError(err);
  } else {
    console.log('Upgrade packages');
    jam.upgrade(config.rootDir, function(err) {
      if (err) {
        onError(err);
      } else {
        var options = {
          output: config.rootDir + config.jamDir + config.catalog
          ,includes: []
        };
        console.log('Compile packages in a single catalog');
        jam.compile(options, function(err) {
          if (err) {
            onError(err);
          } else {
            onSuccess();
          }
        });
      }
    });
  }
});