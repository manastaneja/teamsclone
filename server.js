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

const User = require("./models/user.js");
const peerServer = ExpressPeerServer(server, {
  debug: true
});
app.use(require('cors')())
const { v4: uuidv4} = require('uuid');

mongoose.connect('mongodb+srv://neha:NehaGoyal@123@cluster0.vqfk9.mongodb.net/femev?retryWrites=true&w=majority', {
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
    res.redirect(`/${uuidv4()}`);
})
app.get('/home', (req, res) => {
    res.render("index");
})

app.get("/exit",(req,res) => {
	res.render("exit");
});

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
        console.log(currentUser);
		passport.authenticate("local")(req,res,() => {
			// req.flash("success", "Successfully registered");
			res.redirect(`/${uuidv4()}`);
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
        res.redirect(`/${uuidv4()}`);
});

//LOGOUT ROUTES
app.get("/logout",(req,res) => {
	req.logout();
	res.redirect("/home");
})

app.get('/:room', isLoggedIn, (req, res) => {
    res.render('myroom', {roomID: req.params.room});
})

io.on('connection', socket =>{
    socket.on('join-room', (roomID, userID) => {
        socket.join(roomID);

        socket.broadcast.to(roomID).emit('user-connected', userID); 
        socket.on('message', (message, username)=>{
            io.to(roomID).emit('createMessage', message, username);
        })

        socket.on('disconnectTheUser', (roomID, userID)=>{
			socket.broadcast.to(roomID).emit('user-disconnected', userID);
            // setTimeout(()=>{socket.broadcast.to(roomID).emit('user-disconnected', userID)}, 6000);
			console.log('disconnected!', roomID, userID); 
			// setTimeout(()=>{io.to(roomID).emit('user-disconnected', userID)}, 6000); 
			// io.to(roomID).emit('user-disconnected', userID);
        })
    })
    
})

server.listen(3030);