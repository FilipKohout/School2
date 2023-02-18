var socket = io('http://localhost:4000');

//const posts = require('../posts.js')

//const postsObj = new posts();

function onCreate(button) {
    var content = document.getElementById("create_content").value;
    var div = document.getElementsByClassName("post_create")[0];

    clearInputError(button)

    console.log(div.getAttribute("post_id"));
    if (div.getAttribute("post_id") === "0") {
        console.log("post")
        socket.emit("tryPost", content);
    } else {
        console.log("comment")
        socket.emit("tryComment", div.getAttribute("post_id"), content);
    }

    openCreatePost()

    document.getElementById("create_content").value = ""
}

function onDelete(element) {
    var postId = element.getAttribute("post_id");
    var comments = document.querySelector("[post_id=comments" + element.getAttribute("post_id") + "]");
    socket.emit("tryDelete", postId);
    element.parentElement.remove();
    comments.remove();
}

function onDeleteComment(element) {
    var postId = element.getAttribute("post_id");
    var originalPostId = element.getAttribute("original_post_id");
    socket.emit("tryDeleteComment", originalPostId, postId);
    element.parentElement.remove();
}

function openComments(element) {
    var comments = document.querySelector("[post_id=comments" + element.getAttribute("post_id") + "]");
    if (comments.style.display === "block") {
        comments.style.display = "none";
    } else {
        comments.style.display = "block";
    }
}

function onOpenProfile(element) {
    document.location.href = '/profiles?profile='+element.getAttribute('user_id')
}

function onLike(element) {
    var postId = element.getAttribute("post_id");
    socket.emit("tryLike", postId);
}

function openCreatePost(element) {
    var div = document.getElementsByClassName("post_create")[0];
    if (div.style.display === "block") {
        div.style.display = "none";
    } else {
        div.style.display = "block";
    }

    if (element !== undefined && element.getAttribute("author_id") !== null) {
        var text = document.getElementById("responding");
        text.style.display = "block"
        text.innerHTML = "Respoding to: " + element.getAttribute("author_id")
        div.setAttribute("post_id", element.getAttribute("post_id"));
    } else {
        var text = document.getElementById("responding");
        text.style.display = "none"
        div.setAttribute("post_id", "0");
    }
}

function setInputError(inputElement, message) {
    inputElement.classList.add("form__input--error")
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = message
};

function clearInputError(inputElement) {
    inputElement.classList.remove("form__input--error")
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = ""
}

function createComment(postId, id, content, username, timestamp, _callback) {
    var date = new Date(timestamp * 1);
    var today = new Date();
    var dateString = ""
    var html = ""

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

    html += "<div class='post_container' id='comment' >"
    html += "<p class='comment_content'>"
    html += content
    html += "</p>"
    html += "<div class='post_author_container'>"
    html += "<p class='post_author'>"
    html += "<button class='post_author_button'>"
    html += username
    html += "</button>"
    html += dateString
    html += "</p>"
    html += "</div>"
    html += "<button class='post_button' id='post_like'></button>"
    if (document.cookie.split(",")[0] == username) {
        html += "<button class='post_button' id='post_delete' original_post_id='" + postId + "' post_id='" + id + "' onclick='onDeleteComment(this)'></button>"
    }
    html += "</div>"

    _callback(html)
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
    html += "<button class='post_author_button' id='post_author_button' user_id='" + userid + "'>"
    html += username
    html += "</button>"
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
    /*var form = document.getElementById("postbutton");
    form.addEventListener('click', onCreate);
    Clicking handled by the html script
    */

    document.querySelectorAll(".form__input").forEach(inputElement => {
        inputElement.addEventListener("blur", e => {
            clearInputError(inputElement)
        })
    });
})

socket.on("updateResult", (result) => {
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
            createPost(item.id, item.content, item.userid, item.username, item.timestamp, item.comments, item.likes, function (result) {
                var element = document.getElementById("posts")
                element.innerHTML += result
            })
        })

        document.querySelectorAll(".post_author_button").forEach(inputElement => {
            inputElement.addEventListener("click", function (e) {
                e.preventDefault();
                onOpenProfile(inputElement)
            })
        });
    }
});

socket.on("postResult", (result) => {
    console.log(result);

    if (result == "fail") {
        var butt = document.getElementById("postbutton");
        setInputError(butt, "An error has occurred!")
    }
    else {
        //Not used anymore
        socket.emit("requestUpdate");
        /* createPost(result.id, result.content, result.username, result.timestamp, function(result) {
            var element = document.getElementById("posts")
            element.insertAdjacentHTML('afterBegin', result)
        })*/
    }
});

socket.on("postLikeResult", (postId, likes) => {
    var post = document.querySelector("[postId='" + postId + "']");
    console.log(post)
    var div = post.querySelector('.post_like_div');
    console.log(div)
    var count = div.querySelector('.post_like_count');

    console.log(count.innerHTML, likes)
    count.innerHTML = parseInt(count.innerHTML) + likes
});


socket.emit("requestUpdate");