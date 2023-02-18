const express = require('express');
const session = require('express-session');
const User = require('./core/user');
const Mailer = require('./core/mailer');
const Post = require('./core/posts');
const Conversation = require('./core/conversation');
const path = require('path');
const http = require('http');
const app = express();
const httpServer = http.createServer(app);
const router = express.Router();
const socket = require('socket.io');

// socket initialization
// Setting up the server
var expressServer = app.listen(4000, () => {
    console.log('Server is running on port 4000...');
});

const io = socket(expressServer);

// create an object from the class User in the file core/user.js
const UserObj = new User();
const MailerObj = new Mailer();
const PostObj = new Post();
const ConversationObj = new Conversation();

// for body parser. to collect data that sent from the client.
app.use(express.urlencoded({ extended: false }));


// Serve static files. CSS, Images, JS files ... etc
app.use(express.static(path.join(__dirname, 'public/login')));
//app.use(express.static(path.join(__dirname, 'private/home')));
app.use(express.static(path.join(__dirname, 'public/index')));
//app.use(express.static(path.join(__dirname, 'private/profiles')));
//app.use(express.static(path.join(__dirname, 'private/messages')));
//app.use(express.static(path.join(__dirname, 'private/people')));
app.use(express.static(path.join(__dirname, 'private')));

// Template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// session
var sessionMain = session({
    secret: 'superSecret',
    resave: false,
    cookie: {
        maxAge: 60 * 60 * 24 * 365
    },
    saveUninitialized: true
});

app.use(sessionMain);

io.use(function (socket, next) {
    sessionMain(socket.request, socket.request.res, next);
});
//app.use(sessionMain);

//get profile page
app.get('/profiles', (req, res, next) => {
    console.log("profiles");
    res.sendFile(path.join(__dirname + '/private/profiles/profile.html'));
});

app.get('/people', (req, res, next) => {
    console.log("people");
    res.sendFile(path.join(__dirname + '/private/people/people.html'));
});


app.get("/messages", (req, res, next) => {
    console.log("Router entered messages")
    if (req.session.user) { //check if logged
        res.sendFile(path.join(__dirname + "/private/messages/messages.html"));
    }
    else {
        res.redirect('/');
    }
});

//get login page
app.get('/', (req, res, next) => {
    if (req.session.user) { //check if logged
        res.redirect('/home');
    }
    else {
        console.log('Login/Register page')
        res.sendFile(path.join(__dirname + '/public/login/login.html'));
    }
});

//get home page
app.get('/home', (req, res, next) => {
    console.log(req.session.user);
    if (req.session.user) { //check if logged
        console.log('Home page')
        res.sendFile(path.join(__dirname + '/private/home/home.html'));
    }
    else {
        res.redirect('/');
    }
});

//get loggout page
app.post('/loggout', (req, res, next) => {
    console.log('Log out')
    // Check if the session is exist
    if (req.session.user) {
        // destroy the session and redirect the user to the index page.
        req.session.destroy(function () {
            res.redirect('/');
        });
    }
});

// Errors => page not found 404
app.use((req, res, next) => {
    var err = new Error('Page not found');
    err.status = 404;
    next(err);
})

// Handling errors (send them to the client)
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message);
});

// Set up routers
app.use('/', router)



/*io.use(function (socket, next) {
    sessionMain(socket.request, socket.request.res, next);
});
/*httpServer.listen(3000, () =>{
    console.log('Server is listening on port 3000...');
});*/



//Socket

