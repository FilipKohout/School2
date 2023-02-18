const pool = require('./registerpool');
const bcrypt = require('bcrypt');


function User() {};

User.prototype = {
    // Find the user data by id or username.
    find : function(user = null, callback)
    {
        // if the user variable is defind
        if(user) {
            // if user = number return field = id, if user = string return field = username.
            var field = Number.isInteger(user) ? 'id' : 'username';
        }
        // prepare the sql query
        let sql = `SELECT * FROM users WHERE ${field} = ?`;


        pool.query(sql, user, function(err, result) {
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
    create : function(body, callback) 
    {
        var pwd = body.password;
        // Hash the password before insert it into the database.
        body.password = bcrypt.hashSync(pwd,10);

        // this array will contain the values of the fields.
        var bind = [];
        // loop in the attributes of the object and push the values into the bind array.
        for(prop in body){
            bind.push(body[prop]);
        }

        // prepare the sql query
        let sql = `INSERT INTO users(username, password, email) VALUES (?, ?, ?)`;
        // call the query give it the sql string and the values (bind array)
        pool.query(sql, bind, function(err, result) {
            if(err) throw err;

            let sql = `CREATE TABLE user` + result.insertId + ` (id INT AUTO_INCREMENT PRIMARY KEY, type VARCHAR(1000), info VARCHAR(1000), timestamp VARCHAR(100))`;
            // call the query give it the sql string and the values (bind array)
            pool.query(sql, bind, function(err, result2) {
                if(err) throw err;
                // return the last inserted id. if there is no error
                callback(result);
            });
        });
    },

    login : function(username, password, callback)
    {
        // find the user data by his username.
        this.find(username, function(user) {
            // if there is a user by this username.
            if(user) {
                // now we check his password.
                if(bcrypt.compareSync(password, user.password)) {
                    // return his data.¨
                    callback(user, true);
                    return
                }  
                else{
                    callback(null, false);
                    return
                }
            }
            // if the username/password is wrong then return null.
            callback(null);
        });
        
    },

    log : function(userId, body, callback) 
    {
        // this array will contain the values of the fields.
        var bind = [];
        // loop in the attributes of the object and push the values into the bind array.
        for(prop in body){
            bind.push(body[prop]);
        }

        // prepare the sql query
        let sql = `INSERT INTO user` + userId + ` (type, info, timestamp) VALUES (?, ?, ?)`;
        // call the query give it the sql string and the values (bind array)
        pool.query(sql, bind, function(err, result) {
            if(err) throw err;
            // return the last inserted id. if there is no error
            callback(result);
        });
    },

    logFind : function(userId, type, info, callback)
    {
        // prepare the sql query
        console.log(type, info)
        let sql = `SELECT * FROM user` + userId + ` WHERE type=? AND info=?;`;

        pool.query(sql, [type, info], function(err, result) {
            if(err) throw err

            if(result.length) {
                callback(result[0]);
            }else {
                callback(null);
            }
        });
    },

    logDelete : function(userId, id, callback)
    {
        // prepare the sql query
        let sql = `DELETE FROM user` + userId + ` WHERE id=` + id + `;`;

        pool.query(sql, function(err, result) {
            if(err) throw err

            if(result) {
                callback(result);
            }else {
                callback(null);
            }
        });
    },

    updateBio : function(userId, bio, callback)
    {
        // prepare the sql query
        let sql = `UPDATE users SET bio = ? WHERE id = ?;`;

        pool.query(sql, [bio, userId], function(err, result) {
            if(err) throw err

            if(result) {
                callback(result);
            }else {
                callback(null);
            }
        });
    },

    getLog : function(userId, callback)
    {
        let sql = `SELECT * FROM user` + userId + `;`;

        pool.query(sql, function(err, result) {
            if(err) throw err

            if(result.length) {
                callback(result);
            }else {
                callback([]);
            }
        });
    },

    setFollowers : function(followingId, followId, change, callback)
    {
        let sql = "UPDATE users SET following = following " + change + " WHERE id = " + followingId;

        pool.query(sql, function(err) {
            if(err) throw err

            let sql = "UPDATE users SET followers = followers " + change + " WHERE id = " + followId;

            pool.query(sql, function(err) {
                if(err) throw err
    
                callback()
            });
        });
    },
}

module.exports = User;