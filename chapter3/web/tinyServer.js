/*
 * Tiny HTTP Server
 */
var fs = require ("fs");
var http = require ("http");
var path = require ("path");
var url = require ("url");

// get port number from command line
var optionPort = process.argv[2] || 8081;
var port = parseInt (optionPort);
if ((port < 1) || (port > 65535)) {
    console.log ("Invalid port number");
    process.exit (1);
}

// create server with listener
http.createServer (function (request, response) {
    // some common content types
    var contentTypes = [
        { "fileType":"htm", "text":"text/html" },
        { "fileType":"html", "text":"text/html" },
        { "fileType":"css", "text":"text/css" },
        { "fileType":"json", "text":"application/json" },
        { "fileType":"js", "text":"application/javascript" },
        { "fileType":"gif", "text":"image/gif" },
        { "fileType":"png", "text":"image/png" },
        { "fileType":"jpeg", "text":"image/jpeg" },
        { "fileType":"jpg", "text":"image/jpeg" }
    ];
    
    // build path to file
    var uri = url.parse (request.url).pathname;
    if (path.normalize(decodeURI(uri)) !== decodeURI(uri)) {
        response.statusCode = 403;
        response.end();
        return;
    }
    if (uri === '/') {
        uri = "/index.html";
    }
    var filename = path.join (process.cwd (), uri);

    // if file does not exist, return 404
    if (fs.existsSync (filename) === false) {
        console.log ("Not found " + filename);
        response.writeHead (404, { "Content-Type": "text/plain" });
        response.write ("404 Not Found");
        response.end ();
    } else {
        try {
            data = fs.readFileSync (filename, "binary");

            var contentType = "text/plain";
            var index = filename.lastIndexOf ('.');
            if (index > -1) {
                var fileType = filename.substr (index + 1);
                for (var ctr = 0; ctr < contentTypes.length; ctr ++) {
                    if (fileType === contentTypes[ctr].fileType) {
                        contentType = contentTypes[ctr].text;
                        break;
                    }
                }
                console.log ("f: " + filename + ", c: " + contentType);
            }

            response.writeHead (200, { "Content-Type": contentType });
            response.write (data, "binary");
            response.end ();
        } catch (e) {
            console.log ("Error retrieving " + filename);
            response.writeHead (500, { "Content-Type": "text/plain" });
            response.write ("500 Server Error");
            response.end ();
        }
    }
}).listen (port);
console.log ("Tiny web server started on port " + port);