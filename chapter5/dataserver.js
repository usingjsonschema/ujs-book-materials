/*
 * Data Server
 */
var http = require ("http");

// port number to listen on for requests
var port = 8302;

// process arguments for port number argument
var command = process.argv.slice (2);
command.forEach (function (arg) {
    if (arg[0] === "-") {
        var elements = arg.split ("=");
        var key = elements[0].toUpperCase ();
        if ((key === "-P") || (key === "--PORT")) {
            port = elements[1];
        }
    }
});

// start HTTP server listener
var server = http.createServer (function (request, response) {
    // processing logic goes here
    response.writeHead (200, { "Content-type":"text/html" });
    response.write ("Data content goes here.");
    response.end ();
});

// listen for messages on specified port
server.listen (port);
console.log ("Data server listening on port " + port);
