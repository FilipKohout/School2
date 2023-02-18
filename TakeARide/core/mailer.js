const nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "LoginFantom45@gmail.com",
        pass: "LoginTest"
    }
});

function Mailer() {};

Mailer.prototype = {
    SendEmail : function(toD, subjectD, textD)
    {
        var mailOptions = {
            from: "LoginFantom45@gmail.com",
            to: toD,
            subject: subjectD,
            text: textD
        };
    
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
        });
    }    
}

module.exports = Mailer;