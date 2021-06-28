const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
app.use(require('cors')())
const { v4: uuidv4} = require('uuid');


app.use(express.static('public'));
app.use('/peerjs', peerServer);

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.redirect(`/${uuidv4()}`);
})

app.get('/:room', (req, res) => {
    res.render('myroom', {roomID: req.params.room});
})

io.on('connection', socket =>{
    socket.on('join-room', (roomID, userID) => {
        socket.join(roomID);

        socket.broadcast.to(roomID).emit('user-connected', userID); 
        socket.on('message', (message)=>{
            io.to(roomID).emit('createMessage', message);
        })

        socket.on('disconnect', (roomID, userID)=>{
            socket.broadcast.to(roomID).emit('user-disconnected', userID); 

        })
    })
    
})

server.listen(3030);