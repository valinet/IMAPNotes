#!/usr/bin/env python3

#  /checkJSON.py/  gWahl  2019-12-17/

import os
import sys
import json

#------------------------------------------------

def scan_json(dir):
    for name in os.listdir(dir):
        path = os.path.join(dir, name)
        #print("scann JSON: ", path)
        if os.path.isfile(path):
            if ('.json' == path[-5:]):
            # check the file for correctness
                print("   TESTING ", path)
                with open(path) as f:
                    d = json.load(f)

        else:
            scan_json(path)


if __name__ == "__main__":

    print ("""=== Check all .json files in the directory structure for JSON correctness ===""")

    if (len(sys.argv) == 2) and sys.argv[1] == "--help":
        print ("""
        Each JSON file is loaded with the python function json.load(f).
        Any incorrect json string would throw a python error.

        Example:
          Assume the .json file holds:
            "rf.options.list.startingday.label": "Startdag fan \&apos;e wike",
          The file testing will throw an python error like this:
            json.decoder.JSONDecodeError: Invalid \escape: line 1 column 17672 (char 17671)

          More details will give an JSON Validator with:
            Error: Parse error on line 306:
            ...startingday.label": "Startdag fan \&apos
            -----------------------^
            Expecting 'STRING', 'NUMBER', 'NULL', 'TRUE', 'FALSE', '{', '[', got 'undefined'

        Note:
          If an parse error is found this function will terminate leaving other
          files untested! The whole directory structure is only completely
          scanned with ALL .json files are correct!

        JSON Validators:
            https://jsonlint.com/
            http://jsoneditoronline.org/
            https://jsonformatter.curiousconcept.com/

        Arguments:
          No arguments. Scan tree from '.'
          Use --help argument to get this help listing
        """)

        exit()

    scan_json('.')  #process .json files

    print( """      ------ Done ------------  """)
