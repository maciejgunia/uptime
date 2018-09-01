const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");

const server = http.createServer((req, res) => {
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
            payload : buffer
        };

        chosenHandler(data, (statusCode, payload) => {
            let payloadString = "";
            
            statusCode = typeof(statusCode) === "number" ? statusCode : 200;
            payload = typeof(payload) === "object" ? payload : {};
            
            payloadString = JSON.stringify(payload);
            
            res.writeHead(statusCode);
            res.end(payloadString);
        });        
    });
});

server.listen(3000, () => {
    
});

const handlers = {};

handlers.sample = (data, callback) => {
    callback(406, {name: "sample handler"});
};

handlers.notFound = (data, callback) => {
    callback(404);
};

const router = {
    "sample": handlers.sample
};
