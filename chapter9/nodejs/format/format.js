/**
 * Accept a base string with substitution markers and additional parameters
 * containing text to substitute into the base string. Markers use the syntax
 * {#} where # is a zero based index for the parameter ({0}, {1}, ...).
 * 
 * @example
 * // returns "Syntax error on line 101: Missing ')'"
 * format ("Syntax error on line {0}: Missing '{1}'", "101", ")");
 * 
 * @param {string} base Base string to substitute into
 * @param {...string} Substitution strings
 * @returns {string} Populated string
 */
function format (base)
{
    "use strict";
    // if base undefined or null, return empty string
    if ((base === undefined) || (base === null)) {
        return ("");
    }

    // for each argument after base, replace in base string
    var result = base;
    for (var ctr = 1; ctr < arguments.length; ctr ++) {
        result = result.replace ("{" + (ctr - 1) + "}", arguments[ctr]);
    }

    return (result);
}

// exports
exports.format = format;
