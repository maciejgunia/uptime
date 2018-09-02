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

module.exports = helpers;