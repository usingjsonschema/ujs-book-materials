/*
 * Inventory management simulation
 */
var safeFile = require ("ujs-safefile").safeFile;
var SafeFileError = require ("ujs-safefile").SafeFileError;
var cc = SafeFileError.prototype;
var jsonValidate = require ("ujs-jsonvalidate");
var validate = jsonValidate.validate;

// starting message
console.log ("Starting processing");

// inventory files
var dataFile = "inventory.json";
var schema = "inventory_schema.json";

// determine current state
var status = safeFile.safeGetState (dataFile);
if (status === cc.SAFE_INTERVENE) {
    console.log ("Inventory file requires administrator action");
    process.exit (1);
} else if (status === cc.DOES_NOT_EXIST) {
    console.log ("Inventory file missing");
    process.exit (1);
} else if (status === cc.SAFE_RECOVERABLE) {
    safeFile.safeRecover (dataFile);
    console.log ("Inventory file auto recovered");
}

// load and validate file content
var inventory = null;
validate (dataFile, schema, null, null, function (code, data, message) {
    // if invalid, print error message
    if (code !== jsonValidate.VALID) {
        console.log ("Inventory file validation failed");
        console.log ("Error: " + message);
        process.exit (1);
    } 

    // assign content
    inventory = data;
});

// program content goes here ...
// to show updates, increment item count by 1 for all items
for (var ctr = 0; ctr < inventory.length; ctr ++) {
    inventory[ctr].count = inventory[ctr].count + 1;
}

// apply formatting to content before writing when
// content is intended to be user readable/editable
var output = JSON.stringify (inventory, null, 2);

// write using recoverable interface
try {
    safeFile.safeWriteFileSync (dataFile, output);
} catch (e) {
    console.log ("Error writing content " + e.message);
}

console.log ("Completed processing");
