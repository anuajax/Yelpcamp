var mongoose = require("mongoose");
var campSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    description: String,
    location: String,
    weather: {main:String,desc:String,current: Number,feelslike: Number,max: Number,min: Number,hum: Number,
    sunr:String,suns:String,wind:{speed: Number,deg:Number}},
    lat: Number,
    lng: Number,
    author : {
        id : {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User"
        },
        username: String
    },
    comments: [
        { type: mongoose.Schema.Types.ObjectId,
           ref: "Comment"
        }
    ]
});
module.exports = mongoose.model("Campground",campSchema);