io.on('connection', function (socket) {
    var req = socket.request;
    console.log("new user!")

    function getComments(postId, _callback) {
        var userid = req.session.user

        PostObj.getComments(postId, function (posts) {
            console.log(posts);
            if (posts) {
                console.log('Everything okay!')

                const list = [];

                posts.forEach((item) => {
                    UserObj.find(item.userid, function (result) {
                        if (result) {
                            list.push({ id: item.id, content: item.content, username: result.username, timestamp: item.timestamp });
                        }
                    })
                })

                function waitForIt() {
                    if (list.length < posts.length) {
                        setTimeout(function () { waitForIt() }, 100);
                    } else {
                        list.sort((a, b) => b.id - a.id);
                        _callback(list)
                    };
                }
                waitForIt()
            }
            else {
                console.log('An error has occured!')
                io.emit("updateResult", "fail")
            }
        })
    }

    function updatePosts() {
        console.log("update received");

        var userid = req.session.user

        PostObj.get(null, function (posts) {
            if (posts) {
                console.log('Everything okay!')

                const list = [];

                posts.forEach((item) => {
                    UserObj.find(item.userid, function (result) {
                        if (result) {
                            console.log("before");
                            getComments(item.id, function (comments) {
                                console.log("comments");
                                console.log(comments);
                                list.push({ id: item.id, userid: item.userid, content: item.content, username: result.username, timestamp: item.timestamp, comments: comments, likes: item.likes });
                            })
                        }
                    })
                })

                function waitForIt() {
                    if (list.length < posts.length) {
                        setTimeout(function () { waitForIt() }, 100);
                    } else {
                        list.sort((a, b) => b.id - a.id);
                        io.emit("updateResult", list)
                    };
                }
                waitForIt()
            }
            else {
                console.log('An error has occured!')
                io.emit("updateResult", "fail")
            }
        })
    }

    socket.on("tryRegister", (username, password, email) => {
        console.log("register received");

        UserObj.find(username, function (result) {
            if (result) {
                console.log('The name is already used!')
                io.emit("registerResult", "name_used")
            }
            else {
                UserObj.create({ username: username, password: password, email: email }, function (user) {
                    console.log('created')
                    if (user) {
                        UserObj.find(user.insertId, function (result) {
                            console.log('Everything okay!')
                            io.emit("registerResult", user.insertId)
                        });

                    } else {
                        console.log('An error has occured!')
                        io.emit("registerResult", "fail")
                    }
                });
            }
        })
    });
    socket.on("tryLogin", (username, password) => {
        console.log("login received");

        UserObj.login(username, password, function (user, IsPasswordCorrect) {
            console.log(user);
            if (user) {
                console.log('Everything okay!')
                io.emit("loginResult", { userid: user.id, username: username })
                req.session.user = user.id;
                req.session.username = username;
                req.session.save();
                console.log('session ' + req.session.user)
            }
            else if (IsPasswordCorrect == false) {
                console.log('Wrong password!')
                io.emit("loginResult", "wrong_password")
            }
            else {
                console.log('An error has occured!')
                io.emit("loginResult", "fail")
            }
        })
    });
    socket.on("tryPost", (content) => {
        console.log("post received");

        var userid = req.session.user
        var timestamp = new Date().getTime();

        PostObj.create({ userid: userid, content: content, timestamp: timestamp }, function (post) {
            UserObj.log(userid, { type: "PostPosted", info: post.insertId, timestamp: timestamp }, function () {
                console.log(post);
                if (post) {
                    PostObj.createComments(post.insertId, function (post) {
                        if (post) {
                            console.log('Everything okay!')
                            updatePosts()
                            //io.emit("postResult", { username: req.session.username, content: content, timestamp: timestamp })
                        }
                        else {
                            console.log('An error has occured!')
                            io.emit("postResult", "fail")
                        }
                    })
                }
                else {
                    console.log('An error has occured!')
                    io.emit("postResult", "fail")
                }
            })
        })
    });
    socket.on("requestUpdate", () => {
        updatePosts()
    });
    socket.on("tryDelete", (postId) => {
        console.log("delete received");

        var userid = req.session.user

        PostObj.getOwner(postId, function (ownerID) {
            console.log("owner test: " + ownerID.userid)

            if (ownerID.userid == userid) {
                PostObj.delete(postId, function (result) {
                    UserObj.logFind(userid, "PostPosted", postId, function (result) {
                        if (result) {
                            UserObj.logDelete(userid, result.id, function () {
                            })
                        }
                    })
                    console.log('Everything okay!')
                    updatePosts()
                })
            }
        })
    });
    socket.on("tryComment", (postId, content) => {
        console.log("post comment");

        var userid = req.session.user
        var timestamp = new Date().getTime();

        PostObj.createComment(postId, { userid: userid, content: content, timestamp: timestamp }, function (post) {
            console.log(post);
            if (post) {
                console.log('Everything okay!')
                updatePosts()
                //io.emit("postResult", { username: req.session.username, content: content, timestamp: timestamp })
            }
            else {
                console.log('An error has occured!')
                io.emit("postResult", "fail")
            }
        })
    });
    socket.on("tryDeleteComment", (originalPostId, postId) => {
        console.log("delete comment received");

        var userid = req.session.user

        PostObj.deleteComment(postId, originalPostId, function (result) {
            console.log('Everything okay!')
        })
    });
    socket.on("tryLike", (postId) => {
        console.log("like received");

        var userid = req.session.user
        var timestamp = new Date().getTime();

        UserObj.logFind(userid, "PostLike", postId.toString(), function (result) {
            if (result) {
                UserObj.logDelete(userid, result.id, function () {
                    PostObj.updateLikes(postId, "-1", function (result) {
                        io.emit("postLikeResult", postId, -1)
                    })
                })
            } else {
                UserObj.log(userid, { type: "PostLike", info: postId.toString(), timestamp: timestamp }, function () {
                    PostObj.updateLikes(postId, "+1", function (result) {
                        io.emit("postLikeResult", postId, 1)
                    })
                })
            }
        })
    });

    socket.on("requestUpdateContacts", () => {
        var userid = req.session.user

        //TODO: Send over object, (in event: updateContacts) with schema: id-userID, username-userName
    });

    socket.on("requestUserInfo", (userId) => {
        console.log("user data request received");

        var currentId = req.session.user

        UserObj.find(parseInt(userId), function (user) {
            console.log(user)
            if (user) {
                UserObj.logFind(currentId, "Follow", userId.toString(), function (result) {
                    console.log(result)
                    if (result) {
                        io.emit("UserInfoResult", { isfollowing: true, username: user.username, bio: user.bio, followers: user.followers, following: user.following, friends: user.friends })
                    } else {
                        io.emit("UserInfoResult", { isfollowing: false, username: user.username, bio: user.bio, followers: user.followers, following: user.following, friends: user.friends })
                    }
                })
            } else {
                io.emit("UserInfoResult", "fail")
            }
        })
    });

    socket.on("tryUpdateBio", (bio) => {
        console.log("user data request received");

        var userid = req.session.user

        UserObj.updateBio(userid, bio, function (user) {
            console.log(user)
            if (user) {
                io.emit("updateBioResult", bio)
            } else {
                io.emit("updateBioResult", "fail")
            }
        })
    });

    socket.on("requestUpdateMessages", (channelId) => {
        var userid = req.session.user
        ConversationObj.getMembers(channelId, (result) => {
            // verify, if user can get the data
            console.log(result)
            if (!result) {
                socket.emit("updateMessages", "fail")
                console.log("updating messages failed, because the conversation is not in the database")

                return
            }

            var users = result.memberids.split(";")

            console.log(users)

            console.log(users.includes(String(userid)))

            if (!users.includes(String(userid))) {
                socket.emit("updateMessages", "fail")
                console.log("updating messages failed, because user: " + userid + " is not a member of the conversation")
                return
            }

            //package the data and send them
            console.log("packaging and sending data")
            ConversationObj.getMessages(channelId, (messages) => {
                socket.emit("updateMessages", messages)
                console.log("sended the packaged data")
                return
            })
        });
    });

    socket.on("requestSendMessages", (channelId, messageContent) => {
        var userid = req.session.user
        ConversationObj.addMessage(channelId, userid, false, messageContent, (result) => {

        });
    });

    socket.on("requestProfileUpdate", (userid) => {
        UserObj.getLog(userid, function (posts) {
            if (posts) {
                console.log('Everything okay!')

                const list = [];
                var number = 0

                posts.forEach((log) => {
                    if (log.type == "PostPosted") {
                        number += 1
                        PostObj.getOwner(log.info, function (item) {
                            if (item) {
                                console.log("before");
                                getComments(item.id, function (comments) {
                                    console.log("comments");
                                    console.log(comments);
                                    list.push({ id: item.id, userid: item.userid, content: item.content, timestamp: item.timestamp, comments: comments, likes: item.likes });
                                })
                            }
                        })
                    }
                })

                function waitForIt() {
                    if (list.length < number) {
                        setTimeout(function () { waitForIt() }, 100);
                    } else {
                        list.sort((a, b) => b.id - a.id);
                        io.emit("updateProfileResult", list)
                    };
                }
                waitForIt()
            }
            else {
                console.log('An error has occured!')
                io.emit("updateProfileResult", "fail")
            }
        })
    });

    socket.on("tryFollow", (userId) => {
        console.log("follow received");

        var currentid = req.session.user
        var timestamp = new Date().getTime();

        UserObj.logFind(currentid, "Follow", userId.toString(), function (result) {
            if (result) {
                console.log("------------------------------------------------1111111111111111111")
                UserObj.logDelete(currentid, result.id, function () {
                    UserObj.setFollowers(currentid, userId, "-1", function () {
                        io.emit("followResult", currentid, userId, -1)
                    })
                })
            } else {
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++1111111111111111111")
                UserObj.log(currentid, { type: "Follow", info: userId.toString(), timestamp: timestamp }, function () {
                    UserObj.setFollowers(currentid, userId, "+1", function () {
                        io.emit("followResult", currentid, userId, 1)
                    })
                })
            }
        })
    });
});

module.exports = app;