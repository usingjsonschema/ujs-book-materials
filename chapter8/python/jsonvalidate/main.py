"""
Validate JSON file against a JSON Schema

Usage: jsonvalidate [-options] jsonFile schemaFile [refFiles ...]
Options:
  -j    JSDB file containing ref schemas

The result will be indicated with the sys.exit (n) where,
  0 indicates successful validation
  1 indicates validation failed
"""
from argparse import ArgumentParser
from os.path import isfile
import sys
from jsonvalidate.validate import validate

def main ():
    """ Validate JSON per command line arguments. """
    # process command line arguments
    jsonFile, schemaFile, refFiles, jsdbFile = processCommand ()

    if jsdbFile is not None:
        if not isfile (jsdbFile):
            print ("JSDB file specified does not exist")
            sys.exit (1)

    # validate content with schema
    code, data, message = validate (jsonFile, schemaFile, refFiles, jsdbFile)
    # display message and exit with result code
    print (message)
    sys.exit (code)

def processCommand ():
    """ Process the command provided. """
    # call option processor
    parser = ArgumentParser (prog="validate")
    parser.add_argument ("jsonFile",
      help="JSON file to be validated")
    parser.add_argument ("schemaFile",
      help="JSON Schema file to jsonvalidate against")
    parser.add_argument ("-j", "--jsdb", dest="jsdbFile", action="store",
      help="JSDB file containing ref schemas")
    parser.add_argument ("refFiles", nargs="*",
      help="JSON Schema files with referenced elements")
    args = parser.parse_args ()

    # return command line parse results
    if "jsdbFile" not in args:
        args["jsdbFile"] = None
    return args.jsonFile, args.schemaFile, args.refFiles, args.jsdbFile

if __name__ == "__main__":
    main ()
