"""
Proxy for the Addition service, performing validation
at the proxy..

Starts an HTTP proxy listening for addition requests.
Inbound default port is 8303, outbound is 8304.
"""
try:
    # Python 3
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from urllib.request import urlopen
    from urllib.request import Request
    from urllib.error import HTTPError
except ImportError:
    # Python 2
    from urllib2 import urlopen
    from urllib2 import Request
    from urllib2 import HTTPError
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
from argparse import ArgumentParser
from json import loads
from jsonschema import Draft4Validator
import sys

def main ():
    """ Program entry point. """
    AdditionProxy ()

class AdditionProxy:
    """ Start server for addition service. """
    def __init__ (self):
        """ Set port and start server """
        # process command line for port number
        self.inbound = 8303
        self.outbound = 8304
        self.processCommand ()

        # listen for messages on specified port
        host = ("localhost", self.inbound)
        server = ProxyHTTPServer (host, self.outbound, Handler)
        print ("Addition service proxy")
        print ("  Proxy for port " + str (self.outbound))
        print ("  Listening on port " + str (self.inbound))
        try:
            server.serve_forever ()
        except KeyboardInterrupt:
            server.shutdown ()
            server.server_close()

    def processCommand (self):
        """ Get ports from command line arguments. """
        parser = ArgumentParser ()
        parser.add_argument ("-i", "--inbound", type=int, dest="inbound",
          action="store", help="Inbound port")
        parser.add_argument ("-o", "--outbound", type=int, dest="outbound",
          action="store", help="Outbound port")
        args = parser.parse_args ()
        if args.inbound is not None:
            self.inbound = args.inbound
        if args.outbound is not None:
            self.outbound = args.outbound

class ProxyHTTPServer (HTTPServer, object):
    """
    HTTPServer subclass to hold outbound port
    """
    def __init__ (self, host, outbound, handler):
        super (ProxyHTTPServer, self).__init__ (host, handler)
        self.outbound = outbound

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
                print ("ready to validate")
                validator = Draft4Validator (Handler.requestSchema)
                validator.validate (dataIn)

                # make request on outbound port
                url = "http://localhost:" + str (self.server.outbound) + "/"
                headers = { "Content-type": "application/json" }
                try:
                    print ("Make request to " + url)
                    req = Request (url, data.encode ('utf8'), headers)
                    response = urlopen (req)
                    dataOut = response.read ().decode ("utf8")
                    print ("Dataout " + dataOut)
                    self.send_response (200)
                except HTTPError as e:
                    print ("HTTPError " + str (e))
                    dataOut = ''
                    self.send_response(e.code)
            except Exception as e:
                # if validation failed, return error
                print (e)
                dataOut = """{"error": "Invalid request"}"""
                self.send_response (400)

            self.send_header ("Content-type", "application/json")
            self.end_headers ()
            self.wfile.write (dataOut.encode ("utf8"))

if __name__ == "__main__":
    main ()
