const workers = {};

workers.init = () => {
    startCheckInterval(1000 * 60);
    performAllChecks();
};

function startCheckInterval(interval) {
    setInterval(performAllChecks, interval);
}

async function performAllChecks() {
    let allChecks;

    workers.performedChecks = [];

    try {
        allChecks = await listChecks();
    }
    catch(error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }

    if(allChecks) {
        allChecks.forEach(checkId => {
            readCheck(checkId)
                .then(validateCheck)
                .then(performCheck)
                // eslint-disable-next-line no-console
                .catch(error => console.log(error));
        });
    }
}

function listChecks() {
    return new Promise((resolve, reject) => {
        _data.list("checks", (err, checks) => {
            if(!err && checks && checks.length) {
                resolve(checks);
            } else {
                reject({error: "could not find any checks"});
            }
        });
    });
}

function readCheck(checkId) {
    return new Promise((resolve, reject) => {
        _data.read("checks", checkId, (err, checkData) => {
            if(!err && checkData) {
                resolve(checkData);
            } else {
                reject({error: "could not read a check"});
            }
        });
    });
}

function validateCheck(checkData) {
    return new Promise((resolve, reject) => {
        if(
            typeof checkData === "object"
            && checkData.checkId
            && checkData.phone
            && checkData.protocol
            && checkData.url
            && checkData.method
            && checkData.successCodes.length
            && checkData.timeoutSeconds
        ) {
            resolve(checkData);
        } else {
            reject({error: "check data is invalid"});
        }
    });
}

function performCheck(checkData) {
    const requestModule = checkData.protocol === "http" ? http : https;
    
    const request = requestModule[checkData.method](
        `${checkData.protocol}://${checkData.url}`,
        res => handleSuccess(res, checkData)
    );

    request.setTimeout(checkData.timeoutSeconds * 1000, () => handleError(null, checkData));
    request.on("error", err => handleError(err, checkData));
}

function handleSuccess(res, checkData) {
    if(workers.performedChecks.indexOf(checkData.checkId) === -1) {
        workers.performedChecks.push(checkData.checkId);
        changeStatus(checkData, checkData.successCodes.indexOf(res.statusCode) !== -1);
    }
}

function handleError(err, checkData) {
    if(workers.performedChecks.indexOf(checkData.checkId) === -1) {
        workers.performedChecks.push(checkData.checkId);
        changeStatus(checkData, false);
    }
}

function changeStatus(checkData, isUp) {
    if(!isUp && checkData.state !== isUp) {
        helpers.sendTwilioSms(checkData.phone, `The url ${checkData.url} is down.`, handleSmsError);
    } else if(isUp && checkData.state === false) {
        helpers.sendTwilioSms(checkData.phone, `The url ${checkData.url} is up.`, handleSmsError);
    }

    checkData.state = isUp;
    checkData.lastCheck = Date.now();

    _data.update("checks", checkData.checkId, checkData, err => {
        if(err) console.log(err);
    });
}

function handleSmsError(err) {
    // console.log(err);
}

module.exports = workers;

const http = require("http");
const https = require("https");

const _data = require("./data");
const helpers = require("./helpers");
