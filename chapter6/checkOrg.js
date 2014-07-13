/**
 * Validate organization
 * 
 * Usage: node check orgFile employeeFile
 */
var validateOrg = require ("./validateOrg").validateOrg;

// if module invoked directly, call the module function
if (require.main === module) {
    main ();
}

/**
 * Parse command line and initiate validation.
 */
function main () {
    var orgFile = null;
    var empFile = null;
    // process positional command line arguments
    var args = process.argv.slice (2);
    args.forEach (function (arg) {
        if (arg[0] !== "-") {
            // assign positional arguments
            if (orgFile === null) {
                orgFile = arg;
            } else {
                empFile = arg;
            }
        }
    });

    // if both files not specified, command is invalid
    if ((orgFile === null) || (empFile === null)) {
        console.log ("Usage: node check orgFile employeeFile");
        console.log ("  orgFile       JSON file - organization");
        console.log ("  employeeFile  JSON file - employees");
        process.exit (1);
    }

    // call organization validation processor
    validateOrg (orgFile, empFile);
}

// module exports
exports.main = main;
