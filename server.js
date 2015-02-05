var express = require("express");
var passport = require("passport");
var GithubStrategy = require("passport-github").Strategy;
var cookieParser = require("cookie-parser");
var session = require("express-session");
var _ = require("lodash");

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
var CALLBACK_HOST = process.env.CALLBACK_HOST;
var SESSION_SECRET = process.env.SESSION_SECRET;
var ADMINS = process.env.ADMINS.split("|");

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

passport.use(new GithubStrategy({
	clientID: GITHUB_CLIENT_ID,
	clientSecret: GITHUB_CLIENT_SECRET,
	callbackURL: CALLBACK_HOST + "/auth/github/callback"
}, function(accessToken, refreshToken, profile, done) {
	process.nextTick(function() {
		return done(null, profile);
	});
}));

var app = express();

app.use(cookieParser());
app.use(session({
	secret: SESSION_SECRET,
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/", function(req, res) {
	res.send("root");
});

app.get("/auth/github", passport.authenticate("github"));

app.get("/auth/github/callback", 
	passport.authenticate("github", { failureRedirect: "/login" }),
	function(req, res) {
		res.redirect("/");
});

app.get("/login", function(req, res) {
	res.send("<a href='/auth/github'>Login</a>");
});

app.get("/loggedin", isLoggedIn, function(req, res) {
	res.send("Yay! you are logged in.");
});

app.get("/admin", isLoggedIn, isAdmin, function(req, res) {
	res.send("You are an admin");
});

app.listen(3000, function() {
	console.log("server started");
});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	return res.redirect("/login");
}

function isAdmin(req, res, next) {
	if (_.includes(ADMINS, req.user.username)) {
		return next();
	} else {
		return res.status(403).send("You are not authorized.");
	}
}