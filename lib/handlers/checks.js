const _data = require("../data");
const helpers = require("../helpers");
const tokens = require("../handlers/tokens");
const checks = {};

let _checkId;
let _checkData;
let _userData;

checks.post = (checkData, callback) => {
    const tokenId = getTokenId(checkData);
    _checkData = getValidatedPayload(checkData.payload);

    if (isPayloadValid(_checkData, true) && tokenId) {
        tokens.getToken(tokenId)
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
        tokens.getToken(tokenId)
            .then(_getCheck)
            .then((checkData) => callback(200, checkData))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

checks.put = (checkData, callback) => {
    const tokenId = getTokenId(checkData);
    _checkData = getValidatedPayload(checkData.payload);
    _checkId = _checkData.checkId;    

    if(tokenId && _checkId) {
        tokens.getToken(tokenId)
            .then(_getUser)
            .then(_updateCheck)
            .then(() => callback(200))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

checks.delete = (checkData, callback) => {
    const tokenId = getTokenId(checkData);
    _checkId = getCheckId(checkData.query); 

    if(tokenId && _checkId) {
        tokens.getToken(tokenId)
            .then(_getUser)
            .then(_removeCheckFromUser)
            .then(_deleteCheck)
            .then(() => callback(200))
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
        checkId : payload.checkId || "",
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

function _updateCheck() {    
    return new Promise((resolve, reject) => {
        _checkData.phone = _userData.phone;
        _data.update("checks", _checkId, _checkData, (err) => {
            if(!err) {
                resolve(true);
            } else {
                reject({error: "could not update the check"});
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

function _deleteCheck() {
    return new Promise((resolve, reject) => {
        _data.delete("checks", _checkId, (err) => {
            if(!err) {
                resolve();
            } else {
                reject({error: "could not delete the check"});
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

function _removeCheckFromUser() {
    return new Promise((resolve, reject) => {
        if (_userData.checks instanceof Array && _userData.checks.indexOf(_checkId) > -1) {
            _userData.checks.splice(_userData.checks.indexOf(_checkId), 1);
            _data.update("users", _userData.phone, _userData, (err) => {
                if(!err) {
                    resolve();
                } else {
                    reject({error: "couldn't remove the check from user"});
                }
            });
        } else {
            reject({error: "couldn't remove the check from user"});
        }
        
    });
}

module.exports = checks;