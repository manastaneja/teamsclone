const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '3030'
})
$(document).ready(()=>{
    setInterval(()=>{
        var today = new Date();
        if(today.getSeconds()<10){
            var time = today.getHours() + ":" + today.getMinutes() + ":0" + today.getSeconds();
        } else{
            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        }
        const html = `${time}`;
        document.querySelector('.live-time').innerHTML = html;
    }, 1000);
})
// const show_time = () => {
//     var today = new Date();
//     var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
//     const html = `${time}`;
//     document.querySelector('.live-time').innerHTML = html;
//     console.log(time);
// }
// FOR CURRENT TIME 
// var today = new Date();
// var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
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
    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream)
        })
        // console.log("I am added");
      })
    //adding the call of the new user to the stream
    socket.on('user-connected', userID => {
        setTimeout(()=>{connectToNewUser(userID, stream)}, 1000);
    })
    //CHAT 
    let msg = $('input');
    $('html').keydown((e)=>{
        if((e.which == 13 && msg.val().length!==0)){
            // console.log(msg.val());
            socket.emit('message', msg.val());
            msg.val('');
            message_sound();
        }
    })
    socket.on('createMessage', (message)=>{
        // console.log('this is from server', message);
        $('ul').append(`<li class = "message"><b>User</b><br>${message}</li>`);
        scrollBottom();
    })
    // socket.on('user-connected', userID => {
    //     connectToNewUser(userID, stream);
    // })
    socket.on('user-disconnected', userID => {
        if(peers[userID]) peers[userID].close()
    })
    
})

myPeer.on('open', id=>{
    console.log("My Id: ", id);
    socket.emit('join-room', room_id, id);
})

// socket.on('user-connected', (userID) => {
//     connectToNewUser(userID, stream);
// })
const connectToNewUser = (userID, stream) =>{
    console.log("new user", userID);
    const call = myPeer.call(userID, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove();
    })
    peers[userID] = call
}
// adding video stream function
const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => { /////checkkkkkkkkkkkkk
        video.play();
    })
    // window.peerStream = stream;
    videoGrid.append(video);
}

const scrollBottom = () =>{
    let d = $('.chat-window');
    d.scrollTop(d.prop("scrollHeight"));
}

//Mute the audio
const muteToggle = () =>{
    const enable = myVideoStream.getAudioTracks()[0].enabled;
    if(enable){
        myVideoStream.getAudioTracks()[0].enabled = false;
        setMutedButton();
    } else{
        setUnmutedButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}
const setMutedButton = () =>{
    const html = `<i class="fas fa-microphone-slash" style="color:red"></i>`;
    document.querySelector('.mute-button').innerHTML = html;
}
const setUnmutedButton = () =>{
    const html = `<i class="fas fa-microphone"></i>`;
    document.querySelector('.mute-button').innerHTML = html;
}
// VIDEO TOGGLE
const videoToggle = () =>{
    let enable = myVideoStream.getVideoTracks()[0].enabled;
    if(enable){
        myVideoStream.getVideoTracks()[0].enabled = false;
        // ADD THE IMAGE WHEN VIDEO DISABLED
        stopVideoButton();
    } else{
        playVideoButton();
        // REMOVE THE IMAGE AND ADD THE VIDEO BACK
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}
const stopVideoButton = () =>{
    const html = `<i class="fas fa-video-slash" style = "color:red"></i>`;
    document.querySelector('.video-button').innerHTML = html;
}
const playVideoButton = () =>{
    const html = `<i class="fas fa-video"></i>`;
    document.querySelector('.video-button').innerHTML = html;
}
const message_sound = () => {
    document.getElementById("message-sound").play();
}

const openCloseChat = () => {
    let button = document.querySelector('.chat_button');
    let content = document.querySelector('.main-right');
    let videoContent = document.querySelector('.main-left');
    button.classList.toggle('chat_button--active');
    if(button.classList.contains("chat_button--active")){
        // content.style.maxHeight = content.scrollHeight + 'px';
        content.style.display = "none";
        videoContent.style.flex = 0.85;
    
    } else{
        videoContent.style.flex = 0.65;
        content.style.display = "flex";    
        // content.style.maxHeight = 0;
    }
}