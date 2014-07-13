/**
 * Validate the organization data and employee data
 */
var jsonvalidate = require ("ujs-jsonvalidate");
var validate = jsonvalidate.validate;

/**
 * Validate organization structure and content.
 * @param {string} orgFile Organization JSON file name.
 * @param {string} empFile Employee JSON file name.
 */
function validateOrg (orgFile, empFile) {
    var orgSchema = "org_schema.json";
    var empSchema = "employee_schema.json";

    // validate organization data
    var units = null;
    validate (orgFile, orgSchema, null, null, function (code, data, msg) {
        if (code === jsonvalidate.VALID) {
            units = data.units;
        } else {
            console.log ("Error processing organization: " + msg);
            process.exit (code);
        }
    });

    // validate employee data
    var employees = null;
    validate (empFile, empSchema, null, null, function (code, data, msg) {
        if (code === jsonvalidate.VALID) {
            employees = data.employees;
        } else {
            console.log ("Error processing employees: " + msg);
            process.exit (code);
        }
    });

    // call custom validation functions
    verifyTopLevelUnit (units);
    verifyUniqueUnitIds (units);
    verifyUnitIds (units);
    verifyEmployeeUnits (employees, units);
}

/**
 * Verify org has one, and only one, top level unit.
 * @param {object[]} units Array of unit objects.
 */
function verifyTopLevelUnit (units) {
    var topLevelUnitsCount = 0;
    for (var ctr = 0; ctr < units.length; ctr ++) {
        if (units[ctr].unitOf === 0) {
            topLevelUnitsCount ++;
        }
    }
    // display results
    if (topLevelUnitsCount === 0) {
        console.log ("Error: Missing top level unit");
    } else if (topLevelUnitsCount === 1) {
        console.log ("Valid: Organization top level unit valid");
    } else {
        console.log ("Error: Multiple top level units defined");
    }
}

/**
 * Verify unitId is unique across all units. 
 * @param {object[]} units Array of unit objects.
 */
function verifyUniqueUnitIds (units) {
    for (var ctr1 = 0; ctr1 < units.length; ctr1 ++) {
        var currentUnitId = units[ctr1].unitId;
        for (var ctr2 = ctr1 + 1; ctr2 < units.length; ctr2 ++) {
            if (currentUnitId === units[ctr2].unitId) {
                console.log ("Error: Duplicate unitId " + currentUnitId);
                break;
            }
        }
    }
}

/**
 * Verify org has valid unitId for all unitOf references. 
 * @param {object[]} units Array of unit objects.
 */
function verifyUnitIds (units) {
    var orgValid = true;
    for (var ctr1 = 0; ctr1 < units.length; ctr1 ++) {
        var unitOf = units[ctr1].unitOf;
        if (unitOf !== 0) {
            var validUnitOf = false;
            for (var ctr2 = 0; ctr2 < units.length; ctr2 ++) {
                if (unitOf === units[ctr2].unitId) {
                    validUnitOf = true;
                    break;
                }
            }
            if (validUnitOf === false) {
                console.log ("Error: Invalid unitOf " + unitOf);
                orgValid = false;
            }
        }
    }
    if (orgValid === true) {
        console.log ("Valid: Organization hierarchy is valid");
    }
}

/**
 * Verify all employee unit references are valid org units.
 * @param {object[]} employees Array of employee objects.
 * @param {object[]} units Array of unit objects.
 */
function verifyEmployeeUnits (employees, units) {
    var allValid = true;
    for (var ctr1 = 0; ctr1 < employees.length; ctr1 ++) {
        var validUnit = false;
        var empUnit = employees[ctr1].unit;
        for (var ctr2 = 0; ctr2 < units.length; ctr2 ++) {
            if (empUnit === units[ctr2].unitId) {
                validUnit = true;
                break;
            }
        }
        if (validUnit === false) {
            console.log ("Error: Invalid employee unit " + empUnit);
            allValid = false;
        }
    }
    if (allValid === true) {
        console.log ("Valid: All employee unit references valid");
    }
}

// exports
exports.validateOrg = validateOrg;
