const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const session = require("express-session");
const passport = require("passport");
const expressSanitizer = require("express-sanitizer");
const LocalStrategy = require("passport-local");
const mongoose = require("mongoose");
const moment = require('moment');
const User = require("./models/user.js");
const Room = require("./models/room");

const peerServer = ExpressPeerServer(server, {
  debug: true
});
app.use(require('cors')())
const { v4: uuidv4} = require('uuid');
const { WSAETIMEDOUT } = require('constants');

mongoose.connect('mongodb+srv://neha:NehaGoyal@123@cluster0.vqfk9.mongodb.net/msteams?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to DB!'))
.catch(error => console.log(error.message));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.use(express.json())
app.use(expressSanitizer());
app.use('/peerjs', peerServer);

app.use(session({
	secret:"Teams Clone",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	next();
})
const isLoggedIn = function(req,res,next){
	if(!req.isAuthenticated() || !req.isAuthenticated){
		if(req.session){
			req.session.redirectUrl = req.headers.referer || req.originalUrl || req.url;
		}
		res.redirect('/login');
	}else{
		next();
	}
}
app.get('/', (req, res)=>{
	res.redirect('/home');
})
app.get('/room', isLoggedIn ,(req, res) => {
	const uid = uuidv4();
    res.redirect(`/${uid.substring(0, 12)}`);
})
app.get('/home', (req, res) => {
    if(req.user != null){
		User.findById(req.user._id).populate("rooms").exec(function(err,foundUser){
			if(err){
				// req.flash("error","Something went wrong!");
				console.log(err);
			}else{
				res.render("index", {user:foundUser});
			}
		})
	}else{
		res.render("index");
	}
})
app.get('/chat', (req, res) => {
    if(req.user != null){
		User.findById(req.user._id).populate("rooms").exec(function(err,foundUser){
			if(err){
				// req.flash("error","Something went wrong!");
				console.log(err);
			}else{
				res.render("chat", {user:foundUser});
			}
		})
	}else{
		res.render("chat");
	}
})
app.get("/chat/:id", (req, res)=>{
	Room.findById(req.params.id, function(err, room){ 
		if(err){
			console.log(err)
		} 
		else{
			// console.log(room);
			// console.log(req.params.id);
			res.render("history", {room:room})
		}
	})	
})
app.post('/join', (req, res)=>{
	var url = req.body.url;
	Room.findById(url, function(err, room){ 
		if(err){
			console.log(err);
		} 
		else{
			if(room!=null){
				res.redirect("/"+url);
			} else{
				// console.log("Enter valid code");
				res.redirect("/home");
			}	
		}
	})	

})
app.get("/history", isLoggedIn, (req, res)=>{
	res.render("history");
})
app.get("/exit",isLoggedIn, (req,res) => {
	res.render("exit");
});

app.get("/register", (req, res)=>{
	res.render("register");
})
app.post("/register",(req,res) => {
	  
	let newUser = new User({username:req.body.username});
	User.register(newUser, req.body.password, (err,user) => {
		if(err){
			console.log(err);
			// if(err.message=="A user with the given username is already registered"){
			// 	req.flash("error", "A user with the given email is already registered");
			// }else{
			// 	req.flash("error", err.message);
			// }
			return res.redirect("back")
		}
        // console.log(currentUser);
		passport.authenticate("local")(req,res,() => {
			// req.flash("success", "Successfully registered");
			// const uid = uuidv4().splice(0, 5);
    		res.redirect("/");
			// res.redirect(`/${uuidv4()}`);
		})
	})
})

//LOGIN ROUTES
app.get("/login",(req,res) => {
	
	res.render("login")
});
app.post("/login",passport.authenticate("local",{
		failureRedirect:"/home"
	}),(req,res) => {
		User.findById(req.user._id);
		var redirectionUrl = req.session.redirectUrl || '/home';
		// const uid = uuidv4().splice(0, 5);
    	res.redirect(redirectionUrl);
        // res.redirect(`/${uuidv4()}`);
});
app.get("/chat", isLoggedIn, (req, res)=>{
	res.render("chat");
})
//LOGOUT ROUTES
app.get("/logout",(req,res) => {
	req.logout();
	res.redirect("/home");
})

app.get('/:room', isLoggedIn, (req, res) => {
	User.findById(req.user._id, function(err, user){
		if(err){
			console.log(err);
		}else{
			if(req.params.room != "favicon.ico"){
				Room.findById(req.params.room, function(err, room){
					if(err){
						console.log(err);
						
					}else{
						if(!room){
							var newRoom = {_id:req.params.room};
							Room.create(newRoom ,function(err,room){
								if(err){
									// req.flash("error","Something went wrong!");
									console.log(err);
								}else{
									// room.participantsArray.push(req.user.username);
									room.save();
									user.rooms.push(room);
									user.save();
								}
							})
						}else{
							// room.participantsArray.push(req.user.username);
							// room.save();
							user.rooms.push(room);
							user.save();
						}
					}
				})
				
			}
			
		}
	})
	res.render('myroom', {roomID: req.params.room});
})

io.on('connection', socket =>{
	
    socket.on('join-room', (roomID, userID, username) => {
        socket.join(roomID);
		// Room.findById(roomID).then((room)=>{
		// 	console.log("hi");
		// 	socket.emit('output-messages', room.messages);
		// })
		
        // socket.broadcast.to(roomID).emit('user-connected', userID);
		
		//ADD THE USERNAME TO PARTICIPANT SCHEMA
		// var newPart = {_id:username};
		// Participant.create(newPart ,function(err,parti){
		// 	if(err){
		// 		// req.flash("error","Something went wrong!");
		// 		console.log(err);
		// 	}else{
		// 		console.log("new partici created");
		// 		parti.save();
		// 	}
		// })
		// //

        socket.broadcast.to(roomID).emit('user-connected', userID, username); 

		Room.findById(roomID).then((room)=>{
			console.log("hi");
			console.log(roomID);
			// socket.emit('output-messages', room.messages);
			setTimeout(()=>{socket.emit('output-messages', room.messages)}, 2000);
		})
        socket.on('message', (message, username, timeFromMoment)=>{
			// Room.findById(roomID).then((room)=>{
			// 	// console.log("hi");
			// 	socket.emit('output-messages', room.messages);
			// })
			Room.findById(roomID, function(err, room){
				if(err){
					console.log(err);
				}else{
					const newMsg = {text:message, username:username, timemoment:timeFromMoment};
					room.messages.push(newMsg);
					room.save().then(()=>{
						io.to(roomID).emit('createMessage', message, username, timeFromMoment);
					})
				}
			})
            
        })

        socket.on('disconnectTheUser', (roomID, userID, username)=>{
			// REMOVE THE USERNAME FROM THE PARTICIPANT SCHEMA

			//
			socket.broadcast.to(roomID).emit('user-disconnected', userID, username);
            // setTimeout(()=>{socket.broadcast.to(roomID).emit('user-disconnected', userID)}, 6000);
			// console.log('disconnected!', roomID, userID); 
			// setTimeout(()=>{io.to(roomID).emit('user-disconnected', userID)}, 6000); 
			// io.to(roomID).emit('user-disconnected', userID);
        })
    })
	// socket.on('join-chat-room', (chatroomid)=>{
	// 	socket.join(chatroomid);
	// 	socket.on("chathistory-message", (message, chatusername, timeFromMomentHistory)=>{
	// 		Room.findById(chatroomid, function(err, room){
	// 			if(err){
	// 				console.log(err);
	// 			}else{
	// 				const newMsg = {text:message, username:chatusername, timemoment:timeFromMomentHistory};
	// 				room.messages.push(newMsg);
	// 				room.save().then(()=>{
	// 					io.to(chatroomid).emit('createMessage', message, username, timeFromMoment);
	// 				})
	// 			}
	// 		})
	// 	})
	// })
    
})

server.listen(process.env.PORT || 3030);