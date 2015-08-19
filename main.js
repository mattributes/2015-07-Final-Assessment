var express = require('express');
var app = express();
var fs = require('fs');
var uuid = require('uuid');
var request = require('request');
var util = require('util');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert')
var ObjectId = require('mongodb').ObjectID;

var mongoUrl = 'mongodb://localhost:27017/hrFinal';

var passport = require('passport');
var session = require('express-session');
var GitHubStrategy = require('passport-github2').Strategy;

var GITHUB_CLIENT_ID = "b06d321373091e0d8c09"
var GITHUB_CLIENT_SECRET = "69c83cd46f482c76d460c143cdccb71733e8af51";

app.set('view engine', 'ejs');  

app.use(session({ secret: 'hrfinal' }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

app.get('/auth/github',
	passport.authenticate('github', { scope: [ 'user:email' ] }),
	function(req, res){
	}
);

app.get('/auth/github/callback', 
	passport.authenticate('github', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/');
	}
);

//just a helper to look at user details
app.get('/user', ensureAuthenticated, function (req, res) {
  res.json(req.user);
});

//TODO refactor using router
app.get('/', ensureAuthenticated, function (req, res) {
  res.sendfile('./views/' + 'index.html');
});

app.get('/login', function(req, res) {
    res.sendfile('./views/' + 'login.html');
});

//TODO POST
app.get('/save', ensureAuthenticated, function (req, res) {
	var src = req.query.src;
	var tagName = req.query.tagName;

	var fileId = uuid.v1();
	request(src)
		.pipe(fs.createWriteStream(util.format('public/gifs/%s.gif', fileId)));

	//save to db
	MongoClient.connect(mongoUrl, function(err, db) {
		var callback = function(){
			db.close();
			res.json({ userId: req.user.id, id: fileId });
		};

		db.collection('gifs').insertOne({
			userId: req.user.id,
			fileId: fileId,
			tagName: tagName
		}, function(e, res){
			callback();
		});
	});
});

//get gifs that this user has saved (not public)
app.get('/shared', ensureAuthenticated, function (req, res) {
	var userId = req.user.id;

	MongoClient.connect(mongoUrl, function(err, db) {

		var results = [];

		var cursor = db.collection('gifs').find().each(function(err, doc){
			results.push(doc);

			//no more docs
			if (doc === null){
				db.close();
				res.render('shared.ejs', {results:results});
			}
		});
	});
});

app.get('/single', ensureAuthenticated, function (req, res) {
	var id = req.query.id;

	if (id){
			res.sendfile('./public/gifs/' + id + '.gif');
	}else{
		res.end("No gif found for this id. Use /shared?id=YourID");
	}
});

//for getting gifs by tagName
app.get('/:tagName', ensureAuthenticated, function (req, res) {
	var tagName = req.params.tagName;

	//get all the files for a given tagName
	MongoClient.connect(mongoUrl, function(err, db) {

		var results = [];

		var cursor = db.collection('gifs').find({tagName: tagName}).each(function(err, doc){
			results.push(doc);

			//no more docs
			if (doc === null){
				db.close();
				res.render('tagged.ejs', {
					tagName: tagName,
					results:results
				});
			}
		});
	});
});

//single random gif by tagname
app.get('/:tagName/random', ensureAuthenticated, function (req, res) {
	var tagName = req.params.tagName;

	MongoClient.connect(mongoUrl, function(err, db) {

		var results = [];

		var cursor = db.collection('gifs').find({tagName: tagName}).each(function(err, doc){
			results.push(doc);

			//no more docs
			if (doc === null){
				var randomItem = results[Math.floor(Math.random() * results.length)];

				db.close();
				res.render('tagged.ejs', {
					tagName: tagName,
					results:[randomItem]
				});
			}
		});
	});
});

app.use(express.static('public'));

//TODO get port from process.env
var server = app.listen(3000, function () {
  console.log('Started');
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next(); 
	}else{
		res.redirect('/login');
	}
}