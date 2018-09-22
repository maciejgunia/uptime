const _data = require("../data");
const helpers = require("../helpers");
const users = require("../handlers/users");

const tokens = {};

// TODO: handle removing expired tokens

tokens.post = (data, callback) => {
    const phone = data.payload.phone;
    const password = data.payload.password;

    if (phone && password) {
        users.getUser(phone)
            .then(createToken)
            .then(tokenData => callback(201, tokenData))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

tokens.get = (data, callback) => {
    const tokenId = data.query.tokenId;

    if (tokenId) {
        tokens.getToken(tokenId)
            .then(() => callback(204))
            .catch(error => callback(400, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

tokens.put = (data, callback) => {
    const extend = data.payload.extend;
    const tokenId = data.payload.tokenId;

    if (tokenId && extend) {
        tokens.getToken(tokenId)
            .then(extendToken)
            .then(() => callback(204))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

tokens.delete = (data, callback) => {
    const tokenId = data.query.tokenId;
    if (tokenId) {
        tokens.getToken(tokenId)
            .then(deleteToken)
            .then(() => callback(204))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

tokens.validateToken = (phone, tokenData) => {    
    return new Promise((resolve, reject) => {
        if(tokenData.phone === phone) resolve(phone);
        else reject({error: "not a valid token for user"});
    });
};

tokens.getToken = tokenId => {
    return new Promise((resolve, reject) => {
        _data.read("tokens", tokenId, (err, tokenData) => {
            if(!err && tokenData.expires > Date.now()) {
                resolve(tokenData);
            } else if(!err && tokenData.expires <= Date.now()) {
                reject({error: "token has already expired"});
            } else {
                reject({error: "token does not exist"});
            }
        });
    });
};

function createToken(userData) {
    return new Promise((resolve, reject) => {
        const tokenData = {
            tokenId: helpers.createRandomString(20),
            phone: userData.phone,
            expires: Date.now() + 1000 * 60 * 60
        };
    
        _data.create("tokens", tokenData.tokenId, tokenData, err => {
            if (!err) resolve(tokenData);
            else reject({error: "could not log in"});
        });
    });
}

function extendToken(tokenData) {
    return new Promise((resolve, reject) => {
        const newToken = {
            tokenId: tokenData.tokenId,
            phone: tokenData.phone,
            expires: Date.now() + 1000 * 60 * 60
        };
    
        _data.update("tokens", tokenData.tokenId, newToken, err => {            
            if(!err) resolve();
            else reject({error: "could not extend token"});
        });
    });
}

function deleteToken(tokenData) {    
    return new Promise((resolve, reject) => {
        _data.delete("tokens", tokenData.tokenId, err => {
            if(!err) resolve();
            else reject({error: "could not delete token"});
        });
    });
}

module.exports = tokens;
