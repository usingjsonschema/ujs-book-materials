"""
Web Server
"""
try:
    # Python 3
    from http.server import BaseHTTPRequestHandler, HTTPServer
except ImportError:
    # Python 2
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import sys

def main ():
    # port number to listen on for requests
    port = 8301

    # process arguments for port number argument
    for arg in sys.argv[1:]:
        index = arg.find ("=")
        if index > -1:
            key = arg[0:index].upper ()
            value = arg[index + 1:len (arg)]
            if (key == "-P") or (key == "--PORT"):
                port = int (value)

    # listen for messages on specified port
    server = HTTPServer (("localhost", port), Handler)
    print ("Web server listening on port " + str (port))
    try:
        server.serve_forever ()
    except KeyboardInterrupt:
        server.shutdown ()
        server.server_close ()

class Handler (BaseHTTPRequestHandler):
    # processing logic goes here
    def do_GET (self):
        self.send_response (200)
        self.send_header ("Content-type", "text/html")
        self.end_headers ()
        self.wfile.write ("Web content goes here.".encode ("utf8"))
        return

if __name__ == "__main__":
    main ()
