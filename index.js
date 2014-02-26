//index.js
var connect = require("connect"),
    path = require("path");

connect.createServer(
    connect.static(path.join(__dirname, "html"))
).listen(3000);

console.log("listen: http://localhost:3000");

