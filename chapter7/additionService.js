/**
 * Addition service using JSON and JSON Schema.
 * 
 * Starts an HTTP server listening for addition requests.
 * Server default port is 8303.
 */
var fs = require ("fs");
var http = require ("http");
var tv4 = require ("tv4");

var port = 8303;
var requestSchema = null;

// if module invoked directly, call main
if (require.main === module) {
    main ();
}

/**
 * Program entry point.
 */
function main () {
    // process command line for port number
    processCommand ();

    // Load JSON Schema to validate result against
    try {
        var data = fs.readFileSync ("addRequest_schema.json");
        requestSchema = JSON.parse (data);
    } catch (e) {
        console.log ("Error loading request schema: " + e.message);
        process.exit (1);
    }

    // listen for messages on specified port
    var server = http.createServer (handler);
    server.listen (port);
    console.log ("Addition service listening on port " + port);
}

/**
 * HTTP request handler.
 * @param request HTTP request object.
 * @param response HTTP response object.
 */
function handler (request, response) {
    // when a message is received, display a message
    console.log ("Request received");

    // verify the content type is for JSON content
    var contentType = request.headers["content-type"];
    if (contentType !== "application/json") {
        console.log ("Invalid content type: " + contentType);
    } else {
        // initialize request content with empty string
        var body = "";

        // when data is received, add it to request content
        request.on ("data", function onData (data) {
            body += data;
        });

        // when all data is received, process the content
        request.on ("end", function onEnd () {
            addition (response, body);
        });
    }
}

/**
 * Process the addition request.
 * @param response HTTP response object
 * @param body HTTP body text
 */
function addition (response, body) {
    console.log ("addition body = " + body);
    // display received content and parse to JSON object
    var input = JSON.parse (body);

    var result = null;
    var contentType = { "Content-type": "application/json" };
    
    // validate against schema
    var validator = tv4.freshApi ();
    if (validator.validate (input, requestSchema) === true) {
        // calculate result and store in JSON response object
        result = { "answer": input.number1 + input.number2 };
        response.writeHead (200, contentType);
    } else {
        result = { "error": "invalid request"};
        response.writeHead (400, contentType);
    }

    response.write (JSON.stringify (result));
    response.end ();
}

/**
 * Set port from command line arguments.
 */
function processCommand () {
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
}
