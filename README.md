# ExpressJS and JamJS work together

Respects `NODE_ENV` environment parameter of Express, it returns a single
catalog with all dependencies in production, but each dependency in its
own file in development mode. Development mode does not need server restart
if dependencies change.

Respects `packageDir` property from `package.json`.

## Configure dependencies

Write dependencies in `package.json` and execute `express-jam-install` script
on installation:
```json
{
  "scripts": {
    "postinstall": "env PATH=./node_modules/.bin:$PATH express-jam-install"
  }
  ,"jam": {
    "dependencies": {
      "jquery": "1.8.0"
    }
  }
}
```
See [Jam documentation](http://jamjs.org/docs#Loading) for more details.

## Link to an express app

```javascript
var app = require('express')()

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

The uri to jam bootstrap is provided to views in view options, by default in
key `jam_uri`. For example in jade:
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

The middleware returned can be used to expose the variable in response:
```javascript
var app = require('express')();

linkJam(app, function(error, middleware) {
  if (error) {
    console.log(error);
    process.exit(1);
  } else {
    app.get('/', middleware, function(req, res) {
      res.send('Hello at: ' + req.jam_uri);
    });
    app.listen(3000);
  }
});
```

## Environment parameters

* `process.env.JAM_VIEW_KEY` (defaults to `jam_uri`): key in views options that holds the uri to jam bootstrap

# Licence

MIT, see `license.txt`.