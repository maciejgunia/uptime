const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");
const { StringDecoder } = require("string_decoder");

const config = require("../config");
const handlers = require("./handlers");
const helpers = require("./helpers");

const server = {};

const options = {
    key: fs.readFileSync(path.join(__dirname, "../https/key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "../https/cert.pem"))
};

const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

const httpsServer = https.createServer(options, (req, res) => {
    unifiedServer(req, res);
});

const unifiedServer = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, "");
    
    const query = parsedUrl.query;
    const method = req.method.toLowerCase();
    const headers = req.headers;

    const decoder = new StringDecoder("utf-8");
    let buffer = "";

    req.on("data", data => {
        buffer += decoder.write(data);
    });

    req.on("end", () => {
        const chosenHandler = typeof(router[trimmedPath]) !== "undefined" ? handlers[trimmedPath] : handlers.notFound;

        let data = {};
        
        buffer += decoder.end();

        data = {
            trimmedPath : trimmedPath,
            query: query,
            method: method,
            headers: headers,
            payload : helpers.parseJSON(buffer)
        };

        chosenHandler(data, (statusCode, payload) => {
            let payloadString = "";
            
            statusCode = typeof(statusCode) === "number" ? statusCode : 200;
            payload = typeof(payload) === "object" ? payload : {};
            
            payloadString = JSON.stringify(payload);

            res.setHeader("Content-Type", "application/json");
            
            res.writeHead(statusCode);
            res.end(payloadString);
        });        
    });
};

const router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
};

server.init = () => {
    httpServer.listen(config.httpPort, () => {
        // eslint-disable-next-line no-console
        console.log(`started a ${config.envName} server on a port ${config.httpPort}`);
    });

    httpsServer.listen(config.httpsPort, () => {
        // eslint-disable-next-line no-console
        console.log(`started a ${config.envName} server on a port ${config.httpsPort}`);
    });
};

module.exports = server;