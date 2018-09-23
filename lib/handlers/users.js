const users = {};

users.get = (data, callback) => {
    const phone = data.query.phone ? data.query.phone : "";
    const tokenId = data.headers.token ? data.headers.token : "";

    if (phone && tokenId) {
        tokens.getToken(tokenId)
            .then(tokens.validateToken.bind(this, phone))
            .then(users.getUser)
            .then(userData => callback(200, userData))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "required data not provided"});
    }
};

users.post = (data, callback) => {
    if (isCreatePayloadValid(data.payload)) {
        isNewUser(data.payload.phone)
            .then(() => createUser(data.payload))
            .then(() => callback(201))
            .catch(error => callback(500, error));        
    } else {
        callback(400, {error: "missing required user data"});
    }
};

users.put = (data, callback) => {
    const tokenId = data.headers.token ? data.headers.token : "";

    if (tokenId && isUpdatePayloadValid(data.payload)) {
        const phone = data.payload.phone;

        tokens.getToken(tokenId)
            .then(tokens.validateToken.bind(this, phone))
            .then(() => users.getUser(phone))
            .then(userData => updateUser(userData, data.payload))
            .then(() => callback(204))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "missing required user data"});
    }
};

users.delete = (data, callback) => {
    const phone = data.query.phone ? data.query.phone : "";
    const tokenId = data.headers.token ? data.headers.token : "";

    if (phone && tokenId) {
        tokens.getToken(tokenId)
            .then(tokens.validateToken.bind(this, phone))
            .then(() => deleteUser(phone))
            .then(() => callback(204))
            .catch(error => callback(500, error));
    } else {
        callback(400, {error: "no phone or token provided"});
    }
};

users.getUser = phone => {
    return new Promise((resolve, reject) => {
        _data.read("users", phone, (err, userData) => {
            if(!err && userData) {
                delete userData.password;
                resolve(userData);
            } else {
                reject({error: "no user found"});
            }
        });
    });
};

function isCreatePayloadValid(payload) {
    if (payload) {
        if (
            payload.name
            && payload.phone
            && payload.password
            && payload.agreement == true
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function isUpdatePayloadValid(payload) {
    if (payload) {
        if (
            payload.name
            && (payload.phone || payload.password)
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function isNewUser(phone) {
    return new Promise((resolve, reject) => {
        users.getUser(phone)
            .then(() => reject({error: "user already exists"}))
            .catch(() => resolve());
    });
}

function createUser(userData) {
    return new Promise((resolve, reject) => {
        const phone = userData.phone;
        const name = userData.name;
        const password = userData.password;
        const hashedPassword = helpers.hash(password);
    
        if (hashedPassword) {
            const userObject = {
                name: name,
                phone: phone,
                password: hashedPassword,
                agreement: true
            };

            _data.create("users", phone, userObject, err => {
                if(!err) resolve();
                else reject({error: "could not create a user"});
            });
        } else {
            reject({error: "could not hash a password"});
        }
    });
}

function updateUser(userData, updateData) {
    return new Promise((resolve, reject) => {
        if(updateData.name) {
            userData.name = updateData.name;
        }

        if(updateData.password) {
            userData.password = helpers.hash(updateData.password);
        }

        if(userData.password) {
            _data.update("users", userData.phone, userData, (err) => {
                if(!err) resolve();
                else reject({error: "couldn't update user data"});
            });
        } else {
            reject({error: "couldn't create a new password"});
        }
    });
}

function deleteUser(phone) {
    return new Promise((resolve, reject) => {
        // TODO: delete user checks and tokens
        _data.delete("users", phone, (err) => {
            if (!err) resolve();
            else reject({error: "couldn't delete user"});
        });
    });
}

module.exports = users;

const _data = require("../data");
const helpers = require("../helpers");
const tokens = require("./tokens");
