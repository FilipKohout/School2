   //Created by Filip Kohout
   //This is only a small part of the code
   
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
