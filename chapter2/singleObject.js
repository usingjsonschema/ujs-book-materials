/*
 * Read a JSON file with a single unnamed object,
 * and display the values for each element.
 */
// include the Node.js file system module
var fs = require ("fs");

// read the content of the file synchronously
var data = fs.readFileSync ("singleObject.json");

// convert the text into a JSON object
var server = JSON.parse (data);

// display the server name
console.log ("name: " + server.name);
// display the address
console.log ("address: " + server.address);
// display the port number
console.log ("port: " + server.port);
// display the list of admin ports
for (var ctr = 0; ctr < server.admin.length; ctr ++) {
    console.log ("admin: " + server.admin[ctr]);
}
