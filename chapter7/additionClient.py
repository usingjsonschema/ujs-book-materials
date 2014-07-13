"""
Client to the addition service using JSON and JSON Schema.

HTTP client to make requests. Default port is 8303.
"""
try:
    # Python 3
    from urllib.request import urlopen
    from urllib.request import Request
    from urllib.error import HTTPError
except ImportError:
    # Python 2
    from urllib2 import urlopen
    from urllib2 import Request
    from urllib2 import HTTPError
from argparse import ArgumentParser
from json import loads, dumps
from jsonschema import Draft4Validator
import sys

def main ():
    """ Program entry point. """
    AdditionClient ()

class AdditionClient:
    """ Start client for addition service. """
    def __init__ (self):
        """ Set port and start client """
        # process command line for port number
        self.port = 8303
        self.processCommand ()

        # Load JSON Schema to validate result against
        try:
            # read the file and convert to a JSON object
            responseSchema = open ("addResponse_schema.json", "rU").read ()
            errorSchema = open ("addError_schema.json", "rU").read ()
        except IOError as e:
            print ("Error loading schema: " + e.strerror)
            sys.exit (1)

        try:
            self.responseSchema = loads (responseSchema)
            self.errorSchema = loads (errorSchema)
        except ValueError as e:
            print ("Invalid JSON content in schema")
            sys.exit (1)

        self.makeRequests ()

    def processCommand (self):
        """ Get port from command line arguments. """
        parser = ArgumentParser ()
        parser.add_argument ("-p", "--port", type=int, dest="port",
          action="store", help="Port to make requests on")
        args = parser.parse_args ()
        if args.port is not None:
            self.port = args.port

    def makeRequests (self):
        """ Make requests with valid and invalid content. """
        # make a request with valid content
        data = dumps ({ "number1": 15, "number2": 24 })
        self.postRequest ("Add 2 numbers", data)

        # make a request with invalid content
        data = dumps ({ "number1": 15, "number2": True })
        self.postRequest ("Add number and boolean", data)

        # make a request that will get an invalid result
        data = dumps ({ "number1": 0, "number2": 0 })
        self.postRequest ("Add two zeros", data)

    def postRequest (self, name, content):
        """
        Post a request to the additionService.
        Args:
            name Request name to display with result
            content JSON object to pass to additionService
        """
        print ("Result for request: " + name)
        url = "http://localhost:" + str (self.port) + "/"
        dataIn = content.encode ("utf8")
        headers = { "Content-type": "application/json" }

        try:
            req = Request (url, dataIn, headers)
            response = urlopen (req)
            dataOut = response.read ().decode ("utf8")
            result = loads (dataOut)
            try:
                validator = Draft4Validator (self.responseSchema)
                validator.validate (result)

                print ("  Result = " + str (result["answer"]))
            except Exception as e:
                print ("  Invalid result received\n" + str (e))
        except HTTPError as e:
            data = e.read ().decode ("utf8")
            result = loads (data)
            try:
                validator = Draft4Validator (self.errorSchema)
                validator.validate (result)

                print ("  Server error: " + str (result["error"]))
            except:
                print ("Invalid error received")

if __name__ == "__main__":
    main ()
