const _data = require("../data");
const helpers = require("../helpers");
const checks = {};

let _checkData;
let _userData;

checks.post = (checkData, callback) => {
    const protocol = checkData.payload.protocol === "http" || checkData.payload.protocol === "https" ? checkData.payload.protocol : "";
    const url = checkData.payload.url;
    const method = checkData.payload.method;
    const successCodes = typeof checkData.payload.successCodes === "object" && checkData.payload.successCodes.length > 0
        ? checkData.payload.successCodes : [];
    const timeoutSeconds = checkData.payload.timeoutSeconds;
    const tokenId = checkData.headers.token ? checkData.headers.token : "";

    if (
        protocol &&
        url &&
        method &&
        successCodes.length &&
        timeoutSeconds &&
        tokenId
    ) {

        _checkData = checkData.payload;

        _findToken(tokenId)
            .then(_findUser)
            .then(_createCheck)
            .then(_addCheckToUser)
            .then(() => callback(200))
            .catch(error => callback(500, error));

    } else {
        callback(400, {error: "required data not provided"});
    }
};

function _findToken(tokenId) {
    return new Promise((resolve, reject) => {
        _data.read("tokens", tokenId, (err, tokenData) => {
            if(!err) {
                resolve(tokenData);
            } else {
                reject({error: "token does not exist"});
            }
        });
    });
}

function _findUser(tokenData) {
    return new Promise((resolve, reject) => {
        _data.read("users", tokenData.phone, (err, userData) => {
            if(!err) {
                _userData = userData;
                resolve();
            } else {
                reject({error: "user does not exist"});
            }
        });
    });
}

function _createCheck() {
    return new Promise((resolve, reject) => {
        _checkData.checkId = helpers.createRandomString(20);
        _checkData.phone = _userData.phone;
        _data.create("checks", _checkData.checkId, _checkData, (err) => {
            if(!err) {
                resolve();
            } else {
                reject({error: "check cannot be created"});
            }
        });
    });
}

function _addCheckToUser() {
    return new Promise((resolve, reject) => {
        if (_userData.checks instanceof Array && _userData.checks.length) {
            _userData.checks.push(_checkData.checkId);
        } else {
            _userData.checks = [_checkData.checkId];
        }
        
        _data.update("users", _userData.phone, _userData, (err) => {
            if(!err) {
                resolve();
            } else {
                reject({error: "couldn't add the check to user"});
            }
        });
    });
}

module.exports = checks;