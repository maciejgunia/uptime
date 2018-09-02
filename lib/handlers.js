const tokens = require("./handlers/tokens");
const users = require("./handlers/users");
const handlers = {};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.notFound = (data, callback) => {
    callback(404);
};

// USERS

handlers.users = (data, callback) => {
    const acceptableMethods = ["get", "post", "put", "delete"];

    if (acceptableMethods.indexOf(data.method) !== -1) {
        users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// TOKENS

handlers.tokens = (data, callback) => {
    const acceptableMethods = ["get", "post", "put", "delete"];

    if (acceptableMethods.indexOf(data.method) !== -1) {
        tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

module.exports = handlers;
