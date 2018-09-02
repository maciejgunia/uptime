const fs = require("fs");
const path = require("path");

const lib = {};

lib.baseDir = path.join(__dirname, "../.data/");

lib.create = (dir, file, data, callback) => {
    fs.open(`${lib.baseDir}${dir}/${file}.json`, "wx", (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.write(fileDescriptor, stringData, err => {
                if(!err) {
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback("Could not close the file");
                        }
                    });
                } else {
                    callback("Could not write to file");
                }
            });
        } else {
            callback("Could not create a new file");
        }
    });
};

lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, "utf8", (err, data) => {
        callback(err, data);
    });
};

lib.update = (dir, file, data, callback) => {
    fs.open(`${lib.baseDir}${dir}/${file}.json`, "r+", (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.truncate(fileDescriptor, err => {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, err => {
                        if(!err) {
                            fs.close(fileDescriptor, err => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback("could not close file");
                                }
                            });
                        } else {
                            callback("could not write the file");
                        }
                    });
                } else {
                    callback("could not truncate the file");
                }
            });
        } else {
            callback("could not open file");
        }
    });
};

lib.delete = (dir, file, callback) => {
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, err => {
        if(!err) {
            callback(false);
        } else {
            callback("error delting the file");
        }
    });
}

module.exports = lib;