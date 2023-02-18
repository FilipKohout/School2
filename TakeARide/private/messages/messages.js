var socket = io('http://localhost:4000');

var activeConversationID = 1;

function requestContacts()
{
    socket.emit("requestUpdateContacts")
}

function requestMessages()
{
    var channelId = activeConversationID
    console.log("Requesting messages from id: " + channelId)
    socket.emit("requestUpdateMessages", channelId);
}

function createHTMLContact(contactUserID, contactName, callback)
{
    var html = ""

    html += "<div class='contact' id='" + contactUserID +"'>"
    html += "<label>" + contactName +"</label>"
    html += "</div>"

    callback(html)
}

function createHTMLMessage(messageId, userId, content, callback)
{
    var html = ""

    html += "<div class='message' id='" + messageId +"'>"
    html += "<label>" + content +"</label>"
    html += "</div>"

    callback(html)
}

socket.on("updateContacts", (contacts)=>{
    if(contacts == "failed")
    {
        console.log("Error, when receiving contact data.")
        return;
    }

    //Delete every contact
    document.getElementsByClassName("contacts")[0].innerHTML = '';

    //Create new received contacts
    contacts.forEach((item) => {
        console.log(item);
        createHTMLContact(item.id, item.userid, item.content, (result)=> {
            var element = document.getElementById("contacts")
            element.innerHTML += result
        })
    })
});

socket.on("updateMessages", (messages)=>{ 
    if(!messages)
    {
        console.log("Error, message is null.")
        return
    }

    if(messages == "fail")
    {
        console.log("Error, when receiving messages data.")
        return
    }

    //Delete every message
    document.getElementsByClassName("messages")[0].innerHTML = '';

    console.log("Deleted every message.")

    //Create new received messages
    messages.forEach((item) => {
        console.log(item);
        createHTMLMessage(item.id, item.userid, item.content, (result) => {
            var element = document.getElementById("messages")
            element.innerHTML += result
        })
    });

    console.log("Created eery received message");
})

function sendMessage()
{
    var content = document.getElementById("messageInputText").value
    socket.emit("requestSendMessages", activeConversationID, content)
}

requestContacts()
requestMessages()