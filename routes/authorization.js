var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
//var middleware = require("../middleware/index.js")
//landing page
router.get("/",function(req,res){
    res.render("landing_page");
});

//Authorization Routes
//Signup register route
router.get("/register",function(req,res){
    res.render("register.ejs");
});
router.post("/register",function(req,res){
    User.register(new User({username:req.body.username}),req.body.password,function(err,user){
        if(err)
        {
           req.flash("error",err.message);
            return res.render("register.ejs");
        }
        passport.authenticate("local")(req,res,function(){
            req.flash("success","Account Created Successfully! Welcome To Yelpcamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});
//Login route
router.get("/login",function(req,res){
    res.render("login.ejs");
});
router.post("/login",passport.authenticate("local",{
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function(req,res){

});
//Logout Route
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged You Out ");
    res.redirect("/campgrounds");
});
//middleware function
function isLoggedIn(req,res,next)
{
   if(req.isAuthenticated())
   {
       return next();
   }
   req.flash("error","Please Login first");
   res.redirect("/login");

}

module.exports =  router;