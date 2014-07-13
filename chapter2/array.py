"""
Read a JSON file with multiple array elements, and display a value
from each element.
"""
from json import loads

# read the file and convert to a JSON object
data = open ("array.json", "rU").read ()
servers = loads (data)

# display the first server address
print ("server: " + servers[0]["name"] + " " + servers[0]["address"])
# display the second server address
print ("server: " + servers[1]["name"] + " " + servers[1]["address"])
