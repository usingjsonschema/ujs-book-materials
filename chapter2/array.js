/*
 * Read a JSON file with multiple array elements, and display a value
 * from each element.
 */
var fs = require ("fs");

// read the file synchronously and convert to a JSON object
var content = fs.readFileSync ("array.json");
var servers = JSON.parse (content);

// display the first server address
console.log ("server: " + servers[0].name + " " + servers[0].address);
// display the second server address
console.log ("server: " + servers[1].name + " " + servers[1].address);
