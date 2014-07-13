"""
Validate organization

Usage: python check.py orgFile employeeFile
"""
from argparse import ArgumentParser
import sys
from validateOrg import validateOrg

def main ():
    """
    Parse command line and initiate validation.
    """
    parser = ArgumentParser ()
    parser.add_argument ("orgFile", help="Organization input file")
    parser.add_argument ("empFile", help="Employee input file")
    args = parser.parse_args ()

    # call organization validation processor
    validateOrg (args.orgFile, args.empFile) 

if __name__ == "__main__":
    main ()