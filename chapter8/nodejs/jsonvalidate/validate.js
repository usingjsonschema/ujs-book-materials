/**
 * JSON Schema validation preparation.
 * 
 * Load data and schema content
 * - resolve local file references
 * - resolve database references (jsdb)
 * - resolve remote HTTP references
 */
var http = require ("http");
var tv4 = require ("tv4");
var safeFile = require ("ujs-safefile").safeFile;
var format = require ("ujs-format").format;

// message numbers and formats
var VALID = 0;
var INVALID_JSON = 200;
var MISSING_ID = 201;
var FETCH_ERROR = 300;
var VALIDATION_ERROR = 301;

var MSG_READ_ERROR = "Error reading {0}: {1}";
var MSG_VALID_JSON = "JSON content in file {0} is valid";
var MSG_INVALID_JSON = "Invalid JSON in file: {0}. Error: {1}";
var MSG_MISSING_ID = "Missing Id in Reference Schema {0}";
var MSG_FETCH_ERROR = "Error fetching {0}: {1}";

// JSDB data
var jsdbData = null;

/**
 * Process inputs for validation, including fetching external schema
 * content. If all inputs are valid, call validation processor
 * (in runValidate).
 * @param {string} dataFile File with JSON content to validate.
 * @param {string} schemaFile File containing JSON Schema.
 * @param {string[]} refFiles Array of files for schemas referenced.
 * @param {string} jsdbFile File containing JSDB content.
 * @callback {callback} callback with object containing
 *     {integer} code: VALID or error constant.
 *     {string} data: data read for VALID result.
 *     {string} message: result text.
 */
function validate (dataFile, schemaFile, refFiles, jsdbFile, callback) {
    var data = null;
    var schema = null;
    var refs = [];
    var result = null;
    var message = null;

    // read data file
    result = readJsonFile (dataFile);
    if (result.code !== VALID) {
        message = format (MSG_READ_ERROR, dataFile, result.message);
        return callback (result.code, null, message);
    }
    data = result.data;

    // read schema file
    result = readJsonFile (schemaFile);
    if (result.code !== VALID) {
        message = format (MSG_READ_ERROR, schemaFile, result.message);
        return callback (result.code, null, message);
    }
    schema = result.data;

    // read set of reference files
    if (refFiles !== null) {
        for (var ctr1 = 0; ctr1 < refFiles.length; ctr1 ++) {
            var file = refFiles[ctr1];
            result = readJsonFile (file);
            if (result.code !== VALID) {
                message = format (MSG_READ_ERROR, file, result.message);
                return callback (result.code, null, message);
            }

            var ref = result.data;
            if (ref.id === undefined) {
                message = format (MSG_MISSING_ID, file);
                return callback (MISSING_ID, null, message);
            }
            refs.push ({ "uri":ref.id, "schema":ref, "error":null });
        }
    }

    // read JSDB file
    if (jsdbFile !== null) {
        result = readJsonFile (jsdbFile);
        if (result.code !== VALID) {
            message = format (MSG_READ_ERROR, jsdbFile, result.message);
            return callback (result.code, null, message);
        }
        jsdbData = result.data;
    }

    // reset validator and add loaded schemas
    var validator = tv4.freshApi ();
    validator.addSchema ("", schema);
    for (var ctr2 = 0; ctr2 < refs.length; ctr2 ++) {
        validator.addSchema (refs[ctr2].uri, refs[ctr2].schema);
    }

    // resolve refs from other locations (http, jsdb). Call validation
    // when schema content is complete.
    fetchSchemaContent (validator, refs, function (successful) {
        if (successful) {
            runValidate (dataFile, data, schema, refs, callback);
        } else {
            // return URIs in error
            var m3 = "";
            for (var ctr3 = 0; ctr3 < refs.length; ctr3 ++) {
                var ref = refs[ctr3];
                if (ref.error !== null) {
                    m3 += format (MSG_FETCH_ERROR, ref.uri, ref.error) + "\n";
                }
            }
            return callback (FETCH_ERROR, null, m3);
        }
    });
}

/**
 * Read file and verify it contains JSON content.
 * @param {string} file Path/name of file to read.
 * @returns {object} Result { code, data, message }
 */
function readJsonFile (file) {
    var data = null;
    var code = null;
    var message = null;

    try {
        var content = safeFile.readFileSync (file);
        try {
            data = JSON.parse (content);
            code = VALID;
        } catch (e1) {
            code = INVALID_JSON;
            message = format (MSG_INVALID_JSON, file, e1.message);
        }
    } catch (e2) {
        code = e2.code;
        message = e2.message;
    }

    return ({code:code, data:data, message:message});
}

/**
 * Fetch schema content for the current depth. Can be called recursively
 * to create the fully populated schema.
 * @param validator Validation processor instance
 * @param refs Array containing full set of referenced schemas.
 * @param callback Carries result of schema processing (true, false).
 */
