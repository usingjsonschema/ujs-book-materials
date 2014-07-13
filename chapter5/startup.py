"""
Server launcher
"""
from json import loads
from subprocess import Popen
import sys
from time import sleep

def main ():
    print ("Reading configuration from startup.json.")

    # load configuration file, which contains the startup
    # directions for all servers.
    try:
        # read the file and convert to a JSON object
        data = open ("startup.json", "rU").read ()
    except IOError as e:
        print ("Error reading configuration file: " + e.strerror)
        sys.exit (1)

    try:
        configuration = loads (data)
    except Exception as e:
        print ("Invalid JSON content in startup.json")
        sys.exit (1)

    launchServers (configuration["servers"])

def launchServers (servers):
    # for each server in configuration
    processes = []
    for server in servers:
        # if server marked to start
        if server["start"]:
            # set port number in arguments and start child process
            print ("Starting " + server["name"])
            program = server["program"] + ".py"
            port = "--port=" + str (server["port"])
            process = Popen (["python", program, port])
            processes.append (process)
            # allow child process messages to display
            sleep (0.25)

    for process in processes:
        process.wait ()

if __name__ == "__main__":
    main ()