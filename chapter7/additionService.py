"""
Addition service using JSON and JSON Schema.

Starts an HTTP server listening for addition requests.
Server default port is 8303.
"""
try:
    # Python 3
    from http.server import BaseHTTPRequestHandler, HTTPServer
except ImportError:
    # Python 2
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
from argparse import ArgumentParser
from json import loads, dumps
from jsonschema import Draft4Validator
import sys

def main ():
    """ Program entry point. """
    AdditionService ()

class AdditionService:
    """ Start server for addition service. """
    def __init__ (self):
        """ Set port and start server """
        # process command line for port number
        self.port = 8303
        self.processCommand ()

        # listen for messages on specified port
        server = HTTPServer (("localhost", self.port), Handler)
        print ("Addition service listening on port " + str (self.port))
        try:
            server.serve_forever ()
        except KeyboardInterrupt:
            server.shutdown ()
            server.server_close()

    def processCommand (self):
        """ Get port from command line arguments. """
        parser = ArgumentParser ()
        parser.add_argument ("-p", "--port", type=int, dest="port",
          action="store", help="Port to make requests on")
        args = parser.parse_args ()
        if args.port is not None:
            self.port = args.port

class Handler (BaseHTTPRequestHandler):
    """ HTTP request handler """
    # class static, only load once
    requestSchema = None

    def loadRequestSchema (self):
        """ load request schema from file (once only) """
        # Load JSON Schema to validate input against
        try:
            # read the file and convert to a JSON object
            data = open ("addRequest_schema.json", "rU").read ()
        except IOError as e:
            print ("Error loading input schema: " + e.strerror)
            sys.exit (1)

        try:
            Handler.requestSchema = loads (data)
        except Exception as e:
            print ("Invalid JSON content in input schema")
            sys.exit (1)

    # web processing logic goes here
    def do_POST (self):
        """ process POST, generate response """
        print ("Request received")

        # if inputSchema not loaded, load once
        if Handler.requestSchema is None:
            Handler.loadRequestSchema (self)

        contentType = self.headers["content-type"]
        if contentType != "application/json":
            print ("Invalid content type: " + contentType)
        else:
            length = int (self.headers["Content-Length"])
            data = self.rfile.read (length).decode ("utf8")
            print ("addition body = " + data)
            dataIn = loads (data)

            #validate
            try:
                print ("start validate")
                validator = Draft4Validator (Handler.requestSchema)
                validator.validate (dataIn)
                print ("validated")

                answer = dataIn["number1"] + dataIn["number2"]
                print ("answer " + str (answer))
                result = dumps ({ "answer": answer })
                print ("result " + result)
                self.send_response (200)
            except Exception as e:
                # if validation failed, return error
                result = """{"error": "Invalid request"}"""
                self.send_response (400)

            self.send_header ("Content-type", "application/json")
            self.end_headers ()
            self.wfile.write (result.encode ("utf8"))

if __name__ == "__main__":
    main ()
