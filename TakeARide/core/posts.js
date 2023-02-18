const pool = require('./postspool');


function Post() {};

Post.prototype = {
    // This function will insert data into the database. (create a new post)
    // body is an object 
    create : function(body, callback) 
    {
        // this array will contain the values of the fields.
        var bind = [];
        // loop in the attributes of the object and push the values into the bind array.
        for(prop in body){
            bind.push(body[prop]);
        }

        // prepare the sql query
        let sql = `INSERT INTO posts(userid, content, timestamp) VALUES (?, ?, ?)`;
        // call the query give it the sql string and the values (bind array)
        pool.query(sql, bind, function(err, result) {
            if(err) throw err;
            // return the last inserted id. if there is no error
            callback(result);
        });
    },
    get : function(_, callback) 
    {
        // prepare the sql query
        let sql = `SELECT * FROM posts ORDER BY timestamp ASC`;

        pool.query(sql, function(err, result) {
            if(err) throw err

            if(result.length) {
                callback(result);
            }else {
                callback(null);
            }
        });
    },
    delete : function(postId, callback) 
    {
        // prepare the sql query
        let sql = `DELETE FROM posts WHERE id=`+postId+";";

        pool.query(sql, function(err, result) {
            if(err) throw err

            if(result) {
                callback(result);
            }else {
                callback(null);
            }
        });
    },
    updateLikes : function(postId, change, callback) 
    {
        // prepare the sql query
        let sql = "UPDATE posts SET likes = likes " + change + " WHERE id = " + postId;

        pool.query(sql, function(err, result) {
            if(err) throw err

            if(result) {
                callback(result);
            }else {
                callback(null);
            }
        });
    },
    createComments : function(postId, callback) 
    {
        // prepare the sql query
        let sql = `CREATE TABLE comments` + postId + ` (id INT AUTO_INCREMENT PRIMARY KEY, userid INT, content VARCHAR(1000), timestamp VARCHAR(100))`;
        // call the query give it the sql string and the values (bind array)
        pool.query(sql, function(err, result) {
            if(err) throw err;
            // return the last inserted id. if there is no error
            callback(result);
        });
    },
    createComment : function(postId, body, callback) 
    {
        // this array will contain the values of the fields.
        var bind = [];
        // loop in the attributes of the object and push the values into the bind array.
        for(prop in body){
            bind.push(body[prop]);
        }

        // prepare the sql query
        let sql = `INSERT INTO comments` + postId + `(userid, content, timestamp) VALUES (?, ?, ?)`;
        // call the query give it the sql string and the values (bind array)
        pool.query(sql, bind, function(err, result) {
            if(err) throw err;
            // return the last inserted id. if there is no error
            callback(result);
        });
    },
    getComments : function(postId, callback) 
    {
        // prepare the sql query
        let sql = `SELECT * FROM comments` + postId;

        pool.query(sql, function(err, result) {
            if(err) throw err

            if(result.length) {
                callback(result);
            }else {
                callback([]);
            }
        });
    },
    deleteComment : function(postId, originalPostId, callback) 
    {
        // prepare the sql query
        let sql = `DELETE FROM comments` + originalPostId + ` WHERE id=`+postId+";";

        pool.query(sql, function(err, result) {
            if(err) throw err

            if(result) {
                callback(result);
            }else {
                callback(null);
            }
        });
    },
    getOwner : function(postId, callback)
    {
        // prepare the sql query
        let sql = `SELECT * FROM posts WHERE id=?;`;

        pool.query(sql, [postId], function(err, result) {
            if(err) throw err

            if(result.length) {
                callback(result[0]);
            }else {
                callback(null);
            }
        });
    },
    getCommentOwner : function(postId, originalPostId, callback)
    {
        // prepare the sql query
        let sql = `SELECT * FROM comments` + originalPostId + ` WHERE id=?;`;

        pool.query(sql, [postId], function(err, result) {
            if(err) throw err

            if(result.length) {
                callback(result[0]);
            }else {
                callback(null);
            }
        });
    },
}

module.exports = Post;