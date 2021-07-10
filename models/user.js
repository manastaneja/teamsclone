var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var userSchema = new mongoose.Schema({
	username:String,
	password:String,
	rooms: [
		{
			type:String,
			ref :"Room"
		}
	]
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User",userSchema);