var socket = io('http://localhost:4000');

function setFormMessage(formElement, type, message) {
    const messageElement = formElement.querySelector(".form message")

    messageElement.textContent = message
    messageElement.classList.remove("form__message--success", "form message-error")
    messageElement.classList.add("form__message--$ {type}")
};

function setInputError(inputElement, message) {
    inputElement.classList.add("form__input--error")
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = message
};

function clearInputError(inputElement) {
    inputElement.classList.remove("form__input--error")
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = ""
}

function Onlogin(event) {
    event.preventDefault();
    const loginForm = document.querySelector("#login")
    console.log("idk")
    var username = document.getElementById("InputUsername").value;
    var password = document.getElementById("InputPassword").value;

    socket.emit("tryLogin", username, password);
}

function Onregister(event) {
    event.preventDefault();

    var usernameData = document.getElementById("signupUsername").value;
    var passwordData = document.getElementById("signupPassword").value;
    var passwordData2 = document.getElementById("signupPassword2").value;
    var emailData = document.getElementById("signupE-Mail").value;

    var isOkay = true

    if (passwordData != passwordData2 || usernameData.length < 5 || emailData.length < 5 || passwordData.length < 5){
        isOkay = false
    }

    if (isOkay == true) {
        console.log("idkRegister")
 
        socket.emit("tryRegister", usernameData, passwordData, emailData);
    }
    else {
        console.log("Cannot be registered")
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector("#login")
    const createAccountForm = document.querySelector("#createAccount")

    document.querySelector("#linkCreateAccount").addEventListener("click", e => {
        e.preventDefault()
        loginForm.classList.add("form--hidden")
        createAccountForm.classList.remove("form--hidden")
    });

    document.querySelector("#linkLogin").addEventListener("click", e => {
        e.preventDefault()
        loginForm.classList.remove("form--hidden")
        createAccountForm.classList.add("form--hidden")
    });

    var form = document.getElementById("login");
    form.addEventListener('submit', Onlogin);

    var form2 = document.getElementById("createAccount");
    form2.addEventListener('submit', Onregister);

    document.querySelectorAll(".form__input").forEach(inputElement => {
        inputElement.addEventListener("blur", e => {
            if (e.target.id === "signupUsername" && e.target.value.length < 5) {
                console.log("idk")
                setInputError(inputElement, "Username must be at least 5 characters")
            }
            else if (e.target.id === "signupE-Mail" && e.target.value.length < 5) {
                console.log("idk")
                setInputError(inputElement, "E-mail must be at least 5 characters")
            }
            else if (e.target.id === "signupPassword" && e.target.value.length < 5) {
                console.log("idk")
                setInputError(inputElement, "Password must be at least 5 characters")
            }
            else if (e.target.id === "signupPassword2" && e.target.value != document.getElementById("signupPassword").value) {
                console.log("idk")
                setInputError(inputElement, "Passwords do not match")
            }
        })

        inputElement.addEventListener("input", e => {
            clearInputError(inputElement)
        })
    });
});

//Socket

socket.on("registerResult", (result) =>{
    console.log(result);

    if(result == "fail") {
        var butt = document.getElementById("registerbutton");
        setInputError(butt, "Registration has failed")
    } 
    else if (result == "name_used") {
        var butt = document.getElementById("registerbutton");
        setInputError(butt, "The name is already used")
    }
    else {
        // registration successfull
        const loginForm = document.querySelector("#login")
        const createAccountForm = document.querySelector("#createAccount")
        
        loginForm.classList.remove("form--hidden")
        createAccountForm.classList.add("form--hidden")
    }
});

socket.on("loginResult", (result) =>{
    console.log(result);

    if(result == "fail") {       
        var butt = document.getElementById("loginbutton");
        setInputError(butt, "Login has failed")
    } 
    else if (result == "wrong_password") {
        var butt = document.getElementById("loginbutton");
        setInputError(butt, "Wrong password")
    }
    else {
        window.location.replace("/home");
        document.cookie = result.username + "," + result.userid
        console.log(document.cookie)
    }
});