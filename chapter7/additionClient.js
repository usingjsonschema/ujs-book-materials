/**
 * Client to the addition service using JSON and JSON Schema.
 * 
 * HTTP client to make requests. Default port is 8303.
 */
var fs = require ("fs");
var http = require ("http");
var tv4 = require ("tv4");

var port = 8303;
var responseSchema = null;
var errorSchema = null;

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
        var data = fs.readFileSync ("addResponse_schema.json");
        responseSchema = JSON.parse (data);
        data = fs.readFileSync ("addError_schema.json");
        errorSchema = JSON.parse (data);
    } catch (e) {
        console.log ("Error loading result schemas: " + e.message);
        process.exit (1);
    }

    makeRequests ();
}

/**
 * Make requests with valid and invalid content.
 */
function makeRequests () {
    // make a request with valid content
    var input = { "number1": 15, "number2": 24 };
    var validRequest = JSON.stringify (input);
    postRequest ("Add 2 numbers", validRequest);

    // make a request with invalid content
    input = { "number1": 15, "number2": true };
    var invalidRequest = JSON.stringify (input);
    postRequest ("Add number and boolean", invalidRequest);

    // make a request that will get an invalid result
    input = { "number1": 0, "number2": 0 };
    var invalidResult = JSON.stringify (input);
    postRequest ("Add two zeros", invalidResult);
}

/**
 * Post a request to the additionService.
 * @param name Request name to display with result
 * @param content JSON object to pass to additionService
 */
function postRequest (name, content) {
    // create request definition
    var headers = {
        "Content-type": "application/json",
        "Content-length": content.length
    };
    var options = {
        "host": "localhost",
        "port": port,
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
                processResult (name, response, body);
            });
        }
    });

    // place the content in the body and send the request
    request.write (content);
    request.end ();
}

/**
 * Process the response message.
 * @param name Name of the request.
 * @param response HTTP response object.
 * @param data HTTP body text.
 */
function processResult (name, response, body) {
    console.log ("\nResult for request: " + name);
    var error = null;
    var v = tv4.freshApi ();

    // parse response content to JSON object
    var result = JSON.parse (body);

    // if response status was 200 (OK)
    if (response.statusCode === 200) {
        // validate against schema, if valid, display answer
        if (v.validate (result, responseSchema) === true) {
            console.log ("  Result = " + result.answer);
        } else {
            error = v.error;
        }
    } else if (response.statusCode === 400) {
        // if response status was an error 400 (BAD REQUEST)
        if (v.validate (result, errorSchema) === true) {
            console.log ("  Server error: " + result.error);
        } else {
            error = v.error;
        }
    }

    // if error, print error details
    if (error !== null) {
        // display validation error
        console.log ("  Data is not valid in the response");
        console.log ("  Message: " + error.message);
        console.log ("  Data path: " + error.dataPath);
        console.log ("  Schema path: " + error.schemaPath);
    }
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
