var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware/index.js");
/*.......campgrounds INDEX page..........*/
router.get("/",function(req,res){
    Campground.find({},function(err,allcampgrounds){
        if(err)
        console.log(err);
        else
        res.render("campgrounds/index",{ campgrounds: allcampgrounds,currentUser: req.user}); //this is retrieving data from our database
    });
    });
//CREATE: adding new campground to DB
router.post("/",middleware.isLoggedIn,function(req,res){
    //get data from form and add to (campgrounds array) database now
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var descrip = req.body.description;
    var author =  {
        id: req.user._id,
        username: req.user.username
    };
    var newcampground = { name: name, image: image, description: descrip,price: price,author : author};
    Campground.create(newcampground,function(err,campground){
        if(err)
        console.log(err);
        else
        res.redirect("/campgrounds");//redirect to campgrounds page
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
            console.log(foundCampground);
            //render show template for that campground
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

//UPDATE ROUTE
router.put("/:id",middleware.checkCampOwnership,function(req,res){
    Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
        if(err)
        {
            res.redirect("/campgrounds");
        }
        else
        {
            res.redirect("/campgrounds/" + req.params.id);
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