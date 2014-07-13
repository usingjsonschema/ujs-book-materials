/*
 * Read a JSON file with multiple object types and an array.
 * Display a value from the object type and each array.
 */
var fs = require ("fs");

// read the file synchronously and convert to a JSON object
var content = fs.readFileSync ("mixed.json");
var configuration = JSON.parse (content);

// display the port in the server definition
console.log ("port: " + configuration.server.port);
// display the url of the each cataloged page
for (var ctr = 0; ctr < configuration.pages.length; ctr ++) {
    console.log ("url: " + configuration.pages[ctr].url);
}
