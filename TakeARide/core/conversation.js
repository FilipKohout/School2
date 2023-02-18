const pool = require('./conversationpool');
const bcrypt = require('bcrypt');


function Conversation() {};

Conversation.prototype = {
    // Find the conversation data by id.
    find : function(conversationID = null, callback)
    {
        var field = "id";

        // prepare the sql query
        let sql = `SELECT * FROM conversations WHERE ${field} = ?`;

        pool.query(sql, conversationID, function(err, result) {
            //TODO: Stop throwiing err, when someone posts id like: "hi mom"
            if(err) throw err

            if(result.length) {
                callback(result[0]);
            }else {
                callback(null);
            }
        });
    },

    // This function will insert data into the database. (create a new user)
    // body is an object 

    //[UserID(owner), memberIds(members), encrypt(is using symetric encryption)]
    createNewConversation : function(body, callback) 
    {
        var CreatorID = body.userid
        var memberIDs = body.memberids
        var encrypt = body.encrypt

        body.timestamp = Date.now()

        // this array will contain the values of the fields.
        var bind = [];
        // loop in the attributes of the object and push the values into the bind array.
        for(prop in body){
            bind.push(body[prop]);
        }

        // prepare the sql query
        let addConversationRecord = "INSERT INTO conversations(userid, memberids, timestamp, encrypt) VALUES (?, ?, ?, ?)";

        pool.query(addConversationRecord, bind, function(err, result) {
            if(err) throw err;
        });

        let messagesTable = "CREATE TABLE messages" + conversationID + "(id INT AUTO_INCREMENT PRIMARY KEY, userid INT, edited BOOL, content VARCHAR(1000), timestamp VARCHAR(100))";

        pool.query(messagesTable, bind, function(err, result) {
            if(err) throw err;

            callback(result);
        });
    },
    getMessages : function(conversationId, callback) 
    {
        // prepare the sql query
        let sql = "SELECT * FROM messages" + conversationId + " ORDER BY timestamp ASC";

        pool.query(sql, function(err, result) {
            if(err) throw err

            if(result.length) {
                callback(result);
            }else {
                callback(null);
            }
        });
    },

    addMessage : function(conversationId, userId, edited, content, callback)
    {
        // this array will contain the values of the fields.
        var bind = [];

        bind.push(userId)
        bind.push(edited)
        bind.push(content)
        let timestamp = Date.now();
        bind.push(timestamp)

        let addConversationRecord = "INSERT INTO messages" + conversationId + "(userid, edited, content, timestamp) VALUES (?, ?, ?, ?)";

        pool.query(addConversationRecord, bind, function(err, result) {
            if(err) throw err;

            if(!result){
                callback(null)
            }

            if(!result.insertId)
            {
                callback(null)
            }

            callback(result);
        });
    },

    getMembers : function(conversationID, callback)
    {
        // prepare the sql query
        let sql = `SELECT * FROM conversations WHERE id="?"`

        pool.query(sql, [conversationID], function(err, result) {
            //TODO: Stop throwiing err, when someone posts id like: "hi mom"
            if(err) throw err

            console.log(result)

            if(result.length) {
                callback(result[0]);
            }else {
                callback(null);
            }
        });
    },
}

module.exports = Conversation;