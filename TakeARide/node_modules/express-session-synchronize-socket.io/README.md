# [express-session-synchronize-socket.io](https://www.npmjs.com/package/express-session-synchronize-socket.io)

[![npm](https://img.shields.io/npm/l/express-session-synchronize-socket.io.svg?style=for-the-badge)](https://www.npmjs.com/package/express-session-synchronize-socket.io)
[![npm downloads](https://img.shields.io/npm/dm/express-session-synchronize-socket.io.svg?style=for-the-badge)](https://www.npmjs.com/package/express-session-synchronize-socket.io)
[![npm version](https://img.shields.io/npm/v/express-session-synchronize-socket.io.svg?style=for-the-badge)](https://www.npmjs.com/package/express-session-synchronize-socket.io)

[![Build Status](https://travis-ci.org/Orivoir/express-session-synchronize-socket.io.svg?branch=master)](https://travis-ci.org/Orivoir/express-session-synchronize-socket.io)
[![codecov](https://codecov.io/gh/Orivoir/express-session-synchronize-socket.io/branch/master/graph/badge.svg)](https://codecov.io/gh/Orivoir/express-session-synchronize-socket.io)

> express middleware session can be attach to `socket.io`
> have an **synchronizer** session and can dist session HTTP with **micro-service**

## Installation

### `npm i express-session-synchronize-socket.io --save`
### `yarn add express-session-synchronize-socket.io`

### usage:

#### server.js
```javascript
const
    exp = require('express')
    ,app = exp()
    ,server = require('http').Server( app )
    ,session = require('express-session-synchronize-socket.io')()
    , io = require('socket.io')( server )
;

app
    // ... you'r other middlewares
    .use( session.express( /* default value session optional */ ) )
    // ... you'r other middlewares
;

app.get('/' , (req,res) => {

    const val = req.session.val ; // session HTTP access

    if( !val.id ) {

        req.session.val.id = Math.random() ; // define one key id for current session

        // manual synchronize session with tcp store
        req.session.synchronize( {
            model: "http"
            ,target: "tcp"
        } ) ;
    }

    console.log('from HTTP: ' , val.id ) ;

    res.sendFile('./index.html') ;

} ) ;

io
    // ... you'r other middlewares
    .use( session.socketIO( /* default value session optional */ ) )
    // ... you'r other middlewares
;

io.on('connect' , socket => {

    const val = socket.session.val;

    // 0.xxx... , after request on "/" ,  because HTTP controller have synchronize memory strore
    console.log( 'from TCP: ' , val.id ) ;

} ) ;

server.listen( 80 , () => console.log('server run ...') ) ;
```

#### index.html
```html
<html>

    <head>
        <meta charset="utf-8">
        <title>index</title>
    </head>

    <body>

        <main>
            <h1>Lorem Ipsum</h1>
        </main>

        <!-- only if you use socket.io module -->
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io('/') ;
        </script>
    </body>
</html>
```

### middlewares optional config `arguments`
```javascript

    // ... ,
    session = require('express-session-synchronize-socket.io')(
        /* [pathGetSession:string] default */ "/get/session"
        /* return HTTP session in micro-service give null or false , if you want an manual control  */

        /* [autoSynchro:bool] default */ true
        /* synchronize HTTP session with TCP session between HTTP request you can manual use synchonize session */
    )
    // ... ,

```

## custom you access to `session values`

#### server.js
```javascript
const
    exp = require('express')
    ,app = exp()
    ,server = require('http').Server( app )
    ,session = require('express-session-synchronize-socket.io')()
    , io = require('socket.io')( server )
;

app
    // ... you'r other middlewares
    .use( session.express(
        {} /* default value session optional */
        "data" , // name key session access
    ) )
    // ... you'r other middlewares
;

app.get('/' , (req,res) => {

    const data = req.session.data ; // access with data key now

    if( !data.id ) {

        req.session.data.id = Math.random() ; // define one key id for current session

        // manual synchronize session with tcp store
        req.session.synchronize( {
            model: "http"
            ,target: "tcp"
        } ) ;
    }

    console.log('from HTTP: ' , data.id ) ;

    res.sendFile('./index.html') ;

} ) ;

io
    // ... you'r other middlewares
    .use( session.socketIO(
        {} /* default value session optional */
        , "data" // name key session access
    ) )
    // ... you'r other middlewares
;

io.on('connect' , socket => {

    const data = socket.session.data; // access with data now

    // 0.xxx... , after request on "/" ,  because HTTP controller have synchronize memory strore
    console.log( 'from TCP: ' , data.id ) ;

} ) ;

server.listen( 80 , () => console.log('server run ...') ) ;
```

## `GET` /get/session `JSON`

access to `HTTP` session from **default** route
use you `HTTP` session with an **micro-service**
and **easier** build **view render**
with **Reactjs** , **Angularjs** , **Emberjs** or *other* *framework/library* **Javascript**

## custom micro-service `HTTP` session

## config middleware
```javascript

    // ... ,
    session = require('express-session-synchronize-socket.io')(
        null, // give null for not default route access session
        true
    )
    // ... ,
```

## define your routes with **express** *e.g* :
```javascript
    // ... ,
    app
        .get('/get/session/avatar' , ( req , res ) => {
            // return only avatar session

            res.json( req.session.user.avatar || null ) ;
        } )
        .get('/get/session/username' , ( req , res ) => {

            res.json( req.session.user.username || null )
        } )
        .get( '/get/session/create-at' , ( req , res ) => {

            res.json( req.session.user.createAt ) ;
        } )
        .get('/get/session/all' , ( req , res ) => {

            // all is only user here

            res.json( req.session.user ) ;
        } )
    ;
```

## session HTTP is not save in cookies this package use local state of Nodejs for an memory store

you can thus easily imagine a structure using a notion of session server and client session the client session data being distributed in micro service for example where sent to your template in a more traditional way

#### develop by [Samuel Gaborieau](https://orivoir.github.io/profil-reactjs/) with <3 and **Nodejs** for **open source** and **enjoy**
