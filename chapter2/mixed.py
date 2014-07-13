"""
Read a JSON file with multiple object types and an array.
Display a value from the object type and each array.
"""
from json import loads

# read the file and convert to a JSON object
data = open ("mixed.json", "rU").read ()
configuration = loads (data)

# display the port in the server definition
print ("port: " + str (configuration["server"]["port"]))
# display the url of the each cataloged page
for page in configuration["pages"]:
    print ("url: " + page["url"])
