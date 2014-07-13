"""
 * Validate the organization data and employee data
"""
from jsonValidate import validate
import sys

def validateOrg (orgFile, empFile):
    """
    Validate organization structure and content.
    Args:
        orgFile Organization JSON file name.
        empFile Employee JSON file name.
    """
    orgSchema = "org_schema.json"
    empSchema = "employee_schema.json"

    # validate organization data
    units = None
    code, data, message = validate (orgFile, orgSchema, None, None)
    if code == 0:
        units = data["units"]
    else:
        print ("Error processing organization: " + message)
        sys.exit (code)

    # validate employee data
    employees = None
    code, data, message = validate (empFile, empSchema, None, None)
    if code == 0:
        employees = data["employees"]
    else: 
        print ("Error processing employees: " + message)
        sys.exit (code)

    verifyTopLevelUnit (units)
    verifyUniqueUnitIds (units)
    verifyUnitIds (units)
    verifyEmployeeUnits (employees, units)

def verifyTopLevelUnit (units):
    """ verify org has one, and only one, top level unit """
    topLevelUnitsCount = 0
    for unit in units:
        if unit["unitOf"] == 0:
            topLevelUnitsCount += 1

    # display results
    if topLevelUnitsCount == 0:
        print ("Error: Missing top level unit")
    elif topLevelUnitsCount == 1:
        print ("Valid: Organization top level unit valid")
    else:
        print ("Error: Multiple top level units defined")

def verifyUniqueUnitIds (units):
    """ verify unitId is unique across all units """
    for index1 in range (len (units)):
        currentUnitId = units[index1]["unitId"]
        for index2 in range (index1 + 1, len (units)):
            if currentUnitId == units[index2]["unitId"]:
                print ("Error: Duplicate unitId " + str (currentUnitId))
                break

def verifyUnitIds (units):
    """ verify org has valid unitId for all unitOf references """
    orgValid = True
    for units1 in units:
        if units1["unitOf"] != 0:
            validUnitOf = False
            for units2 in units:
                if units1["unitOf"] == units2["unitId"]:
                    validUnitOf = True
                    break

            if not validUnitOf:
                print ("Error: Invalid unitOf " + str (units1["unitOf"]))
                orgValid = False

    if orgValid:
        print ("Valid: Organization hierarchy is valid")

def verifyEmployeeUnits (employees, units):
    """ verify all employee unit references are valid org units """
    allValid = True
    for employee in employees:
        validUnit = False
        empUnit = employee["unit"]
        for unit in units:
            if empUnit == unit["unitId"]:
                validUnit = True
                break

        if not validUnit:
            print ("Error: Invalid employee unit " + str (empUnit))
            allValid = False

    if allValid:
        print ("Valid: All employee unit references valid")
