const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    console.log(trimmedPath);
    res.end("hello\n");
});

server.listen(3000, () => {
    console.log("The server is listening on the port 3000");
});