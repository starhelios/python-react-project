import argparse
import os
import json
import urllib, cStringIO
from datetime import datetime, date, timedelta
import psycopg2
from psycopg2.extras import register_json, DictCursor
import numpy as np


def get_db():
    db_anno = os.environ['DB_ANNO']
    db = psycopg2.connect(db_anno)
    return db

def api_get_duplicates():
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    # cur.execute("SELECT * FROM TrainingEquations LIMIT 1000000")
    cur.execute("SELECT * FROM TrainingEquations WHERE session_id = 'within1000-mul-hline-20190121-340'")
    row_list = cur.fetchall()
    now = datetime.now()

    fl = open('./duplicates_report_' + now.strftime("%m-%d-%Y_%Hh%Mm%Ss") + '.log', 'w+')
    output_str = 'Row requested: ' + str(cur.rowcount) + '\n\n'
    print(output_str)
    fl.write(output_str)
    for row in row_list:
        anno_list = list(np.unique(np.array(row['anno_list'])))
        if not len(row['anno_list']) == len(anno_list):
            output_str = 'session_id: ' + row['session_id'] + ', length original/unique: ' + str(len(row['anno_list'])) + '/' + str(len(anno_list)) + '\n'
            print(output_str)
            fl.write(output_str)
            query = "UPDATE TrainingEquations SET anno_list = %s WHERE session_id = 'within1000-mul-hline-20190121-340'"
            cur.execute(query, (json.dumps(anno_list),))
    db.commit()
    fl.close()

if not 'DB_ANNO' in os.environ:
    print('You need to set DB_ANNO env first.\nUse command:\nEXPORT DB_ANNO=postgres://user:password@pg-3ed6f2e9-nico-383f.aivencloud.com:12770/zenpix?sslmode=require')
else:
    api_get_duplicates()