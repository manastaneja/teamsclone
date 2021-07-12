const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer()
// const myPeer = new Peer();
//LIVE TIME
$(document).ready(()=>{
    setInterval(()=>{
        var today = new Date();
        let min = today.getMinutes();
        let sec = today.getSeconds();
        let hours = today.getHours();
        if(min<10){
            min = "0" + min;
        }
        if(sec<10){
            sec = "0" + sec;
        }
        if(hours<10){
            hours = "0" + hours;
        }
        var time = hours + ":" + min + ":" + sec;
        const html = `${time}`;
        document.querySelector('.live-time').innerHTML = html;
    }, 1000);
})
let myVideoStream
// let userVideoStream
const myVideo = document.createElement('video');
myVideo.muted = true // change
const peers = {};
const participants = [];
participants.push(username);
let userID;
myPeer.on('open', id=>{
    userID = id;
    console.log("My Id: ", id);
    socket.emit('join-room', room_id, id, username);
})
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
    socket.on('user-connected', (userID, username) => {
        setTimeout(()=>{connectToNewUser(userID, stream, username)}, 1500);
    })
    socket.on('user-disconnected', (userID, username) => {
        // setTimeout(()=>{console.log("disconnected....")}, 6000);
        console.log("disconnected....");
        participants.includes(username) && participants.splice(participants.indexOf(username),1);
        if(peers[userID]) peers[userID].close();
        // participants.indexOf().splice();
        // if (document.getElementById(userID)) {
        //     document.getElementById(userID).remove();
        // }
        // delete peers[userID];
        // connectToNewUser(userID, stream);
        // video.close();
    })

    //CHAT 
    function appendMessages(message) {
        const html = `<div class="messagediv" style="word-break: break-all;"><li class = "message"><div class = "message_head"><b>${message.text}</b></div>sent by ${message.username}<br><small class="text-muted">${message.timemoment.substring(12)}</small></li></div>`
        $('ul').append(html);
    }
    socket.on('output-messages', data => {
        console.log(data)
        if (data.length) {
            data.forEach(message => {
                appendMessages(message)
            });
        }
    })

    
    let msg = $('.chatMessage');
    $('html').keydown((e)=>{
        if((e.which == 13 && msg.val().length!==0)){
            // console.log(msg.val());
            // msg1 = `${username}` + msg.val();
            const timeFromMoment = moment();
            // var testDateUtc = moment.utc();
            // var localDate = moment(testDateUtc).local();
            socket.emit('message', msg.val(), username, timeFromMoment);
            msg.val('');
            message_sound();
        }
    })
    
    socket.on('createMessage', (message, username, timeFromMoment)=>{
        // console.log('this is from server', message);
        $('ul').append(`<div class="messagediv" style="word-break: break-all;"><li class = "message"><div class = "message_head"><b>${message}</b></div>sent by ${username}<br><small class="text-muted">${timeFromMoment.substring(11)}</small></li></div>`);
        scrollBottom();
    })
    // socket.on('user-connected', userID => {
    //     connectToNewUser(userID, stream);
    // })
    

})
// socket.on('user-disconnected', userID => {
//     console.log("disconnected....");
//     if(peers[userID]) peers[userID].close();
//     // connectToNewUser(userID, stream);
//     // video.close();
// })
// let leaveButton = document.getElementById("leaveMeeting");
// leaveButton.onclick(()=>{
//     socket.emit("disconnect", room_id, userID);
//     location.href = "/home";
// })
const leaveMeet = () => {
    // document.getElementById("message-sound").play();
    socket.emit('disconnectTheUser', room_id, userID, username);
    location.href = "/exit";
    
    // socket.disconnect(); 
    // location.href = "/exit";
    // socket.close();
}
const showParticipants = () => {
    let pbody = $(".participantsModalBody");
    let i = 0;
    for(i; i<participants.length; i++){
        const name = participants[i];
        const phtml =  `<br>${i+1}. ${name.toUpperCase()}`;
        pbody.append(phtml);
    }
}
const removePartiList = () => {
    let pbody = $(".participantsModalBody");
    pbody.empty();
}
// var ignoreClickOnMeElement = document.getElementById('partidiv');
// document.addEventListener('click', function(event) {
//     var isClickInsideElement = ignoreClickOnMeElement.contains(event.target);
//     if (!isClickInsideElement) {
//         let pbody = $(".participantsModalBody");
//         pbody.empty();
//     }
// });
// const leaveMeet = () => {
//     console.log('leave meeting')
//     socket.emit("disconnect", room_id, userID);

