const helpers = {};

helpers.hash = (source) => {
    if(typeof(source === "string") && source) {
        return crypto.createHmac("sha256", config.hasingSecret)
            .update(source)
            .digest("hex");
    } else {
        return false;
    }
};

helpers.parseJSON = (source) => {
    try {
        return JSON.parse(source);
    } catch(err) {
        return {};
    }
};

helpers.createRandomString = (length) => {
    if (length > 0) {
        const possibleCharacters = "qazxswedcvfrtgbnhyujmkiolp1234567890";
        let str = "";

        for(let i = 0; i < length; i++ ) {
            str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        }

        return str;
    } else {
        return false;
    }
};

helpers.sendTwilioSms = (phone, msg, callback) => {
    if(phone && msg) {
        var payload = {
            "From" : config.twilio.fromPhone,
            "To" : "+48" + phone,
            "Body" : msg
        };
        var stringPayload = querystring.stringify(payload);
    
        var requestDetails = {
            "protocol" : "https:",
            "hostname" : "api.twilio.com",
            "method" : "POST",
            "path" : "/2010-04-01/Accounts/"+config.twilio.accountSid+"/Messages.json",
            "auth" : config.twilio.accountSid+":"+config.twilio.authToken,
            "headers" : {
                "Content-Type" : "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(stringPayload)
            }
        };
    
        var req = https.request(requestDetails, res => {
            var status =  res.statusCode;
            if(status == 200 || status == 201){
                callback(false);
                console.log(`message "${msg}" was sent to ${phone}`);
            } else {
                callback("Status code returned was "+status);
            }
        });
        
        req.on("error", e => {
            callback(e);
        });

        req.write(stringPayload);

        req.end();
    
    } else {
        callback("Given parameters were missing or invalid");
    }
};

module.exports = helpers;

const crypto = require("crypto");
const querystring = require("querystring");
const https = require("https");
const config = require("../config");
