var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
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
// router.post("/register",function(req,res){
//     User.register(new User({username:req.body.username, email: req.body.email}),req.body.password,function(err,user){
//         if(err)
//         {
//            req.flash("error",err.message);
//             return res.render("register.ejs");
//         }
//         passport.authenticate("local")(req,res,function(){
//             req.flash("success","Account Created Successfully! Welcome To Yelpcamp " + user.username);
//             res.redirect("/campgrounds");
//         });
//     });
// });
// //Login route
// router.get("/login",function(req,res){
//     res.render("login.ejs");
// });
// router.post("/login",passport.authenticate("local",{
//     successRedirect: "/campgrounds",
//     failureRedirect: "/login"
// }), function(req,res){
//     res.redirect(req.session.returnTo || '/campgrounds');
//     delete req.session.returnTo;
// });
// //Logout Route
// router.get("/logout",function(req,res){
//     req.logout();
//     req.flash("success","Logged You Out ");
//     res.redirect("/campgrounds");
// });
router.post('/register', function(req, res,next) { 
  newUser=new User({email: req.body.email, username : req.body.username});
  User.register(newUser, req.body.password, function(err, user) { 
          if (err) { 
           req.flash('error',err.message); 
          }else{ 
              //console.log(user);
              async.waterfall([
                function(done) {crypto.randomBytes(20, function(err, buf) {var token = buf.toString('hex');done(err, token);});},
                function(token, done) {
                  User.findOne({ email: req.body.email }, function(err, user) {
                    if (err) {
                     // console.log(err);
                      req.flash('error',err.message);
                    return res.redirect('/register');
                    }
                    user.verificationToken = token;
                    user.verificationTokenExpires = Date.now() + 10800000; // 3 hour
                    user.save(function(err) {
                    done(err, token, user);
                    });
                  });
                  },
                 function(token, user, done) {
                    var smtpTransport = nodemailer.createTransport({
                      service: 'Gmail', 
                      auth: { user: 'hiimanurag122@gmail.com',pass: process.env.GMAILPW }});
                    var mailOptions = {
                      to: user.email,
                      from: 'hiimanurag122@gmail.com',
                      subject: 'YelpCamp Account Verification',
                      text: 'Please click on the following link, to verify your account: \n\n' +
                        'http://' + req.headers.host + '/verify/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your account will not be created.\n'
                      };
                     smtpTransport.sendMail(mailOptions, function(err) {
                        // console.log('mail sent');
                        // console.log('success An e-mail has been sent to ' + user.email + ' with further instructions.');
                        req.flash("success","An e-mail has been sent to " + user.email + " with further instructions.");
                      done(err, 'done');
                      });
                    }
                    ],function(err) {
                      if (err) return next(err);
                      res.redirect('/register');
                      });
                    }
                      });
           
        });  

router.get('/verify/:token',function(req, res) {
User.findOne({ verificationToken: req.params.token, verificationTokenExpires: { $gt: Date.now() } }, function(err, user){
if (!user) {
 // console.log('Password reset token is invalid or has expired.Cant find User for this token');
 req.flash('error','Password reset token is invalid or has expired.Cant find User for this token');
} 
else{ 
user.isVerified = true;
user.save(function (err) {if (err) { return res.status(500).send({ msg: err.message }); }});
//console.log(user);
res.redirect('/login');
  }
});
});

router.get("/login",(req,res) => {res.render("login.ejs")});
router.post("/login", passport.authenticate('local', { //successRedirect: '/',
failureRedirect: '/login',
failureFlash: 'Invalid username or password.' }),
function(req,res){
User.findOne({username:req.body.username},function(err,user){
  if(err) console.log(err);
  else if (!user) { return res.redirect("/login");}
  else {console.log(user);
    if(user.isVerified)
    {
      res.redirect(req.session.returnTo || '/campgrounds');
    }
    else { //console.log("Please verify your account first"); 
    req.flash('error','Please verify account to login');
    res.redirect("login");}
  }
})
})
router.get("/logout",function(req,res){
req.logout();
req.flash("success","Logged You Out ");
res.redirect("/");
});
//// FORGOT PASSWORD
router.get('/forgot', function(req, res) {
	res.render('forgot.ejs');
  });
  router.post('/forgot', function(req, res, next) {
	async.waterfall([
	  function(done) {
		crypto.randomBytes(20, function(err, buf) {
		  var token = buf.toString('hex');
		  done(err, token);
		});
	  },
	  function(token, done) {
		User.findOne({ email: req.body.email }, function(err, user) {
		  if (!user) {
            req.flash('error' ,'No account with that email address exists.');
			return res.redirect('/forgot');
		  }
  
		  user.resetPasswordToken = token;
		  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
		  user.save(function(err) {
			done(err, token, user);
		  });
		});
	  },
	  function(token, user, done) {
		var smtpTransport = nodemailer.createTransport({
		  service: 'Gmail', 
		  auth: {
			user: 'hiimanurag122@gmail.com',
			pass: process.env.GMAILPW
		  }
		});
		var mailOptions = {
			to: user.email,
			from: 'hiimanurag122@gmail.com',
			subject: 'Yelpcamp Password Reset',
			text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
			  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
			  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
			  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
		  };
		  smtpTransport.sendMail(mailOptions, function(err) {
			req.flash("success",'mail sent');
			req.flash("success"," An e-mail has been sent to " + user.email + " with further instructions.");
			done(err, 'done');
		  });
		}
	  ], function(err) {
		if (err) return next(err);
		res.redirect('/forgot');
	  });
    });

    ///RESET PASSWORD
    router.get('/reset/:token', function(req, res) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash("error",'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
          }
          res.render('../views/reset.ejs', {token: req.params.token});
        });
      });

      router.post('/reset/:token', function(req, res) {
        async.waterfall([
          function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
              if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('back');
              }
              if(req.body.password === req.body.confirm) {
                user.setPassword(req.body.password, function(err) {
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;
      
                  user.save(function(err) {
                    req.logIn(user, function(err) {
                      done(err, user);
                    });
                  });
                })
              } else {
                  req.flash("error", "Passwords do not match.");
                  return res.redirect('back');
              }
            });
          },
          function(user, done) {
            var smtpTransport = nodemailer.createTransport({
              service: 'Gmail', 
              auth: {
                user: 'hiimanurag122@gmail.com',
                pass: process.env.GMAILPW
              }
            });
            var mailOptions = {
              to: user.email,
              from: 'hiimanurag122@gmail.com',
              subject: 'Your password has been changed',
              text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
              req.flash('success', 'Your password has been changed.');
              done(err);
            });
          }
        ], function(err) {
          res.redirect('/campgrounds');
        });
      });

      // router.get("/change",(req,res)=>{ 
      //   User.findById(req.params.id,(err,user)=>{ if(err) console.log(err); else  res.render("changepass.ejs",{user})})});
      
      // router.post('/change',(req, res)=>{
      //  User.findById(req.params.id,(err, user) => {
      //       if (err) {console.log('success: false, message: err'); } 
      //       else {
      //          if (!user) { req.flash("error", 'User not found' );} // Ret error,user was not found in db
      //          else {
      //           if(req.body.newPassword === req.body.confirmnewPassword) {
      //           user.changePassword(req.body.oldPassword, req.body.newPassword, function(err) {
      //              if(err) {
      //                 console.log(err);
      //             } else {req.flash("success",'Your password has been changed successfully');
      //           res.redirect("/campgrounds");
      //           }
      //            })
      //           }
      //           else { req.flash('error','new password and confirm pass do not match'); res.redirect("back");}
      //         }
      //       }
      //     });  
      //   }); 
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