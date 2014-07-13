/**
 * Validate JSON file against a JSON Schema
 * 
 * Usage: jsonvalidate [options] jsonFile schemaFile [referenceFile ...]
 * 
 * The result will be indicated with the process.exit (n) where, 
 *   0 indicates successful validation
 *   1 indicates validation failed
 */
var validate = require ("./validate").validate;
var fs = require ("fs");

// if module invoked directly, call the module function
if (require.main === module) {
    main ();
}

/**
 * Validate JSON per command line arguments.
 */
function main () {
    // process command line arguments
    var command = processCommand (process.argv.slice (2));

    if (command.jsdb !== null) {
        if (fs.exists (command.jsdb) === false) {
            console.log ("JSDB file specified does not exist");
            process.exit (1);
        }
    }

    // validate content with schema
    validate (command.json, command.schema, command.ref, command.jsdb,
        function (code, data, message) {
        // display message and exit with result code
        console.log (message);
        process.exit (code);
    });
}

/**
 * Process the command line.
 * @param {string[]} command Command line arguments.
 * @returns {object} Object {json, schema, ref, jsdb}.
 */
function processCommand (command) {
    var showHelp = false; // Flag: help requested?
    var validCommand = true; // Flag: Valid command?

    // result of command line argument processing
    var result = {
        "json" : null,
        "schema" : null,
        "ref" : [],
        "jsdb": null
    };

    // skip arg0 (program name) and arg1 (script name)
    command.forEach (function (arg) {
        // if argument is an option (leads with -)
        if (arg[0] === "-") {
            var elements = arg.split ("=");
            var key = elements[0].toUpperCase ();
            if ((key === "-J") || (key === "--JSDB")) {
                result.jsdb = elements[1];
            } else if ((key === "-H") || (key === "--HELP")) {
                showHelp = true;
            }
        } else {
            // assign positional arguments
            if (result.json === null) {
                result.json = arg;
            } else if (result.schema === null) {
                result.schema = arg;
            } else {
                // accept variable number of ref arguments
                result.ref.push (arg);
            }
        }
    });

    // if both files not specified, command is invalid
    if ((result.json === null) || (result.schema === null)) {
        validCommand = false;
    }

    // if any errors found or help requested, display usage message
    if ((showHelp === true) || (validCommand === false)) {
        console.log ("Usage: validate [options] json schema [refs ...]");
        console.log ("  json    JSON file to be validated");
        console.log ("  schema  JSON Schema file to validate against");
        console.log ("  refs    JSON Schema referenced element files");
        console.log ();
        console.log ("  options:");
        console.log ("    -j or --jsdb    JSDB file");
        console.log ("    -h or --help    Display this message");

        // exit with error code for invalid command or zero if help shown
        process.exit ((showHelp === true) ? 0 : 1);
    }

    return (result);
}

// exports
exports.main = main;

