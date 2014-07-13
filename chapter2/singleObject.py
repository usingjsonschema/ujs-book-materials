"""
Read a JSON file with a single unnamed object,
and display the values for each element
"""
# import the loads function from the json module
from json import loads

# read the content of the file synchronously
data = open ("singleObject.json", "rU").read ()

# convert the text into a JSON object
server = loads (data)

# display the server name
print ("name: " + server["name"])
# display the address
print ("address: " + server["address"])
# display the port number
print ("port: " + str (server["port"]))
# display the list of admin ports
for admin in server["admin"]:
    print ("admin: " + str (admin))
