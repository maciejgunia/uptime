const _data = require("../data");
const helpers = require("../helpers");
const checks = {};

let _checkId;
let _checkData;
let _userData;

checks.post = (checkData, callback) => {
    const tokenId = getTokenId(checkData);
    _checkData = getValidatedPayload(checkData.payload);

    if (isPayloadValid(_checkData, true) && tokenId) {
        _getToken(tokenId)
            .then(_getUser)
            .then(_createCheck)
            .then(_addCheckToUser)
            .then(() => callback(200, _checkData))
            .catch(error => callback(500, error));

    } else {
        callback(400, {error: "required data not provided"});
    }
};

checks.get = (checkData, callback) => {
    const tokenId = getTokenId(checkData);
    _checkId = getCheckId(checkData.query);

    if(tokenId && _checkId) {
        _getToken(tokenId)
            .then(_getCheck)
            .then((checkData) => callback(200, checkData))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

function getTokenId (data) {
    return data.headers.token ? data.headers.token : "";
}

function getCheckId (query) {
    return query.checkId ? query.checkId : "";
}

function getValidatedPayload(payload) {
    return {
        protocol : payload.protocol === "http" || payload.protocol === "https" ? payload.protocol : "",
        url : payload.url,
        method : payload.method,
        successCodes : typeof payload.successCodes === "object" && payload.successCodes.length > 0
            ? payload.successCodes : [],
        timeoutSeconds : payload.timeoutSeconds
    };
}

function isPayloadValid(payload, full) {
    if (full) {
        if(
            payload.protocol &&
            payload.url &&
            payload.method &&
            payload.successCodes.length &&
            payload.timeoutSeconds
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        if(
            payload.protocol ||
            payload.url ||
            payload.method ||
            payload.successCodes.length ||
            payload.timeoutSeconds
        ) {
            return true;
        } else {
            return false;
        }
    }
}

function _getToken(tokenId) {
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
}

function _getUser(tokenData) {
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

function _getCheck(tokenData) {
    return new Promise((resolve, reject) => {
        _data.read("checks", _checkId, (err, checkData) => {
            if(!err && tokenData.phone === checkData.phone) {
                resolve(checkData);
            } else {
                reject({error: "check does not exist"});
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