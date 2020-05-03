require('dotenv').config();
var express = require("express");
var request = require('request');
var app = express();
app.set("view engine","ejs");

//============= body parser =======================//
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
var flash = require("connect-flash");
app.use(flash());


//============ Schema ==============================//
var User = require("./models/user.js");
var Campground = require("./models/campground.js");
var Comment = require("./models/comment.js");

//seeds
var seedDB = require("./seeds");
//seedDB();

//================================= mongoose =======================================//
var mongoose = require("mongoose");
//mongoose.connect("mongodb://localhost/yelp_camp_database", { useNewUrlParser: true });
mongoose.connect("mongodb+srv://anu123:apple123@cluster0-5c5ij.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true });  

//===============================================================================================================================================
//===============================================================================================================================================


//PASSPORT config:
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride =  require("method-override");
app.use(methodOverride("_method"));

//===========Main Routes===========requiring our 3 blocks of code====================//
var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var authRoutes = require("./routes/authorization"); 

app.use(require("express-session")({
    secret: "My life is mine i decide what to do",
    resave: false,
    saveUninitialized: false
}));  
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());   
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){          //for currentUser
res.locals.currentUser = req.user;
res.locals.error = req.flash("error");
res.locals.success = req.flash("success");
next();
});

app.use("/campgrounds",campgroundRoutes);  // "/campgrounds" is common for every route in campgrounds.js part
app.use("/campgrounds/:id/comments",commentRoutes);     //similarly for comments.js part
app.use(authRoutes);




var port = process.env.PORT || 3000;
app.listen(port,function(){ 
    console.log("Yelp-Camp Server is Currently listening");
});