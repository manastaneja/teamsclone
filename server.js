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
	if(req.isAuthenticated()){
		return next()
	}else{
		res.redirect('/login');
	}
}
app.get('/', isLoggedIn ,(req, res) => {
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
app.get("/history", (req, res)=>{
	res.render("history");
})
app.get("/exit",(req,res) => {
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
		// const uid = uuidv4().splice(0, 5);
    	res.redirect("/");
        // res.redirect(`/${uuidv4()}`);
});
app.get("/chat", (req, res)=>{
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
									room.save();
									user.rooms.push(room);
									user.save();
								}
							})
						}else{
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
	
    socket.on('join-room', (roomID, userID) => {
        socket.join(roomID);
		// Room.findById(roomID).then((room)=>{
		// 	console.log("hi");
		// 	socket.emit('output-messages', room.messages);
		// })
		
        socket.broadcast.to(roomID).emit('user-connected', userID); 
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

        socket.on('disconnectTheUser', (roomID, userID)=>{
			socket.broadcast.to(roomID).emit('user-disconnected', userID);
            // setTimeout(()=>{socket.broadcast.to(roomID).emit('user-disconnected', userID)}, 6000);
			// console.log('disconnected!', roomID, userID); 
			// setTimeout(()=>{io.to(roomID).emit('user-disconnected', userID)}, 6000); 
			// io.to(roomID).emit('user-disconnected', userID);
        })
    })
    
})

server.listen(process.env.PORT || 3030);