function fetchSchemaContent (validator, refs, callback) {
    // if no missing URIs then end fetch
    var missingUris = validator.getMissingUris ();
    if ((missingUris === null) || (missingUris.length === 0)) {
        return callback (true);
    }

    // assemble list of missing URIs by resource type
    var jsdbList = [];
    var httpList = [];
    for (var ctr1 = 0; ctr1 < missingUris.length; ctr1 ++) {
        // get protocol from URI (portion up to the first colon)
        var uri = missingUris[ctr1];
        var protocol = uri.substring (0, uri.indexOf (":"));

        // assign to appropriate resource list
        if (protocol === "jsdb") {
            jsdbList.push (uri);
        } else if ((protocol === "http") || (protocol === "https")) {
            httpList.push (uri);
        }
    }

    // fetch schemas from JSDB resource, on any error end fetch
    var jsdbOkay = true;
    for (var ctr2 = 0; ctr2 < jsdbList.length; ctr2 ++) {
        var ref = jsdbFetch (jsdbList[ctr2]);
        refs.push (ref);
        if (ref.schema !== null) {
            validator.addSchema (ref.uri, ref.schema);
        } else {
            jsdbOkay = false;
        }
    }
    // if any errors, end processing
    if (jsdbOkay === false) {
        return callback (false);
    }

    // If no HTTP requests, continue with next depth processing
    if (httpList.length === 0) {
        fetchSchemaContent (validator, refs, function (result) {
            // propagate result back through caller chain
            return callback (result);
        });
    } else {
        // process HTTP fetches (async)
        var results = 0;
        var newRefs = [];
        var handler = function (uri, schema, error) {
            newRefs.push ({ "uri":uri, "schema":schema, "error":error });

            // when all HTTP requests complete, process all collected
            results ++;
            if (results === httpList.length) {
                // add all success/fail records to refs
                var httpOkay = true;
                for (var ctr3 = 0; ctr3 < newRefs.length; ctr3 ++) {
                    if (newRefs[ctr3].schema !== null) {
                        var newRef = newRefs[ctr3];
                        refs.push (newRef);
                        validator.addSchema (newRef.uri, newRef.schema);
                    } else {
                        httpOkay = false;
                    }
                }

                // if no errors, process next depth, else end
                if (httpOkay) {
                    fetchSchemaContent (validator, refs, function (result) {
                        // propagate result back through caller chain
                        return callback (result);
                    });
                } else {
                    return callback (false);
                }
            }
        };

        // initiate processing for the set of fetch requests (async)
        for (var ctr4 = 0; ctr4 < httpList.length; ctr4 ++) {
            httpFetch (httpList[ctr4], handler);
        }
    }
}

/**
 * Call the validation processor
 * @param {string} file Name of file being validated.
 * @param {object} data JSON to validate.
 * @param {object} schema JSON Schema to validate against.
 * @param {object[]) refs JSON referenced schemas.
 * @param {callback} callback with object containing
 *     {integer} code: VALID or error constant.
 *     {string} data: data read for VALID result.
 *     {string} message: result text.
 */
function runValidate (file, data, schema, refs, callback) {
    // start with fresh instance and add referenced schemas
    var validator = tv4.freshApi ();
    for (var ctr2 = 0; ctr2 < refs.length; ctr2 ++) {
        validator.addSchema (refs[ctr2].uri, refs[ctr2].schema);
    }

    // validate data against schema specified
    var result = validator.validate (data, schema);

    // if validation successful, return data and valid message
    if (result === true) {
        var m2 = format (MSG_VALID_JSON, file);
        callback (VALID, data, m2);
    } else {
        // if validation failed, display error information
        var message = "Invalid: " + validator.error.message;
        message += "\nJSON Schema element: " + validator.error.schemaPath;
        message += "\nJSON Content path: " + validator.error.dataPath;
        callback (VALIDATION_ERROR, null, message);
    }
}

/**
 * Fetch schema content from schema database (URI jsdb:).
 * @param {string} uri URI to resolve.
 * @returns {object} Schema object (uri, schema, error).
 */
function jsdbFetch (uri) {
    if (jsdbData !== null) {
        // if URI found in database, return schema for the URI
        for (var ctr = 0; ctr < jsdbData.length; ctr ++) {
            if (jsdbData[ctr].id === uri) {
                return ({ "uri":uri, "schema":jsdbData[ctr], "error":null });
            }
        }
    }

    // no match found, return error result
    var message = "No schema found for URI: " + uri;
    return ({ "uri":uri, "schema":null, "error":message });
}

/**
 * Fetch the content from a URI using HTTP
 * @param {string} uri URI of the content.
 * @param {callback} callback (uri, data, null) or (uri, null, error).
 */
function httpFetch (uri, callback) {
    // make request to server, with callback function to collect response
    var request = http.get (uri, function (response) {
        var data = "";
        // collect data received from server
        response.on ("data", function onData (d) {
            data += d;
        });
        // when all data received, send schema to callback
        response.on ("end", function onEnd () {
            callback (uri, data, null);
        });
    });

    // on error, send error to callback
    request.on ("error", function (e) {
        callback (uri, null, e);
    });
}

// exports
exports.VALID = VALID;
exports.INVALID_JSON = INVALID_JSON;
exports.MISSING_ID = MISSING_ID;
exports.FETCH_ERROR = FETCH_ERROR;
exports.VALIDATION_ERROR = VALIDATION_ERROR;
exports.validate = validate;
