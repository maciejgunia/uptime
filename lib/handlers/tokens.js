const _data = require("../data");
const helpers = require("../helpers");

const tokens = {};

let _callback;
let _phone;
let _password;

tokens.post = (data, callback) => {
    _callback = callback;
    _phone = data.payload.phone;
    _password = data.payload.password;

    _checkData();
};

function _checkData() {
    if (_phone && _password) {
        _findUser();
    } else {
        _callback(400, {error: "required data not provided"});
    }
}

function _findUser() {
    _data.read("users", _phone, (err, data) => {
        if(!err && data) {
            _hashPassword(data.password);
        } else {
            _callback(404, {error: "user not found"});
        }
    });
}

function _hashPassword(password) {
    if (helpers.hash(_password) === password) {
        _createToken();
    } else {
        _callback(400, {error: "password does not match"});
    }
}

function _createToken() {
    const token = {
        id: helpers.createTokenId(20),
        phone: _phone,
        expires: Date.now() + 1000 * 60 * 60
    };

    _data.create("tokens", token.id, token, err => {
        if (!err) {
            _callback(200, token);
        } else {
            _callback(500, {error: "could not log in"});
        }
    });
}

module.exports = tokens;
