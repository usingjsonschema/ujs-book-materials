"""
Inventory management simulation
"""
import sys
from safefile import safefile, SafeFileError
from jsonvalidate import validate, VALID
from json import dumps

# starting message
print ("Starting processing")

# inventory files
dataFile = "inventory.json";
schema = "inventory_schema.json";

# determine current state
status = safefile.safeGetState (dataFile);
if status == safefile.SAFE_INTERVENE:
    print ("Inventory file requires administrator action")
    sys.exit (1)
elif status == safefile.DOES_NOT_EXIST:
    print ("Inventory file missing")
    sys.exit (1)
elif status == safefile.SAFE_RECOVERABLE:
    safefile.safeRecover (dataFile)
    print ("Inventory file auto recovered")

# load and validate file content
inventory = None;
code, inventory, message = validate (dataFile, schema, None, None)
# if invalid, print error message
if code != VALID:
    print ("Inventory file validation failed")
    print ("Error: " + message)
    sys.exit (1)

# program content goes here ...
# to show updates, increment item count by 1 for all items
for item in inventory:
    item['count'] = item['count'] + 1

# apply formatting to content before writing when
# content is intended to be user readable/editable
output = dumps (inventory, indent = 2, sort_keys = True);

# write using recoverable interface
try:
    safefile.safeWriteFile (dataFile, output)
except SafeFileError as e:
    print ("Error writing content " + e.message)

print ("Completed processing")
