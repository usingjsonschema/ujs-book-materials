/**
 * Proxy for the Addition service, performing validation
 * at the proxy..
 *
 * Starts an HTTP proxy listening for addition requests.
 * Inbound default port is 8303, outbound is 8304.
 */
var fs = require ("fs");
var http = require ("http");
var tv4 = require ("tv4");

var inboundPort = 8303;
var outboundPort = 8304;
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
    server.listen (inboundPort);
    console.log ("Addition service proxy");
    console.log ("  Proxy for port " + outboundPort);
    console.log ("  Listening on port " + inboundPort);
}

/**
 * HTTP request handler
 * @param response HTTP response object
 * @param body HTTP body text
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
            proxy (response, body);
        });
    }
}

/**
 * Validate and proxy the request.
 * @param response HTTP response object
 * @param body HTTP body text
 */
function proxy (response, body) {
    console.log ("addition body = " + body);
    // display received content and parse to JSON object
    var input = JSON.parse (body);

    var result = null;
    var contentType = { "Content-type": "application/json" };
    
    // validate against schema
    var validator = tv4.freshApi ();
    if (validator.validate (input, requestSchema) === true) {
        // forward request to additionService
        forwardRequest (body, response);
    } else {
        result = { "error": "invalid request" };
        response.writeHead (400, contentType);
        response.write (JSON.stringify (result));
        response.end ();
    }
}

/**
 * Forward the request to the additionService.
 * @param content JSON object to pass to additionService
 * @param proxyResponse Proxy response object
 */
function forwardRequest (content, proxyResponse) {
    // create request definition
    var headers = {
        "Content-type": "application/json",
        "Content-length": content.length
    };
    var options = {
        "host": "localhost",
        "port": outboundPort,
        "path": "/",
        "method": "POST",
        "headers": headers
    };

    // create request, and accept response messages
    var request = http.request (options, function (response) {
        // verify the content type is for JSON content
        var contentType = response.headers["content-type"];
        if (contentType !== "application/json") {
            console.log ("Invalid content type: " + contentType);
        } else {
            // initialize response content with empty string
            var body = "";

            // when data is received, add it to response content
            response.on ("data", function onData (data) {
                body += data;
            });

            // when all data is received, process the content
            response.on ("end", function onEnd () {
                proxyResponse.writeHead (response.statusCode,
                    { "Content-type": "application/json" });
                proxyResponse.write (body);
                proxyResponse.end ();
            });
        }
    });

    // place the content in the body and send the request
    request.write (content);
    request.end ();
}

/**
 * Set ports from command line arguments.
 */
function processCommand () {
    var command = process.argv.slice (2);
    command.forEach (function (arg) {
        if (arg[0] === "-") {
            var elements = arg.split ("=");
            var key = elements[0].toUpperCase ();
            if ((key === "-I") || (key === "--INBOUND")) {
                inboundPort = elements[1];
            } else if ((key === "-I") || (key === "--OUTBOUND")) {
                outboundPort = elements[1];
            }
        }
    });
}
