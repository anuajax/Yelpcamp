var express = require("express");
var router = express.Router();
var request = require('request');
var unirest = require("unirest");
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware/index.js");
var NodeGeocoder = require('node-geocoder');
var weather;
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);
/*.......campgrounds INDEX page..........*/
router.get("/",function(req,res){
    Campground.find({},function(err,allcampgrounds){
        if(err)
        console.log(err);
        else
        res.render("campgrounds/index",{ campgrounds: allcampgrounds,currentUser: req.user}); //this is retrieving data from our database
    });
    });
// //CREATE: adding new campground to DB
// router.post("/",middleware.isLoggedIn,function(req,res){
//     //get data from form and add to (campgrounds array) database now
//     var name = req.body.name;
//     var image = req.body.image;
//     var price = req.body.price;
//     var descrip = req.body.description;
//     var lat = req.body.lat;
//     var lng = req.body.lng;
//     var author =  {
//         id: req.user._id,
//         username: req.user.username
//     };
//     var newcampground = { name: name, image: image, description: descrip, price: price, lat: lat, lng: lng,author: author};
//     Campground.create(newcampground,function(err,campground){
//         if(err)
//         console.log(err);
//         else
//         res.redirect("/campgrounds");//redirect to campgrounds page
//     });
// });
//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var descrip = req.body.description;
    var location = req.body.location;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, function (err, data) {
      if (err || !data.length) {
          //console.log(err);
        var newcampground = {name: name, image: image, description: descrip,price: price, author:author,location: location,lat:lat,lng:lng};
        Campground.create(newcampground,function(err,campground){
                    if(err)
                    console.log(err);
                    else
                    res.redirect("/campgrounds");//redirect to campgrounds page
        });
               
                req.flash('error', ' Location will not be shown. Ask the owner to purchase google maps api key! '); 
                req.flash('success','Campground added successfully.');
            }
            else{
      var lat = data[0].latitude;
      var lng = data[0].longitude;
      location = data[0].formattedAddress;
       newcampground = {name: name, image: image, description: descrip,price: price, author:author, location: location, lat: lat, lng: lng};
      // Create a new campground and save to DB
      Campground.create(newcampground, function(err, campground){
          if(err){
              //console.log(err);
          } else {
              //redirect back to campgrounds page
              
              res.redirect("/campgrounds");
          }
      });
    }
    });
  });
//NEW
router.get("/new",middleware.isLoggedIn,function(req,res){
res.render("campgrounds/new.ejs");
});
/*.......... ............*/

//SHOW template for More-Info button
router.get("/:id",middleware.isLoggedIn,function(req,res){
    //find campground by provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
        if(err)
        console.log(err);
        else{
            var city = foundCampground.location;
            var url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${process.env.WEATHER_API}`;
            request(url, function (err, response, body) {
                if(err){
                  console.log(err);
                } else {
                 let weather = JSON.parse(body)
                  if(weather.main == undefined){
                    console.log("weather undefined");
                  } else {
                    let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
                    console.log(weather);
                    foundCampground.weather.main=weather.weather[0].main;
                    foundCampground.weather.desc=weather.weather[0].description;
                    foundCampground.weather.current=((weather.main.temp - 32)*5/9).toFixed(2);
                    foundCampground.weather.feelslike=((weather.main.feels_like - 32)*5/9).toFixed(2);
                    foundCampground.weather.max=((weather.main.temp_max - 32)*5/9).toFixed(2);
                    foundCampground.weather.min=((weather.main.temp_min - 32)*5/9).toFixed(2);
                    foundCampground.weather.hum=(weather.main.humidity).toFixed(2);
                    var sr = new Date(weather.sys.sunrise*1000).toLocaleTimeString("en-US",{timeZone: "Asia/Kolkata"});
                    var ss = new Date(weather.sys.sunset*1000).toLocaleTimeString("en-US",{timeZone: "Asia/Kolkata"});
                    foundCampground.weather.sunr=sr.toString();
                    foundCampground.weather.suns=ss.toString();
                    foundCampground.weather.wind.speed=weather.wind.speed;
                    foundCampground.weather.wind.deg=weather.wind.deg;
                    //console.log(ss.toString());
                   
                    foundCampground.save();
                  }
                }
              });
           // console.log(foundCampground);
            res.render("campgrounds/show",{campground: foundCampground});
               
            
            }
        });
    });

//EDIT ROUTE
router.get("/:id/edit",middleware.checkCampOwnership,function(req,res){
        Campground.findById(req.params.id,function(err,foundCampground){
         res.render("campgrounds/edit",{campground:foundCampground});
});
});

// //UPDATE ROUTE
// router.put("/:id",middleware.checkCampOwnership,function(req,res){
//     Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
//         if(err)
//         {
//             req.flash("error", err.message);
//             res.redirect("/campgrounds");
//         }
//         else
//         {
//             req.flash("success","Successfully Updated!");
//             res.redirect("/campgrounds/" + req.params.id);
//         }
//     });
// });
//UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampOwnership, function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
      if (err || !data.length) {
        //req.flash('error', 'Invalid address');
       // return res.redirect('back');
      
    //   req.body.campground.lat = data[0].latitude;
    //   req.body.campground.lng = data[0].longitude;
    //   req.body.campground.location = data[0].formattedAddress;
  
      Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
          if(err){
              req.flash("error", err.message);
              res.redirect("back");
          } else {
              req.flash("success","Successfully Updated!");
              res.redirect("/campgrounds/" + req.params.id);//campground._id
          }
      });
      }
    });
  });
//DESTROY ROUTE
router.delete("/:id",middleware.checkCampOwnership,function(req,res){
Campground.findByIdAndRemove(req.params.id,function(err){
if(err)
{
    res.redirect("/campgrounds");
}
else{
    res.redirect("/campgrounds");
}
});
});
// ============ //





module.exports = router;