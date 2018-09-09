const _data = require("../data");
const helpers = require("../helpers");
const tokens = require("./tokens");
const users = {};

users.get = (data, callback) => {
    const phone = data.query.phone ? data.query.phone : "";
    const token = data.headers.token ? data.headers.token : "";

    tokens.verifyToken(token, phone, (tokenFound) => {
        if (tokenFound === true) {
            _data.read("users", phone, (err, data) => {
                if(!err && data) {
                    delete data.password;
                    callback(200, data);
                } else {
                    callback(404, {error: "no user found"});
                }
            });
        } else {
            callback(403, {error: "no token found"});
        }
    });
};

users.post = (data, callback) => {
    if (data.payload) {
        const name = data.payload.name ? data.payload.name : "";
        const phone = data.payload.phone ? data.payload.phone : "";
        const password = data.payload.password ? data.payload.password : "";
        const agreement = data.payload.agreement ? true : false;

        if (name && phone && password && agreement) {
            _data.read("users", phone, (err) => {
                if(err) {
                    const hashedPassword = helpers.hash(password);

                    if (hashedPassword) {
                        const userObject = {
                            name: name,
                            phone: phone,
                            password: hashedPassword,
                            agreement: true
                        };
    
                        _data.create("users", phone, userObject, err => {
                            if(!err) {
                                callback(200);
                            } else {
                                callback(500, {error: "could not create a user"});
                            }
                        });
                    } else {
                        callback(500, {error: "could not create a user"});
                    }

                } else {
                    callback(400, {error: "user already exists"});
                }
            });
        } else {
            callback(400, {error: "missing required user data"});
        }
    } else {
        callback(400, {error: "missing required user data"});
    }
};

users.put = (data, callback) => {
    if (data.payload) {
        const name = data.payload.name ? data.payload.name : "";
        const phone = data.payload.phone ? data.payload.phone : "";
        const password = data.payload.password ? data.payload.password : "";
        const token = data.headers.token ? data.headers.token : "";

        if (phone && token && (name || password)) {
            tokens.verifyToken(token, phone, (tokenFound) => {
                if (tokenFound === true) {
                    _data.read("users", phone, (err, data) => {
                        if(!err && data) {
                            if(name) {
                                data.name = name;
                            }

                            if(password) {
                                data.password = helpers.hash(password);
                            }

                            if(data.password) {
                                _data.update("users", phone, data, (err) => {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        callback(500, {error: "couldn't update user data"});
                                    }
                                });
                            } else {
                                callback(500, {error: "couldn't create a new password"});
                            }

                        } else {
                            callback(400, {error: "couldn't find user"});
                        }
                    });
                } else {
                    callback(403, {error: "no token found"});
                }
            });
        } else {
            callback(400, {error: "missing required user data"});
        }
    } else {
        callback(400, {error: "missing required user data"});
    }
};

users.delete = (data, callback) => {
    const phone = data.query.phone ? data.query.phone : "";
    const token = data.headers.token ? data.headers.token : "";

    if (phone && token) {
        tokens.verifyToken(token, phone, (tokenFound) => {
            if (tokenFound === true) {
                _data.read("users", phone, err => {
                    if(!err) {
                        _data.delete("users", phone, (err) => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, {error: "couldn't delete user"});
                            }
                        });
                    } else {
                        callback(404, {error: "user not found"});
                    }
                });        
            } else {
                callback(403, {error: "no token found"});
            }
        });
    } else {
        callback(400, {error: "no phone or token provided"});
    }
};

module.exports = users;
