var assert = require('assert');
var fs = require('fs');
var path = require('path');
var fork = require('child_process').fork;

function recursiveUnlinkSync(directory) {
  fs.readdirSync(directory).forEach(function (filename) {
    var file = path.join(directory, filename);
    if (fs.statSync(file).isDirectory()) {
      recursiveUnlinkSync(file);
    } else {
      fs.unlinkSync(file);
    }
  });
  fs.rmdirSync(directory);
}

var testDir = __dirname;
var keptPackages;
var testingDir = path.join(__dirname, 'testing');//TODO temporary folder https://github.com/bruce/node-temp
var rootDir = path.dirname(__dirname);
var prepare = function (name) {
  var sourceDir = path.join(__dirname, name);
  fs.mkdirSync(testingDir);
  fs.readdirSync(sourceDir).forEach(function (filename) {
    fs.writeFileSync(path.join(testingDir, filename), fs.readFileSync(path.join(sourceDir, filename), 'utf-8'), 'utf-8');
  });
  process.chdir(testingDir);
};

describe('Executor', function (){

  beforeEach(function () {
    keptPackages = [];
    for (var k in require.cache) {
      if (require.cache.hasOwnProperty(k)) {
        keptPackages.push(k);
      }
    }
  });

  afterEach(function () {
    keptPackages.forEach(function(key) {
      delete require.cache[key];
    });
  });

  afterEach(function () {
    process.chdir(testDir);
    if (fs.existsSync(testingDir)) {
      recursiveUnlinkSync(testingDir);
    }
  });

  describe('express-jam', function (){
    it('development', function (done) {
      prepare('development');
      var install = fork('../../src/install.js', [], {
        cwd: testingDir
      });
      install.on('exit', function (code, signal) {
        assert.equal(0, code);
      });
      install.on('close', function () {
        done();
      });
    });
  });
});