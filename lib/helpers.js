const crypto = require("crypto");
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

helpers.createTokenId = (length) => {
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

module.exports = helpers;