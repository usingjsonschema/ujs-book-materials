"""
Read a JSON file with multiple named array elements,
and display a value from each element.
"""
from json import loads

# read the file and convert to a JSON object
content = open ("namedArray.json", "rU").read ()
data = loads (content)

# display the first server address
print ("server")
print ("  name: " + data["servers"][0]["name"]) 
print ("  address: " + data["servers"][0]["address"])
# display the second server address
print ("\nserver")
print ("  name: " + data["servers"][0]["name"]) 
print ("  address: " + data["servers"][0]["address"])
