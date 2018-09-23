const crypto = require("crypto");
const querystring = require("querystring");
const https = require("https");
const config = require("../config");
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

helpers.sendTwilioSms = function(phone,msg,callback){
    // Validate parameters
    phone = typeof(phone) == "string" && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == "string" && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
    if(phone && msg){
  
        // Configure the request payload
        var payload = {
            "From" : config.twilio.fromPhone,
            "To" : "+48" + phone,
            "Body" : msg
        };
        var stringPayload = querystring.stringify(payload);
    
    
        // Configure the request details
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
    
        // Instantiate the request object
        var req = https.request(requestDetails,function(res){
            // Grab the status of the sent request
            var status =  res.statusCode;
            // Callback successfully if the request went through
            if(status == 200 || status == 201){
                callback(false);
            } else {
                callback("Status code returned was "+status);
            }
        });
    
        // Bind to the error event so it doesn"t get thrown
        req.on("error",function(e){
            callback(e);
        });
    
        // Add the payload
        req.write(stringPayload);
    
        // End the request
        req.end();
    
    } else {
        callback("Given parameters were missing or invalid");
    }
};

module.exports = helpers;