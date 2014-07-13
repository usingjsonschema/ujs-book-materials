"""
JSON Schema validation preparation.
 - Load data and schema content
 - resolve local file references
 - resolve database references (jsdb)
"""
from safefile import readFile, SafeFileError
from jsonschema import Draft4Validator, RefResolver
import json

# message numbers and formats
VALID = 0
INVALID_JSON = 200
MISSING_ID = 201
FETCH_ERROR = 300
VALIDATION_ERROR = 301

MSG_READ_ERROR = "Error reading {0}: {1}"
MSG_INVALID_JSON = "Invalid JSON in file: {0}. Error: {1}"
MSG_MISSING_ID = "Missing Id in Reference Schema {0}"
MSG_FETCH_ERROR = "Error fetching {0}: {1}"
MSG_VALID_JSON = "JSON content in file {0} is valid"

class JsdbResolver (RefResolver):
    """
    Extends jsonschema resolver with the following:
    - addSchema to add statically defined schemas
    - support for jsdb: URI for database schemas
    """
    def __init__ (self, baseURI, referer, jsdb):
        """ Initialize jsdb and call superclass init """
        super (JsdbResolver, self).__init__ (baseURI, referer)

        # Store JSDB content in memory
        self.jsdb = jsdb

    def add_schema (self, uri, schema):
        """ Add a schema to the stored list of schemas """
        self.store[uri] = schema

    def resolve_jsdb (self, uri):
        """ Fetch a schema from the JSDB database. """
        result = None
        # if database available
        if self.jsdb is not None:
            # find schema matching id in database and add schema
            for schema in self.jsdb:
                if schema["id"] == uri:
                    result = schema
                    break
        return result

    def resolve_remote (self, uri):
        """
        Overrides superclass resolve_remote, processing "jsdb:" URI,
        otherwise calls superclass to fetch the schema.
        """
        if uri[0:5] == "jsdb:":
            document = self.resolve_jsdb (uri)

            # duplicate caching logic from superclass
            if self.cache_remote:
                self.store[uri] = document
            return document
        else:
            return RefResolver.resolve_remote (self, uri)

def validate (dataFile, schemaFile, refFiles, jsdbFile):
    """
    Perform validation of JSON content with the JSON Schema.

    Args:
      dataFile (str): File with JSON content to validate.
      schemaFilename (str): File containing JSON Schema.
      refFiles (list of str): List of files for schemas referenced.
      jsdbFile (str): File containing JSDB schemas referenced.
    Returns:
      code (int): VALID or error constant.
      data (str): data read for VALID result.
      message (str): message text.
    """
    # read data file, returning error if not valid
    code, data, message = _readJsonFile (dataFile)
    if code != VALID:
        return code, None, MSG_READ_ERROR.format (jsdbFile, message)

    # read schema file, returning error if not valid
    code, schema, message = _readJsonFile (schemaFile)
    if code != VALID:
        return code, None, MSG_READ_ERROR.format (jsdbFile, message)

    # load JSDB file, or set to empty if not specified
    if jsdbFile is None:
        jsdb = {}
    else:
        code, jsdb, message = _readJsonFile (jsdbFile)
        if code != VALID:
            return code, None, MSG_READ_ERROR.format (jsdbFile, message)

    # create custom resolver
    resolver = JsdbResolver ("", schema, jsdb)

    # read reference schema files, returning error if any not valid
    if refFiles is not None:
        for refFile in refFiles:
            code, ref, message = _readJsonFile (refFile)
            if code != VALID:
                return code, None, MSG_READ_ERROR.format (jsdbFile, message)
            if "id" not in ref:
                return MISSING_ID, None, MSG_MISSING_ID.format (refFile)
            resolver.add_schema (ref["id"], ref)

    # run validation, returning data if successful
    try:
        # create validator with custom resolver, call it
        validator = Draft4Validator (schema, resolver=resolver)
        validator.validate (data)
        return VALID, data, MSG_VALID_JSON.format (dataFile)
    except Exception as e:
        # if validation failed, return error information
        return VALIDATION_ERROR, None, e

def _readJsonFile (file):
    """
    Read file and verify it contains JSON content
    Args:
        file (str): File to read
    Returns:
      code (int): VALID or error constant.
      data (str): data read for VALID result.
      message (str): message text.
    """
    try:
        data = readFile (file)
        try:
            jsonData = json.loads (data)
            return VALID, jsonData, None
        except ValueError as e:
            return INVALID_JSON, None, MSG_INVALID_JSON.format (file, e)
    except SafeFileError as e:
        return e.code, None, e.message
