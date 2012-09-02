# ExpressJS and JamJS work together

Respects `packageDir` property from `package.json` and `NODE_ENV` environment parameter of Express.

## Link to an express app

```javascript
var app = require('express').createServer();
var linkJam = require('express-jam');

linkJam(app, function(error) {
  if (error) {
    console.log(error);
    process.exit(1);
  } else {
    app.listen(3000);
  }
});
```

## Use in views

The uri to jam bootstrap is provided to views in view options, by default in key `jam_uri`. For example in jade:
```jade
!!!
html
  head
    title Jam-Express
    script(type='text/javascript', src='#{jam_uri}', data-main='index')
  body
    p Hello, world!
```

## Use out of views

```javascript
var app = require('express').createServer();
var linkJam = require('express-jam');

linkJam(app, function(error, middleware) {
  if (error) {
    console.log(error);
    process.exit(1);
  } else {
    app.get('/', middleware, function(req, res) {
      res.send('Hello at: ' + res.jam_uri);
    });
    app.listen(3000);
  }
});
```

## Environment parameters

* `process.env.JAM_VIEW_KEY` (defaults to `jam_uri`): key in views options that holds the uri to jam bootstrap

# Licence

MIT, see `license.txt`.