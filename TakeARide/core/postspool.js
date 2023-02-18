const util = require('util');
const mysql = require('mysql2');
/**
 * Connection to the database.
 *  */
const pool = mysql.createPool({
    connectionLimit: 100,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
    host: '127.0.0.1',
    user: 'testuser', // use your mysql username.
    password: 'password', // user your mysql password.
    insecureAuth : true,
    database: 'posts'
});

pool.getConnection((err, connection) => {
    if(err) 
        console.error("An error with database has occurred "+err);
    
    if(connection)
        connection.release();
    return;
});

pool.query = util.promisify(pool.query);

module.exports = pool;