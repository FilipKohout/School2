var socket = io('http://localhost:4000');

var id = 0
var uName = ""

function clearParameters() {
    //reset the params
    const params = new URLSearchParams(window.location.search);

    if (params.has("profile")) {
        params.delete("profile");
        window.location.search = params
    }
}

function updateBio() {
    var newBio = document.getElementById("create_content")
    var bioBox = document.getElementById("bio_container")

    socket.emit("tryUpdateBio", newBio.value)
    
    newBio.value = ""
    bioBox.style.display = "none"
}

function closeBioContainer() {
    var bioBox = document.getElementById("bio_container")
    bioBox.style.display = "none"
}

function updateBioContainer() {
    var bioBox = document.getElementById("bio_container")
    
    if (bioBox.style.display === "block") {
        bioBox.style.display = "none"
    } else {
        bioBox.style.display = "block"
    }
}

function updateEditButton() {
    var editButton = document.getElementById("edit_b")
    var bioBox = document.getElementById("bio_container")

    if (id == document.cookie.split(",")[1]) {
        editButton.style.display = "block"
    } else {
        editButton.style.display = "none"
    }
}

function follow() {
    console.log("-----------------------")
    socket.emit("tryFollow", id)
}

function createPost(id, content, userid, username, timestamp, comments, likes, _callback) {
    var errMessage = document.getElementById("loading_error");
    errMessage.style.display = "none";

    var date = new Date(timestamp * 1);
    var today = new Date();
    var dateString = ""

    if (today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
        dateString += " today"
    } else if (today.getFullYear() === date.getFullYear()) {
        dateString += date.getDate()
        dateString += "/" + (date.getMonth() + 1)
    } else {
        dateString += date.getDate()
        dateString += "/" + (date.getMonth() + 1)
        dateString += "/" + date.getFullYear()
    }
    dateString += " at " +
        " " + date.getHours() +
        ":" + date.getMinutes()

    var html = ""

    html += "<div class='post_container' id='post' postId='" + id + "'>"
    html += "<p class='post_content'>"
    html += content
    html += "</p>"
    html += "<div class='post_author_container'>"
    html += "<p class='post_author'>"
    html += dateString
    html += "</p>"
    html += "</div>"
    html += "<div class='post_like_div'>"
    html += "<button class='post_button' id='post_like' post_id='" + id + "' onclick='onLike(this)'></button>"
    html += "<p class='post_like_count' id='post_like_count' post_id='" + id + "'>" + likes + "</p>"
    html += "</div>"
    html += "<button class='post_button' id='post_comments' post_id='" + id + "' onclick='openComments(this)'></button>"
    if (document.cookie.split(",")[0] == username) {
        html += "<button class='post_button' id='post_delete' post_id='" + id + "' onclick='onDelete(this)'></button>"
    }
    html += "</div>"
    html += "<div class='post_comments_list' id='post' post_id='comments" + id + "' >"
    html += "<button class='form__button' id='form_open_button' style='width: 100%;' author_id='" + username + "' post_id='" + id + "' onclick='openCreatePost(this)'>Respond</button>"
    if (comments.length > 0) {
        var completed = 0

        comments.forEach((item) => {
            createComment(id, item.id, item.content, item.username, item.timestamp, function (comment) {
                html += comment
                completed += 1
            })
        })

        function waitForIt() {
            if (completed < comments.length) {
                setTimeout(function () { waitForIt() }, 100);
            } else {
                html += "</div>"
                _callback(html)
            };
        }
        waitForIt()
    } else {
        html += "<p class='post_info' >Nothing here yet!</p>"
        html += "</div>"
        _callback(html)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    var nameElement = document.getElementById("username")
    var bioBox = document.getElementById("bio_container")
    var followButton = document.getElementById("follow_button")
    var fiendButton = document.getElementById("friend_button")

    //reset the params
    const params = new URLSearchParams(window.location.search);
    id = params.get('profile')

    if (id == null) {
        nameElement.innerText = "Failed to load user name"
    } else {
        socket.emit("requestUserInfo", id)
        socket.emit("requestProfileUpdate", id);
    }

    if (id == document.cookie.split(",")[1]) {
        followButton.style.display = "none"
        fiendButton.style.display = "none"
    } else {
        followButton.style.display = "block"
        fiendButton.style.display = "block"
    }

    updateEditButton()
})

socket.on("UserInfoResult", (result) => {
    console.log(result)
    var nameElement = document.getElementById("username")
    var bioElement = document.getElementById("bio")
    var followers = document.getElementById("followers")
    var following = document.getElementById("following")
    var friends = document.getElementById("friends")
    var followButton = document.getElementById("follow_button")

    if (result === "fail") {
        nameElement.innerText = "Failed to load user name"
    } else {
        uName = result.username
        nameElement.innerText = result.username
        followers.innerText = result.followers + " Followers"
        following.innerText = result.following + " Following"
        friends.innerText = result.friends + " Friends"
        bioElement.innerHTML = "<button class='edit_b' id='edit_b' onclick='updateBioContainer()'></button>"+result.bio
        updateEditButton()

        if (result.isfollowing == true) {
            followButton.innerText = "Unfollow"
        } else {
            followButton.innerText = "Follow"
        }
    }
});

socket.on("updateBioResult", (result) => {
    console.log(result)
    var bio = document.getElementById("bio")

    if (result === "fail") {
        bio.innerText = "Failed to load user name"
    } else {
        bio.innerHTML = "<button class='edit_b' id='edit_b' onclick='updateBioContainer()'></button>"+result
        updateEditButton()
    }
});

socket.on("updateProfileResult", (result) => {
    console.log(result);

    const elements = document.querySelectorAll('.post_container');
    const elements2 = document.querySelectorAll('.post_comments_list');

    elements.forEach(div => {
        div.remove();
    });
    elements2.forEach(div => {
        div.remove();
    });

    if (result == "fail") {
        var errMessage = document.getElementById("loading_error");
        errMessage.style.display = "block";
    }
    else {
        result.forEach((item) => {
            console.log(item);
            createPost(item.id, item.content, item.userid, uName, item.timestamp, item.comments, item.likes, function (result) {
                var element = document.getElementById("posts")
                element.innerHTML += result
            })
        })
    }
});

socket.on("followResult", (followingId, followersId, change) => {
    var followers = document.getElementById("followers")
    var following = document.getElementById("following")
    var followButton = document.getElementById("follow_button")

    if (followingId === id) {
        following.innerText = parseInt(following.innerHTML) + change + " Following"
    } else if (followersId === id) {
        followers.innerText = parseInt(followers.innerHTML) + change + " Followers"
    }

    if (document.cookie.split(",")[1] == followingId && followersId == id && change == 1) {
        followButton.innerText = "Unfollow"
    } else {
        followButton.innerText = "Follow"
    }
});