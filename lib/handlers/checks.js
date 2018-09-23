const checks = {};

checks.post = (data, callback) => {
    const tokenId = data.headers.token;

    if (isCreatePayloadValid(data.payload) && tokenId) {
        tokens.getToken(tokenId)
            .then(tokenData => users.getUser(tokenData.phone))
            .then(userData => createCheck(userData, data.payload))
            .then(addCheckToUser)
            .then(checkData => callback(200, checkData))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

checks.get = (data, callback) => {
    const tokenId = data.headers.token;
    const checkId = data.query.checkId;

    if(tokenId && checkId) {
        tokens.getToken(tokenId)
            .then(tokenData => getCheck(tokenData, checkId))
            .then((checkData) => callback(200, checkData))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

checks.put = (data, callback) => {
    const tokenId = data.headers.token;

    if(isUpdatePayloadValid(data.payload) && tokenId) {
        const checkId = data.payload.checkId;
        let _tokenData;

        tokens.getToken(tokenId)
            .then(tokenData => {
                _tokenData = tokenData;
                return getCheck(tokenData, checkId);
            })
            .then(checkData => updateCheck(checkData, data.payload, _tokenData))
            .then(() => callback(200))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

checks.delete = (data, callback) => {
    const tokenId = data.headers.token;
    const checkId = data.query.checkId;

    if(tokenId && checkId) {
        tokens.getToken(tokenId)
            .then(tokenData => users.getUser(tokenData.phone))
            .then(userData => removeCheckFromUser(userData, checkId))
            .then(deleteCheck)
            .then(() => callback(200))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

function isCreatePayloadValid(payload) {
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
}

function isUpdatePayloadValid(payload) {
    if(
        payload.checkId
        && payload.phone && (
            payload.protocol ||
            payload.url ||
            payload.method ||
            payload.successCodes.length ||
            payload.timeoutSeconds
        )
    ) {
        return true;
    } else {
        return false;
    }
}

function getCheck(tokenData, checkId) {
    return new Promise((resolve, reject) => {
        _data.read("checks", checkId, (err, checkData) => {
            if(!err && tokenData.phone === checkData.phone) {
                resolve(checkData);
            } else {
                reject({error: "check does not exist"});
            }
        });
    });
}

function updateCheck(currentCheckData, newCheckData, tokenData) {
    return new Promise((resolve, reject) => {
        if(currentCheckData.phone === tokenData.phone) {
            Object.keys(newCheckData).forEach(prop => {
                if(newCheckData[prop]) {
                    currentCheckData[prop] = newCheckData[prop];
                }
            });
            _data.update("checks", currentCheckData.checkId, currentCheckData, err => {
                if(!err) {
                    resolve(true);
                } else {
                    reject({error: "could not update the check"});
                }
            });
        }
    });
}

function createCheck(userData, checkData) {
    return new Promise((resolve, reject) => {
        checkData.checkId = helpers.createRandomString(20);
        checkData.phone = userData.phone;
        _data.create("checks", checkData.checkId, checkData, err => {
            if(!err) {
                resolve({userData, checkData});
            } else {
                reject({error: "check cannot be created"});
            }
        });
    });
}

function deleteCheck(checkId) {
    return new Promise((resolve, reject) => {
        _data.delete("checks", checkId, (err) => {
            if(!err) {
                resolve();
            } else {
                reject({error: "could not delete the check"});
            }
        });
    });
}

function addCheckToUser({userData, checkData}) {
    return new Promise((resolve, reject) => {
        if (userData.checks instanceof Array && userData.checks.length) {
            userData.checks.push(checkData.checkId);
        } else {
            userData.checks = [checkData.checkId];
        }
        
        _data.update("users", userData.phone, userData, err => {
            if(!err) {
                resolve(checkData);
            } else {
                reject({error: "couldn't add the check to user"});
            }
        });
    });
}

function removeCheckFromUser(userData, checkId) {
    return new Promise((resolve, reject) => {
        if (userData.checks instanceof Array && userData.checks.indexOf(checkId) > -1) {
            userData.checks.splice(userData.checks.indexOf(checkId), 1);
            _data.update("users", userData.phone, userData, err => {
                if(!err) {
                    resolve(checkId);
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

const _data = require("../data");
const helpers = require("../helpers");
const tokens = require("./tokens");
const users = require("./users");
