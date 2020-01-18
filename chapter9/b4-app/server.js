/***
 * Excerpted from "Node.js 8 the Right Way",
 * published by The Pragmatic Bookshelf.
 * Copyrights apply to this code. It may not be used to create training material,
 * courses, books, articles, and the like. Contact us if you are in doubt.
 * We make no guarantees that this code is fit for any purpose.
 * Visit http://www.pragmaticprogrammer.com/titles/jwnode2 for more book information.
***/
'use strict';
const pkg = require('./package.json');
const {URL} = require('url');
const path = require('path');

// This is for passport-local.
const db = require('./db');

// nconf configuration.
const nconf = require('nconf');
nconf
  .argv()
  .env('__')
  .defaults({'NODE_ENV': 'development'});

const NODE_ENV = nconf.get('NODE_ENV');
const isDev = NODE_ENV === 'development';
nconf
  .defaults({'conf': path.join(__dirname, `${NODE_ENV}.config.json`)})
  .file(nconf.get('conf'));

const serviceUrl = new URL(nconf.get('serviceUrl'));
const servicePort =
    serviceUrl.port || (serviceUrl.protocol === 'https:' ? 443 : 80);

// Express and middleware.
const express = require('express');
const morgan = require('morgan');

const app = express();

// Setup Express sessions.
const expressSession = require('express-session');


// Passport Authentication.
// The passport.session middleware must come after the expressSession.
const passport = require('passport');

const Strategy = require('passport-local').Strategy;

// https://dev.to/ganeshmani/node-authentication-using-passport-js-part-1-53k7
passport.use('local-signup', new Strategy(
  function(username, password, done) {
      db.users.findByUsername(username, function(err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false, { message: "Incorrect username."}); }
          if (user.password != password) { return done(null, false, { message: "Incorrect password"}); }
          return done(null, user);
  });
}));

passport.serializeUser((profile, done) => done(null, {
  id: profile.id,
  provider: profile.provider,
}));

passport.deserializeUser((user, done) => done(null, user));


// https://stackoverflow.com/questions/56297867/req-isauthenticated-is-always-false
// app.use(passport.initialize());
// app.use(passport.session());


// This is necessary for passport-local!!!!!!!!!!!1
app.use(require('body-parser').urlencoded({ extended: true }));


if (isDev) {
  // Use FileStore in development mode.
  const FileStore = require('session-file-store')(expressSession);

  app.use(expressSession({
    resave: false,
    saveUninitialized: true,
    secret: 'unguessable',
    store: new FileStore(),
  }));
} else {
  // Use RedisStore in production mode.
  const redis = require('redis');

  const RedisStore = require('connect-redis')(expressSession);
  const client = redis.createClient({
    host: nconf.get('redis:host'),
    port: nconf.get('redis:port'),
    password: nconf.get('redis:secret')
  });

  app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: nconf.get('redis:secret'),
    store: new RedisStore({ client }),
  }));
}

app.use(morgan('dev'));

app.get('/api/version', (req, res) => res.status(200).json(pkg.version));

// Serve webpack assets.
if (isDev) {
  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackConfig = require('./webpack.config.js');
  app.use(webpackMiddleware(webpack(webpackConfig), {
    publicPath: '/',
    stats: {colors: true},
  }));
} else {
  app.use(express.static('dist'));
}

// https://stackoverflow.com/questions/56297867/req-isauthenticated-is-always-false
// These codes should be here!
app.use(passport.initialize());
app.use(passport.session());

app.post('/auth/local', function(req, res, next) {
  passport.authenticate('local-signup', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});

// Return information about the current user session.
app.get('/api/session', (req, res) => {
  const session = {auth: req.isAuthenticated()};
  res.status(200).json(session);
});

app.get('/auth/signout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.use('/api', require('./lib/bundle.js')(nconf.get('es')));

app.listen(servicePort, () => console.log('Ready.'));