//     const video = document.querySelector('video');

//     // A video's MediaStream object is available through its srcObject attribute
//     const mediaStream = video.srcObject;

//     // Through the MediaStream, you can get the MediaStreamTracks with getTracks():
//     const tracks = mediaStream.getTracks();

//     // Tracks are returned as an array, so if you know you only have one, you can stop it with: 
//     tracks[0].stop();

//     // Or stop all like so:
//     tracks.forEach(track => track.stop())
//     window.close();
//     setStopVideo()
//     setMuteButton()
//     document.querySelector('.main__leave_meeting').innerHTML = html;
//   }


// socket.on('user-disconnected', userID => {
//     if(peers[userID]) peers[userID].close();
// })
// let userID;
// myPeer.on('open', id=>{
//     userID = id;
//     console.log("My Id: ", id);
//     socket.emit('join-room', room_id, id);
// })

// socket.on('user-connected', (userID) => {
//     connectToNewUser(userID, stream);
// })
const connectToNewUser = (userID, stream, username) =>{
    console.log("new user", userID);
    const call = myPeer.call(userID, stream)
    const video = document.createElement('video')
    // video.setAttribute("poster","https://images.unsplash.com/photo-1543946207-39bd91e70ca7?ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8ZnVsbCUyMGhkJTIwd2FsbHBhcGVyfGVufDB8fDB8fA%3D%3D&ixlib=rb-1.2.1&w=1000&q=80");
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        // video.removeAttribute('srcObject');
        video.remove();
    })
    peers[userID] = call
    participants.push(username);
}
// const connectToNewUserRemoveVideo = (userID, stream) => {
//     const call = myPeer.call(userID, stream)
//     call.on('close', () => {
//         video.removeAttribute('srcObject');
//         video.remove();
//         videoElement.pause();
//         videoElement.removeAttribute('src'); // empty source
//         videoElement.load();
//     })
// }
// adding video stream function
const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    // if(stream==false){
    //     video.setAttribute('poster', 'images/gender_neutral.png');
    // }
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
        videoContent.style.transition = 'flex 0.5s ease-in-out';
        content.style.transition = 'margin 0.5s ease-in-out';
        content.style.margin = "0% -20% 0% 0%";
        videoContent.style.flex = 1;
    
    } else{
        videoContent.style.transition = 'flex 0.5s ease-in-out'; 
        content.style.transition = 'margin 0.5s ease-in-out';
        videoContent.style.flex = 0.85;
        content.style.margin = "0% 0% 0% 0%";        
    }
}
const shareScreen = async () => {
    let captureStream = null;
  
    try {
      captureStream = await navigator.mediaDevices.getDisplayMedia();
    } catch (err) {
      console.error("Error: " + err);
    }
    // connectToNewUser(myUserId, captureStream);
    myPeer.call(myUserId, captureStream);
  };

// var e = document.querySelector('.chat_button');
//  e.onmouseover = function() {
//    document.querySelector('.chat_popup').style.display = 'block';
//  }
//  e.onmouseout = function() {
//    document.querySelector('.chat_popup').style.display = 'none';
//  }

// document.querySelector(".leaveMeeting").click(()=>{
//     location.href = "/exit.html";
// })

// SEND EMAIL INVITES 
let addPeopleMail = $('.inviteMail');
const sendMail = () => {
    if(addPeopleMail.val().length!==0){
    Email.send({
        Host: "smtp.gmail.com",
        Username: "teamsclone9@gmail.com",
        Password: "manastaneja",
        To: `${addPeopleMail.val()}`,
        From: "teamsclone9@gmail.com",
        Subject: "Teams Meeting Invite",
        Body: `<h2>Hey!
        You've been invited to this meeting.<br>
        Click on the link to join now : https://myteamsapp.herokuapp.com/${room_id} <br>
        <b>From: ${username.toUpperCase()} </b></h2>`,
      })
        .then(function (message) {
          addPeopleMail.val('');
          alert("Mail has been sent successfully")
        });
    } else{
        alert("Please enter email id to send invite");
    }    
}