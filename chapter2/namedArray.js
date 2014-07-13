/*
 * Read a JSON file with multiple named array elements,
 * and display a value from each element.
 */
var fs = require ("fs");

// read the file synchronously, convert to a JSON object
var content = fs.readFileSync ("namedArray.json");
var data = JSON.parse (content);

// display the first server address
console.log ("server");
console.log ("  name: " + data.servers[0].name);
console.log ("  address: " + data.servers[0].address);
// display the second server address
console.log ("\nserver");
console.log ("  name: " + data.servers[1].name);
console.log ("  address: " + data.servers[1].address);
