"""
Read a JSON file with multiple object types, and
display a value from each object type.
"""
from json import loads

# read the file and convert to a JSON object
data = open ("multipleObject.json", "rU").read ()
configuration = json.loads (data)

# display the port in the server definition
print ("port: " + str (configuration["server"]["port"]))
# display the url in the homepage definition
print ("url: " + configuration["homepage"]["url"])
