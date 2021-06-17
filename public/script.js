const socket = io('/');
const videoGrid = document.getElementById('video-grid');
var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '3030'
})
let myVideoStream
// let userVideoStream
const myVideo = document.createElement('video');
myVideo.muted = true // change
const peers = {}
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    
    //answering the call from the user
    peer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream)
        })
        console.log("I am added");
      })
    //adding the call of the new user to the stream
    socket.on('user-connected', userID => {
        connectToNewUser(userID, stream);
    })
    // socket.on('user-disconnected', userID => {
    //     if(peers[userID]) peers[userID].close()
    // })
    
})

peer.on('open', id=>{
    console.log("My Id: ", id);
    socket.emit('join-room', room_id, id);
})

// socket.on('user-connected', (userID) => {
//     connectToNewUser(userID, stream);
// })
const connectToNewUser = (userID, stream) =>{
    console.log("new user", userID);
    const call = peer.call(userID, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    // call.on('close', () => {
    //     video.remove();
    // })
    // peers[userID] = call
}
// adding video stream function
const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => { /////checkkkkkkkkkkkkk
        video.play();
    })
    window.peerStream = stream;
    videoGrid.append(video);
}