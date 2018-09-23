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
    // eslint-disable-next-line no-console
    console.log(checkData);
}

module.exports = workers;

const _data = require("./data");