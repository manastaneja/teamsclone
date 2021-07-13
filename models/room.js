var mongoose = require("mongoose");

var roomSchema = new mongoose.Schema({
    _id:String,
	// roomId:String,
    messages:[{
        text:String,
        username:String,
        timemoment:String
    }],
    participants:[{
        type: String
    }]
});

module.exports = mongoose.model("Room", roomSchema);