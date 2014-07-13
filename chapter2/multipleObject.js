/*
 * Read a JSON file with multiple object types, and
 * display a value from each object type.
 */
var fs = require ("fs");

// read the file synchronously, convert to a JSON object
var content = fs.readFileSync ("multipleObject.json");
var configuration = JSON.parse (content);

// display the port in the server definition
console.log ("port: " + configuration.server.port);
// display the url in the homepage definition
console.log ("url: " + configuration.homepage.url);
