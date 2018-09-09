const _data = require("../data");
const helpers = require("../helpers");

const tokens = {};

let _callback;
let _phone;
let _password;
let _tokenId;
let _userPhone;
let _expires;

tokens.post = (data, callback) => {
    _callback = callback;
    _phone = data.payload.phone;
    _password = data.payload.password;

    if (_phone && _password) {
        _findUser();
    } else {
        _callback(400, {error: "required data not provided"});
    }
};

tokens.get = (data, callback) => {
    _callback = callback;
    _tokenId = data.query.tokenId;

    if (_tokenId) {
        _findToken(_callback);
    } else {
        _callback(400, {error: "required data not provided"});
    }
};

tokens.put = (data, callback) => {
    const extend = data.payload.extend;
    _tokenId = data.payload.tokenId;
    _callback = callback;

    if (_tokenId && extend) {
        _findToken(_extendToken);
    } else {
        _callback(400, {error: "required data not provided"});
    }
};

tokens.delete = (data, callback) => {
    _callback = callback;
    _tokenId = data.query.tokenId;

    if (_tokenId) {
        _findToken(_deleteToken);
    } else {
        _callback(400, {error: "required data not provided"});
    }
};

tokens.verifyToken = (tokenId, phone, callback) => {
    _tokenId = tokenId;
    _userPhone = phone;
    _callback = callback;

    if(_tokenId) {
        _findToken(_confirmVerify);
    } else {
        callback(false);
    }
};

function _confirmVerify(status) {
    if (
        status === 200
        && _phone === _userPhone
        && _expires > Date.now()
    ) {
        _callback(true);
    } else {
        _callback(false);
    }
}

function _findToken(callback) {
    _data.read("tokens", _tokenId, (err, data) => {
        if(!err && data) {
            _phone = data.phone;
            _expires = data.expires;
            callback(200);
        } else {
            callback(404, {error: "token not found"});
        }
    });
}

function _extendToken(status, data) {
    const isTokenStillActive = _expires > Date.now();
    if (status === 200 && isTokenStillActive) {
        _data.update("tokens", _tokenId, {
            id: _tokenId,
            phone: _phone,
            expires: Date.now() + 1000 * 60 * 60
        }, _confirmToken);
    } else if (status === 200 && !isTokenStillActive) {
        _callback(400, {error: "token inactive already, cannot extend"});
    } else {
        _callback(status, {error: data});
    }
}

function _deleteToken(status, errorObject) {
    if(status === 200) {
        _data.delete("tokens", _tokenId, _confirmDelete);
    } else {
        _callback(500, errorObject);
    }
}

function _confirmToken(err) {
    if (!err) {
        _callback(200);
    } else {
        _callback(500, {error: err});
    }
}

function _confirmDelete(err) {
    if (!err) {
        _callback(200);
    } else {
        _callback(500, {error: err});
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
        id: helpers.createRandomString(20),
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
