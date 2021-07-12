const socket = io('/');
// const chatPeer = new Peer()
const msgForm = document.getElementById('historychatinput');
// let chatUserID;
// chatPeer.on('open', id=>{
//     chatUserID = id;
//     console.log("My Id: ", id);
//     socket.emit('join-chat-room', chatroom_id, id);
// })
//CHAT 
   socket.emit('join-chat-room', chatroom_id);
//    function appendMessages(message) {
//        const html = `<div class="messagediv" style="word-break: break-all;"><li class = "message"><b>${message.text}</b>
//                            <br>${message.username}<br><small class="text-muted">${message.timemoment.substring(12)}</small></li></div>`
//        $('ul').append(html);
//     }
//     socket.on('output-messages', data => {
//         console.log(data)
//         if (data.length) {
//             data.forEach(message => {
//                 appendMessages(message)
//             });
//         }
//     })

    $('html').keydown((e)=>{
        if((e.which == 13 && msgForm.val().length!==0)){
            // console.log(msg.val());
            // msg1 = `${username}` + msg.val();
            const timeFromMomentHistory = moment();
            // var testDateUtc = moment.utc();
            // var localDate = moment(testDateUtc).local();
            // socket.emit('message', msgForm.val(), username, timeFromMoment);
            socket.emit('chathistory-message', msgForm.val(), chatusername, timeFromMomentHistory);
            msgForm.val('');
            // message_sound();
        }
    })
    
    socket.on('createMessage', (message, username, timeFromMoment)=>{
        // console.log('this is from server', message);
        let chatwin = $('.chat-box');
        const html = `<div class="media w-50 ml-auto mb-3"
        <div class="media-body">
          <div class="bg-primary rounded py-2 px-3 mb-2">
            <p class="text-small mb-0 text-white">${message}</p>
          </div>
          <p class="small text-muted justify-content-end">Sent by ${username.toUpperCase()}</p>
        </div>
      </div>`
        chatwin.append(html);
        // scrollBottom();
    })
    // socket.on('user-connected', userID => {
    //     connectToNewUser(userID, stream);
    // })
    
    // const scrollBottom = () =>{
    //     let d = $('.chat-window');
    //     d.scrollTop(d.prop("scrollHeight"));
    // }
    // const message_sound = () => {
    //     document.getElementById("message-sound").play();
    // }