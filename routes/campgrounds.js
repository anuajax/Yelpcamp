var express = require("express");
var router = express.Router();
var request = require('request');
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
              console.log(err);
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
router.get("/:id",function(req,res){
    //find campground by provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
        if(err)
        console.log(err);
        else{
            // var city = foundCampground.location;
            // var apiKey = "a4388366d44ff0ddbb56aab03b05eb1c";
            // var url = "http://api.openweathermap.org/data/2.5/weather?q="+city+"&units=imperial&appid="+apiKey;
            // //console.log(foundCampground);
            // //render show template for that campground
            // request(url, function (err, response, body) {
            //     if(err || response.statusCode !==200)
            //     {
            //         //req.flash("error",'weather not found');
            //         console.log(err);
            //     }
            //     else{
            //          weather = JSON.parse(body);
            //         console.log(weather.main.temp);
            //         let weatherDetail = {
            //             temp: weather.main.temp,
            //             des: weather.weather[0].main,
            //             humidity: weather.main.humidity
            //         }
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