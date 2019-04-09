import json

with open('global_consts.json') as consts_file:
    consts = json.load(consts_file)

IMAGE_PROPERTIES = consts['IMAGE_PROPERTIES']
EQUATION_PROPERTIES = consts['EQUATION_PROPERTIES']
PREDICTED_PROPERTIES = consts['PREDICTED_PROPERTIES']
DATA_PROPERTIES = consts['DATA_PROPERTIES']
