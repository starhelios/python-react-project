#!/usr/bin/env python
from consts import DATA_PROPERTIES, PREDICTED_PROPERTIES

import statistics
import argparse
import os
import json
from functools import wraps
from PIL import Image
from flask import Flask, g, redirect, session
from flask import render_template, request, Response
import urllib
import io
from datetime import datetime, date, timedelta
import redis
import psycopg2
import requests
import time
from flask import abort
from authlib.flask.client import OAuth
from six.moves.urllib.parse import urlencode
from psycopg2.extras import register_json, DictCursor
from future.utils import iteritems
from io import BytesIO
import urllib.request
import boto3
import glob
import re
import uuid
import random
import es_utils


QUEUE_CLEAN_LIST = ['mathpix_clean', 'triage_clean', 'limi_clean']
file_list = glob.glob("src/uis/*_anno.json")
ANNO_ID_LIST = []
for file_cur in file_list:
    with open(file_cur, 'r') as f:
        anno_json = json.load(f)
        for field in anno_json['schema']['fields']:
            if field['type'] == "image":
                for subfield in field['fields']:
                    subfield_id = subfield['id']
                    subfield_id = subfield_id.replace("_polygon", "")
                    if subfield_id not in ANNO_ID_LIST:
                        ANNO_ID_LIST.append(subfield_id)
register_json(oid=3802, array_oid=3807)
DATA_DIR = os.path.dirname(os.path.realpath(__file__))
application = Flask(__name__)
oauth = OAuth(application)
# slack stuff
SLACK_API_URL = os.environ['SLACK_API_URL']
SLACK_API_TOKEN = os.environ['SLACK_API_TOKEN']
SLACK_COMMENT_NOTIFICATION_CHANNEL = os.environ['SLACK_COMMENT_NOTIFICATION_CHANNEL']
SLACK_COMMENT_NOTIFICATION_USERNAME = os.environ['SLACK_COMMENT_NOTIFICATION_USERNAME']
SLACK_COMMENT_NOTIFICATION_EMOJI = os.environ['SLACK_COMMENT_NOTIFICATION_EMOJI']
# auth0 stuff
BASE_URL = os.environ['BASE_URL']
CALLBACK_URL = BASE_URL + "/callback"
CLIENT_ID = os.environ['CLIENT_ID']
CLIENT_SECRET = os.environ['CLIENT_SECRET']
API_BASE_URL = os.environ['API_BASE_URL']
ACCESS_TOKEN_URL = os.environ['ACCESS_TOKEN_URL']
AUTHORIZE_URL = os.environ['AUTHORIZE_URL']
MAIN_QUEUE = "mathpix"
TYPESET_API_URL = os.environ.get("TYPESET_API_URL", "https://staging-typeset.mathpix.com/render/jpg")
S3_BUCKET = "mpxdata"
s3 = boto3.client('s3')
auth0 = oauth.register(
    'auth0',
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    api_base_url=API_BASE_URL,
    access_token_url=ACCESS_TOKEN_URL,
    authorize_url=AUTHORIZE_URL,
    client_kwargs={
        'scope': 'openid profile',
    },
)
docker_tcp = os.environ.get('REDIS_PORT_6379_TCP_ADDR', None)
if docker_tcp:
    redis_db = redis.Redis(docker_tcp)
else:
    if os.environ.get('REDIS_HOSTNAME', False):
        redis_db = redis.Redis(os.environ.get('REDIS_HOSTNAME', 'localhost'))
    else:
        redis_db = redis.Redis()
proxy_address = os.environ.get('DBAPI_PORT_8080_TCP_ADDR', None)
if proxy_address:
    proxy_address = "http://" + proxy_address
    proxy_address += ":" + os.environ.get('DBAPI_PORT_8080_TCP_PORT')
else:
    proxy_address = os.environ['PROXY_ADDRESS']
DB_API_KEY = os.environ['DB_API_KEY']
DB_API_HEADERS = {
    "Connection": "keep-alive",
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Accept-Encoding": "gzip,deflate,sdch",
    "api-key": DB_API_KEY
}
# auth for API key
API_KEY = os.environ['API_KEY']




def requires_api_auth(f):
    @wraps(f)
    # the new, post-decoration function. Note *args and **kwargs here.
    def decorated(*args, **kwargs):
        if request.headers.get('api-key') and request.headers.get('api-key') == API_KEY:
            return f(*args, **kwargs)
        else:
            application.logger.info("Not authorized")
            application.logger.info("Headers sent:")
            application.logger.info(str(request.headers))
            abort(403)
    return decorated

def get_image_dim(image_path):
    URL = 'https://s3.amazonaws.com/mpxdata/' + image_path
    response = requests.get(URL)
    image = Image.open(BytesIO(response.content))
    cols, rows = image.size
    return cols, rows

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db_anno = os.environ['DB_ANNO']
        db = g._database = psycopg2.connect(db_anno)
    return db

def requires_auth(f):
  @wraps(f)
  def decorated(*args, **kwargs):
    if 'profile' not in session:
      # Redirect to Login page here
      return redirect('/login')
    return f(*args, **kwargs)

  return decorated


@application.route('/login')
def login():
    return auth0.authorize_redirect(redirect_uri=CALLBACK_URL, audience='https://zenpix.auth0.com/userinfo')

@application.route('/logout')
def logout():
    # Clear session stored data
    session.clear()
    # Redirect user to logout endpoint
    params = {'returnTo': BASE_URL + "/", 'client_id': CLIENT_ID}
    return redirect(auth0.api_base_url + '/v2/logout?' + urlencode(params))


@application.route('/callback')
def callback_handling():
    auth0.authorize_access_token()
    resp = auth0.get('userinfo')
    userinfo = resp.json()
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT username FROM users WHERE user_id=%s", (userinfo['sub'],))
    row = cur.fetchone()
    username = row[0]
    application.logger.info(username)
    session['jwt_payload'] = userinfo
    session['profile'] = {
        'user_id': userinfo['sub'],
        'name': userinfo['name'],
        'picture': userinfo['picture'],
        'username': username
    }
    application.logger.info(userinfo)
    return redirect('/dashboard')

@application.route('/dashboard')
@requires_auth
def dashboard():
    application.logger.info(session['profile'])
    return render_template('dashboard.html',
                           userinfo=session['profile'],
                           userinfo_pretty=json.dumps(session['jwt_payload'], indent=4))

@application.route('/api/group/', methods=['PATCH'])
@requires_auth
def updateGroup():
    json_data = request.get_json(cache=False)
    application.logger.info(str(json_data))
    session_id = json_data['session_id']
    group_id = json_data['group_id']
    query = "UPDATE TrainingEquations SET group_id = %s WHERE session_id = %s"
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    cur.execute(query, (group_id, session_id))
    db.commit()
    return json.dumps({"success": True})

def get_query_params(data_request_params):
    dataset = data_request_params.get('dataset')
    annotator = data_request_params.get('annotator')
    property = data_request_params.get('property')
    boxId = data_request_params.get('boxId')
    fromDate = data_request_params.get('fromDate')
    toDate = data_request_params.get('toDate')
    search = data_request_params.get('search')
    search2 = data_request_params.get('search2')
    searchString = data_request_params.get('searchString')
    searchID = data_request_params.get('searchID')
    sort = data_request_params.get('sort')
    page = data_request_params.get('page')  # 1, 2, 3, ...
    group = data_request_params.get('group')
    queues = data_request_params.get('queues')
    verifier = data_request_params.get('verifier')
    is_verified = data_request_params.get('is_verified')
    is_good = data_request_params.get('is_good')
    perPage = data_request_params.get('perPage')
    query_condition = "FROM TrainingEquations WHERE true=true "
    filters = ()
    if dataset is not None and dataset:
        query_condition += " AND dataset = %s"
        filters += (dataset,)
    if annotator is not None and annotator:
        query_condition += " AND username = %s"
        filters += (annotator,)
    if group is not None and group:
        application.logger.info(group)
        query_condition += " AND group_id = %s"
        filters += (group,)
    if queues is not None and queues:
        application.logger.info(queues)
        query_condition += " AND queue = %s"
        filters += (queues,)
    if verifier is not None and verifier:
        application.logger.info(verifier)
        query_condition += " AND verified_by = %s"
        filters += (verifier,)
    if fromDate is not None and fromDate:
        query_condition += " AND datetime >= %s"
        filters += (fromDate,)
    if toDate is not None and toDate:
        query_condition += " AND datetime < %s"
        splitted = toDate.split('-')
        if len(splitted) < 3:
            return json.dumps({'error': {'message': 'toDate is not in a valid date format.'}}), 400
        _toDate = date(int(splitted[0]), int(splitted[1]), int(splitted[2])) + timedelta(days=1)
        filters += (_toDate.strftime("%Y-%m-%d"),)
    if property is not None:
        propFilters = property.split('*')
        for prop in propFilters:
            if prop.startswith('!'):
                if prop[1:] == 'anno_list_is_empty':
                    query_condition += ' AND anno_list IS NOT NULL'
                elif prop[1:] == 'char_size_null':
                    query_condition += ' AND char_size IS NOT NULL'
                elif prop[1:] == "contains_header":
                    query_condition += """ AND NOT anno_list @> '[{"boxId":"header"}]'"""
                elif prop[1:] in DATA_PROPERTIES.keys():
                    query_condition += " AND %s != true" % prop[1:]
            else:
                if prop == 'anno_list_is_empty':
                    query_condition += ' AND anno_list IS NULL'
                elif prop == 'char_size_null':
                    query_condition += ' AND char_size IS NULL'
                elif prop == "contains_header":
                    query_condition += """ AND anno_list @> '[{"boxId":"header"}]'"""
                elif prop in DATA_PROPERTIES.keys():
                    query_condition += " AND %s = true" % prop

    if boxId is not None:
        boxIdFilters = boxId.split('*')
        for prop in boxIdFilters:
            res = re.findall('^(.*)\[([0-9]*)\]$', prop)
            regexParam = False
            if (res):
                regexParam = [s for s in res[0]]
            param = prop
            paramCount = 0
            if regexParam:
                param = regexParam[0]
                paramCount = int(regexParam[1])
            if param.startswith('!'):
                query_condition += """ AND NOT (anno_list @> '[{"boxId": "%s" }]' OR anno_list @> '[{"boxId": "%s_polygon" }]')""" % (param[1:], param[1:])
            else:
                query_condition += """ AND (anno_list @> '[{"boxId": "%s" }]' OR anno_list @> '[{"boxId": "%s_polygon" }]')""" % (param, param)
                if (paramCount > 0):
                    query_condition += """ AND row_id IN (
                    SELECT row_id FROM (
                        WITH A AS (SELECT row_id, jsonb_array_elements(anno_list) AS point FROM public.trainingequations )
                        SELECT A.row_id, count(A.row_id) as cnt2 FROM A WHERE (point->>'boxId') = '%s' GROUP BY A.row_id) as B
                    WHERE B.cnt2 >= %s
                    )""" % (param, paramCount)
    # search
    errorFields = []
    try:
        if search is not None and search:
            if is_valid_exp(search) == False:
                errorFields.append("searchError")
            else:
                query_condition += " AND text ~ %s"
                filters += (search,)
        if search2 is not None and search2:
            if is_valid_exp(search2) == False:
                errorFields.append("search2Error")
            else:
                query_condition += " AND text ~ %s"
                filters += (search2,)
        if searchString is not None and searchString:
            query_condition += " AND replace(text, ' ', '') ~ %s"
            filters += (re.escape(searchString.replace(" ", "")),)
        if len(errorFields) > 0:
            raise Exception(errorFields)
    except:
        raise

    if searchID is not None and searchID:
        query_condition += " AND session_id ~ %s"
        filters += (searchID,)
    if sort is None or sort not in ('username', '-username', 'datetime', '-datetime'):
        sort = '-datetime'
    sortBy = sort
    sortDir = 'ASC';
    if sort.startswith('-'):
        sortBy = sort[1:]
        sortDir = 'DESC'
    pagination_condition = " ORDER BY %s %s" % (sortBy, sortDir)
    if perPage is None or not perPage.isdecimal():
        perPage = 50
    else:
        perPage = int(perPage)
    if page is None or not page.isdecimal():
        page = 1
    else:
        page = int(page)
    if page < 1:
        page = 1
    offset = perPage * (page - 1)
    pagination_condition += " LIMIT %s OFFSET %s" % (perPage, offset)
    return query_condition, pagination_condition, filters


# TODO: funky that this is a GET request
@application.route('/api/queue', methods=['GET'])
@requires_auth
def api_get_queue():
    data_request_params = request.args.to_dict()
    (query_condition, _, filters) = get_query_params(data_request_params)
    countQuery = "SELECT session_id " + query_condition
    application.logger.info(countQuery)
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    cur.execute(countQuery, filters)
    if 'queue' not in data_request_params:
        return json.dumps({'success': False, 'error': 'Must specify queue name'})
    if 'dataset' not in data_request_params:
        return json.dumps({'success': False, 'error': 'Must specify dataset (cannot be all)'})
    queue = data_request_params['queue']
    application.logger.info(queue)
    dataset = data_request_params['dataset']
    redis_db.delete(queue)
    application.logger.info("Inserting into redis...")
    row_list = [r[0] for r in cur.fetchall()]
    redis_db.rpush(queue, *row_list)
    redis_db.sadd('queues', queue)
    application.logger.info(dataset)
    redis_db.hset('queues_dataset', queue, dataset)
    url = 'annotate/' + dataset +  '?queue=' + queue
    return json.dumps({'success': True, 'error': '', 'url': url})


# TODO: funky that this is a GET request
@application.route('/api/user-data/queue', methods=['GET'])
@requires_auth
def api_get_user_data_queue():
    request_url = proxy_address + "/user-data/session-id-list?" + request.query_string.decode('utf-8')
    r = requests.get(request_url, headers=DB_API_HEADERS)
    result_json = r.json()
    application.logger.info(result_json)
    if not result_json or result_json['success'] != True:
        return json.dumps({'success': False, 'error': 'Invalid DB API response.'})
    session_id_list = result_json['data']['session_id_list']
    user_data_request_params = request.args.to_dict()
    dataset = user_data_request_params['dataset']
    if dataset=="ocr":
        session_id_list = [session_id + "_ocr" for session_id in session_id_list]
    elif dataset=="triage":
        session_id_list = [session_id + "_triage" for session_id in session_id_list]
    queue = user_data_request_params['queue']
    redis_db.rpush(queue, *session_id_list)
    redis_db.sadd('queues', queue)
    application.logger.info(dataset)
    redis_db.hset('queues_dataset', queue, dataset)
    url = 'annotate/' + dataset +  '?queue=' + queue
    return json.dumps({'success': True, 'error': '', 'url': url})


@application.route('/api/data', methods=['GET'])
@requires_auth
def api_get_data():
    try:
        data_request_params = request.args.to_dict()
        query_condition, pagination_condition, filters = get_query_params(data_request_params)
        db = get_db()
        cur = db.cursor(cursor_factory=DictCursor)
        count_query = "SELECT count(session_id) " + query_condition
        application.logger.info("Counting... {}".format(count_query))
        cur.execute(count_query, filters)
        total = cur.fetchone()[0]
        application.logger.info("Selecting...")
        select_query = "SELECT * " + query_condition + pagination_condition
        cur.execute(select_query, filters)
        row_list = cur.fetchall()
        data_list = get_data_list(row_list)
        result = {
            'data': {
                'total': total,
                'list': data_list
            }
        }
        return json.dumps(result, default=str)
    except psycopg2.Error as e:
        return json.dumps({'error': {'message': e.diag.message_primary.capitalize(), 'type': 'dbError'}}), 400
    except Exception as e :
        fields = list(e)[0]
        return json.dumps({'error': {'fields': fields, 'type': 'inputError'}}), 400

def is_valid_exp(exp):
    try:
        re.compile(exp)
        return True
    except:
        return False

@application.route('/api/groups', methods=['GET'])
@requires_auth
def api_get_groups():
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    cur.execute("SELECT DISTINCT group_id as group_id FROM TrainingEquations")
    row_list = cur.fetchall()
    group_list = [row['group_id'] for row in row_list]
    group_list = [g for g in group_list if g is not None and len(g.strip()) > 0]
    result = {
        'data': {
            'groups': group_list
        }
    }
    return json.dumps(result)

@application.route('/api/data-queues', methods=['GET'])
@requires_auth
def api_get_queues():
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    cur.execute("SELECT DISTINCT queue as queue FROM TrainingEquations")
    row_list = cur.fetchall()
    queue_list = [row['queue'] for row in row_list]
    queue_list = [g for g in queue_list if g is not None and len(g.strip()) > 0]
    result = {
        'data': {
            'queues': queue_list
        }
    }
    return json.dumps(result)

@application.route('/api/verifiers', methods=['GET'])
@requires_auth
def api_get_verifiers():
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    cur.execute("SELECT DISTINCT verified_by as verified_by FROM TrainingEquations")
    row_list = cur.fetchall()
    verifier_list = [row['verified_by'] for row in row_list]
    verifier_list = [g for g in verifier_list if g is not None and len(g.strip()) > 0]
    result = {
        'data': {
            'verifiers': verifier_list
        }
    }
    return json.dumps(result)

@application.route('/api/datasets', methods=['GET'])
@requires_auth
def api_get_datasets():
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    cur.execute("SELECT DISTINCT dataset as dataset FROM TrainingEquations")
    row_list = cur.fetchall()
    dataset_list = [row['dataset'] for row in row_list]
    dataset_list = [g for g in dataset_list if g is not None and len(g.strip()) > 0]
    result = {
        'data': {
            'datasets': dataset_list
        }
    }
    return json.dumps(result)

@application.route('/api/dequeue-json/<dataset>/<queue_id>', methods=['POST'])
@requires_auth
def dequeue_json(dataset, queue_id):
    input_json_data = request.get_json(cache=False)
    session_id_prev = input_json_data.get('session_id', None)
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    # TODO: explore whether we can remove this hack

    if session_id_prev is not None and queue_id.endswith("_clean"):
        application.logger.info("Setting %s as verified!" % session_id_prev)
        username = session['profile']['username']
        if type(username) != str:
            username = username.decode('utf-8')
        # don't update db row if already verified via save-json
        cur.execute("UPDATE TrainingEquations SET is_verified=%s, verified_by=%s, datetime=NOW(), " +
                    "verified_at=NOW() WHERE session_id=%s",
                    (True, username, session_id_prev))
        db.commit()

        es_utils.log({
            'event_type': 'annotation_verified',
            'username': username,
            'group_id': input_json_data.get('group_id', None),
            'session_id': session_id_prev,
            'queue_id': queue_id,
            'dataset': dataset,
            'is_done': input_json_data.get('is_good', None),
            'is_verified': True, #input_json_data.get('is_verified', None),
        })

    # TODO: make this code more general
    application.logger.info(queue_id)
    if queue_id in QUEUE_CLEAN_LIST:
        cur.execute("SELECT * FROM TrainingEquations WHERE dataset=%s AND is_good=true AND is_verified=false ORDER BY random() LIMIT 100", (dataset,))
        rows = cur.fetchall()
        if len(rows) == 0:
            return json.dumps({'redirect_url': '/queues'})
        row = random.choice(rows)
        application.logger.info(row)
        data_row = dict(row)
        es_utils.log({
            'event_type': 'annotation_dequeued',
            'username': data_row.get('username', None),
            'group_id_prev': data_row.get('group_id', None),
            'is_done_prev': data_row.get('is_good', None),
            'is_verified_prev': data_row.get('is_verified', None),
            'session_id_prev': session_id_prev,
            'session_id_next': data_row.get('session_id', None),
            'queue_id': queue_id,
            'dataset': dataset,
        })
        resp_json_data = {}
        for key, val in iteritems(data_row):
            resp_json_data[key] = data_row[key]
        resp_json_data['queue_count'] = len(rows)
        json_str = json.dumps(resp_json_data, default=str)
        return json_str

    session_id, queue_count = session_id_pop(queue_id)
    es_utils.log({
        'event_type': 'annotation_dequeued',
        'username': input_json_data.get('username', None),
        'group_id_prev': input_json_data.get('group_id', None),
        'is_done_prev': input_json_data.get('is_good', None),
        'is_verified_prev': input_json_data.get('is_verified', None),
        'session_id_prev': session_id_prev,
        'session_id_next': session_id,
        'queue_id': queue_id,
        'dataset': dataset,
    })
    if session_id is None:
        redis_db.delete(queue_id)
        redis_db.srem('queues', queue_id)
        redis_db.hdel('queues_dataset', queue_id)
        return json.dumps({'redirect_url': '/queues'})
    cur.execute("SELECT * FROM TrainingEquations WHERE session_id=%s", (session_id,))
    rows = cur.fetchall()
    resp_json_data = {}
    if len(rows) != 0:
        data_row = dict(rows[0])
        for key, val in iteritems(data_row):
            resp_json_data[key] = data_row[key]
    else:
        application.logger.info("Using predicted annotations.")
        resp_json_data = get_predicted_properties(session_id, dataset)
    resp_json_data['queue_count'] = queue_count
    json_str = json.dumps(resp_json_data, default=str)
    return json_str

@application.route('/api/save-json', methods=['POST'])
@requires_auth
def save():
    json_data = request.get_json(cache=False)
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    # insert into Equation table
    json_data_copy = json_data.copy()
    session_id = json_data_copy['session_id']
    image_path = json_data_copy['image_path']
    anno_list = json_data_copy['anno_list']
    image_path_basename = os.path.basename(image_path)
    anno_list_new = [anno for anno in anno_list if image_path_basename in anno['src']]
    # TODO: check Zenpix to see why we sometimes get bad data like this
    anno_list_new = [anno for anno in anno_list_new if anno['shapes'][0] != None]
    json_data_copy['anno_list'] = json.dumps(anno_list_new)
    json_data_copy['metadata'] = json.dumps(json_data_copy['metadata'])
    json_data_copy['datetime'] = 'NOW()'
    json_data_copy['saved_at'] = 'NOW()'
    json_data_copy['saved'] = True
    dataset = json_data_copy['dataset']
    queue_name = json_data.get('queue', MAIN_QUEUE) or MAIN_QUEUE
    username = session['profile']['username']
    if type(username) != str:
        username = username.decode('utf-8')
    json_data_copy['username'] = username
    if json_data_copy.get('is_good', False) is not True:
        json_data_copy['is_good'] = False
    if dataset == 'mathpix' and json_data_copy['group_id'] == 'synth' and json_data_copy['is_good'] == True:
        json_data_copy['is_verified'] = True
        json_data_copy['verified_by'] = username
        json_data_copy['verified_at'] = 'NOW()'
    elif username in ['Maksym', 'Nico', 'Alika', 'Makesym', 'Kaitlin']:
        json_data_copy['is_verified'] = True
        json_data_copy['verified_by'] = username
        json_data_copy['verified_at'] = 'NOW()'
    else:
        json_data_copy['is_verified'] = False
        json_data_copy['verified_by'] = None
    clean_queue_name = queue_name + "_clean"
    application.logger.info("Adding %s to %s" % (session_id, str(clean_queue_name)))
    redis_db.sadd('queues', clean_queue_name)
    redis_db.hset('queues_dataset', clean_queue_name, json_data_copy['dataset'])
    redis_db.lpush(clean_queue_name, session_id)

    es_utils.log({
        'event_type': 'annotation_saved',
        'username': username,
        'group_id': json_data_copy['group_id'],
        'session_id': session_id,
        'queue_id': queue_name,
        'dataset': dataset,
        'is_done': json_data_copy['is_good'],
        'is_verified': json_data_copy['is_verified']
    })

    if json_data_copy['is_verified'] and json_data_copy['is_good']:
        es_utils.log({
            'event_type': 'annotation_verified',
            'username': username,
            'group_id': json_data_copy['group_id'],
            'session_id': session_id,
            'queue_id': queue_name,
            'dataset': dataset,
            'is_done': True,
            'is_verified': True,
        })

    # now filter keys
    keys = ['text', 'username', 'anno_list', 'dataset', 'datetime',
            'image_path', 'session_id', 'saved', 'is_good',
            'image_height', 'image_width', 'fully_boxed',
            'group_id', 'contains_foreign_alphabet', 'is_full_page', 'verified_by',
            'metadata', 'is_verified', 'queue', 'char_size',
            'is_printed', 'is_handwritten', 'is_inverted', 'contains_table', 'notes']
    json_data_final = {}
    for (key, val) in iteritems(json_data_copy):
        if key not in keys:
            continue
        json_data_final[key] = val
    # override text value in the database for "ocr" annotations
    if dataset == "ocr":
        anno_list = anno_list_new
        anno_list = sorted(anno_list, key=lambda x: x["order"])
        text_list = [anno["text"] for anno in anno_list]
        text = "\n".join(text_list)
        json_data_final["text"] = text
    elif dataset == "triage":
        json_data_final["text"] = ""
    # construct sql query
    columns = ', '.join(json_data_final.keys())
    placeholders = ('%s, ' * len(json_data_final))[:-2]
    sql = 'INSERT INTO TrainingEquations ({}) VALUES ({})'.format(columns, placeholders)
    sql += ' ON CONFLICT(session_id) DO UPDATE SET ';
    for key, val in iteritems(json_data_final):
        sql += ("%s=" % key) + '%s, '
    sql = sql[:-2]
    cur.execute(sql, list(json_data_final.values()) + list(json_data_final.values()))
    cur.execute("DELETE FROM queues WHERE image_id=%s", (session_id,))
    db.commit()
    return json.dumps({'success': True, 'affected': cur.rowcount})

@application.route('/api/queues', methods=['GET'])
@requires_auth
def get_queues():
    queue_list = redis_db.smembers('queues')
    output_list = []
    for queue in queue_list:
        queue_count = redis_db.llen(queue)
        queue_dataset = redis_db.hget('queues_dataset', queue).decode('utf-8')
        url = "annotate/" + queue_dataset + "?" + urlencode({ "queue": queue })
        output_list.append({'name': queue.decode('utf-8'), 'length': queue_count, 'url': url})
    json_data = {"queues": output_list}
    json_str = json.dumps(json_data, default=str)
    return json_str

@application.route('/api/queues-items', methods=['GET'])
@requires_auth
def get_queues_items():
    queue_list = redis_db.smembers('queues')
    output_list = []
    output_data = {}
    # for queue in queue_list:
    for queue in ['mathpix', 'triage']:
        item_list = redis_db.lrange(queue, 0, -1)
        item_list = [x.decode('utf-8') for x in item_list]
        output_data[queue] = item_list
    json_str = json.dumps(output_data, default=str)
    return json_str

@application.route('/api/queues/<queue>', methods=['DELETE'])
@requires_auth
def delete_queues(queue):
    redis_db.delete(queue)
    redis_db.srem('queues', queue)
    redis_db.hdel('queues_dataset', queue)
    return json.dumps({"success": True})

@application.route('/api/get-json/<dataset>/<path:session_id>', methods=['GET'])
@requires_auth
def get_json(dataset, session_id):
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    cur.execute("SELECT * FROM TrainingEquations WHERE session_id=%s AND dataset=%s", (session_id, dataset))
    rows = cur.fetchall()
    json_data = {}
    if len(rows) != 0:
        data_row = dict(rows[0])
        for key, val in iteritems(data_row):
            json_data[key] = data_row[key]
    else:
        application.logger.info("Using predicted annotations.")
        json_data = get_predicted_properties(session_id, dataset)
    json_str = json.dumps(json_data, default=str)
    return json_str

@application.route('/api/cr', methods=['POST'])
@requires_auth
def cr():
    json_data = request.get_json(cache=False)
    user_id_annotated = json_data.get('user_id_annotated', None)
    user_id_verified = json_data.get('user_id_verified', None)
    slack_text = json_data.get('msg', 'No message')
    anno_url = json_data.get('anno_url', None)
    session_id = json_data.get('session_id', None)
    if session_id is not None:
        db = get_db()
        cur = db.cursor(cursor_factory=DictCursor)
        query = "UPDATE TrainingEquations SET is_good=%s, verified_by=null, is_verified=false WHERE session_id = %s"
        cur.execute(query, (False, session_id))
        db.commit()
    anno_url = anno_url.split("?")[0] + "?sessionID=" + session_id
    if anno_url is None:
        err = "Must provide annotation link!"
        json_str = json.dumps({"success": False, "error": err}, default=str)
        return json_str
    username = None
    if user_id_verified is not None:
        username = user_id_verified
    elif user_id_annotated is not None:
        username = user_id_annotated
    footer = "Good work and keep it up!"
    if username is not None:
        db = get_db()
        cur = db.cursor(cursor_factory=DictCursor)
        query = "SELECT slack_username FROM users WHERE username = %s"
        cur.execute(query, (username,))
        row = cur.fetchone()
        if row:
            slack_username = row[0]
            footer = "<@%s>" % slack_username
        else:
            footer = "<@%s>" % username
    attachments = [{
        'color': '#ee0099',
        'title': "CR notification",
        'title_link': anno_url,
        'text': slack_text,
        'footer': footer
    }]
    arguments = {
        'token': SLACK_API_TOKEN,
        'channel': SLACK_COMMENT_NOTIFICATION_CHANNEL,
        'username': SLACK_COMMENT_NOTIFICATION_USERNAME,
        'icon_emoji': SLACK_COMMENT_NOTIFICATION_EMOJI,
        'attachments': json.dumps(attachments)
    }
    url = "%s?%s" % (SLACK_API_URL, urllib.parse.urlencode(arguments))
    f = urllib.request.urlopen(url)
    print('=== Slack API called to notify new comment ===\n' + str(f.read()))
    f.close()
    es_utils.log({
        'event_type': 'annotation_cr',
        'session_id': session_id,
        'slack_text': slack_text,
        'queue_id': json_data.get('queue', None),
        'dataset': json_data.get('dataset', None),
        'is_verified': json_data.get('is_verified', None),
        'username_annotated': user_id_annotated,
        'username_verified': user_id_verified,
    })
    json_str = json.dumps({"success": True}, default=str)
    return json_str


def get_predicted_properties(image_id, dataset):
    application.logger.info("querying sql")
    request_url = proxy_address + "/predicted-properties/" + image_id.replace("_triage", "").replace("_ocr", "")
    r = requests.get(request_url, headers=DB_API_HEADERS)
    result_json = r.json()
    if not result_json or result_json['success'] != True:
        return None
    predicted_data = result_json['data']
    result = predicted_data['result']
    request_args = predicted_data['request_args']
    internal = predicted_data['internal']
    group_id = predicted_data['group_id']
    anno_list_db = predicted_data['anno_list']
    if anno_list_db is None:
        anno_list_db = []
    text_anno = predicted_data['text_anno']
    latex_anno = internal.get('latex_anno', '')
    # TODO: remove this hack!!!
    latex_styled = result.get('latex_styled', None)
    if text_anno is not None and 'tabular' in text_anno and latex_styled:
        text = "\\[ %s \\]" % latex_styled
    else:
        if text_anno:
            text = text_anno
        else:
            text = result.get('text', None)
            if text is None:
                text = "\\[ %s \\]" % latex_anno
    image_path = 'eqn_images/' + image_id.replace('_triage', '').replace('_ocr', '') + '.jpg'
    # TODO: compute global char_size here (?) or do it in production?
    char_size_predicted = internal.get('char_size', None)
    data = {
        'latex_confidence': result.get('latex_confidence', -1.),
        'latex_styled': latex_styled,
        'latex': latex_anno,
        'text': text,
        'image_path': image_path,
        'group_id': group_id,
        'session_id': image_id,
        'char_size_predicted': char_size_predicted,
        'dataset': dataset
    }
    detection_list = result.get('detection_list', [])
    for detection in detection_list:
        data[detection] = True
    # get image coordinates
    (cols, rows) = get_image_dim(image_path)
    data['image_width'] = cols
    data['image_height'] = rows
    data['metadata'] = request_args.get('metadata', {})
    eqn_position = result.get('position', None)
    if eqn_position is None:
        if dataset == 'mathpix':
            anno_list_db = [anno for anno in anno_list_db if anno.get('text_anno', None)]
            # v3/text
            if anno_list_db:
                if 'charSize' in anno_list_db[0]:
                    data['char_size'] = anno_list_db[0]['charSize']
                base_path = os.path.basename(image_path)
                anno = create_anno(base_path, '', 0, 0, 1, 1)
                anno['boxId'] = 'equations'
                anno['shapes'][0]['style'] = {"outline": '#FF0000', "outline_width": 2}
                data['anno_list'] = [anno]
            # v3/latex
            else:
                base_path = os.path.basename(image_path)
                anno = create_anno(base_path, '', 0, 0, 1, 1)
                anno['boxId'] = 'equations'
                anno['shapes'][0]['style'] = {"outline": '#FF0000', "outline_width": 2}
                data['anno_list'] = [anno]
        elif dataset == 'triage':
            if anno_list_db:
                data['anno_list'] = [anno for anno in anno_list_db if not anno['boxId'].startswith('line')]
        elif dataset == "ocr":
            anno_list = [anno for anno in anno_list_db if anno['boxId'].startswith('line')]
            for anno in anno_list:
                if 'text_anno' in anno:
                    anno['text'] = anno['text_anno']
            char_size_list = [anno['charSize'] for anno in anno_list]
            data['anno_list'] = anno_list
            data['char_size_predicted'] = statistics.median(char_size_list)
    else:
        if 'top_left_x' in eqn_position:
            x = eqn_position['top_left_x'] / float(cols)
            y = eqn_position['top_left_y'] / float(rows)
            w = eqn_position['width'] / float(cols)
            h = eqn_position['height'] / float(rows)
            if (x, y, w, h) != (0, 0, 0, 0):
                base_path = os.path.basename(image_path)
                anno = create_anno(base_path, '', x, y, w, h)
                if dataset == 'triage':
                    anno['boxId'] = 'equation'
                    anno['shapes'][0]['style'] = {"outline": '#FF0000', "outline_width": 2}
                elif dataset == 'ocr':
                    anno['boxId'] = 'line'
                    anno['shapes'][0]['style'] = {"outline": "#01452c", "outline_width": 2}
                    anno['text'] = text
                    anno['charSize'] = char_size_predicted
                    if "https" not in anno['src']:
                        anno['src'] = "https://s3.amazonaws.com/mpxdata/eqn_images/" + anno['src']
                else:
                    anno['boxId'] = 'equations'
                    anno['shapes'][0]['style'] = {"outline": '#FF0000', "outline_width": 2}
                data['anno_list'] = [anno]
                if dataset == 'triage':
                    anno['charSize'] = char_size_predicted
    return data

def get_data_list(row_list):
    data_list = []
    for row in row_list:
        cur_data = {'image_path': row['image_path'],
                    'username': row['username'],
                    'datetime': row['datetime'],
                    'group_id': row['group_id'],
                    'anno_list': row['anno_list'],
                    'session_id': row['session_id'],
                    'latex_normalized': row['latex_normalized'],
                    'properties': {'is_good': row['is_good']},
                    'is_good': row['is_good'],
                    'verified_by': row['verified_by'],
                    'dataset': row['dataset'],
                    'text': row['text'],
                    'text_normalized': row['text_normalized'],
                    'char_size': row['char_size'],
                    'is_verified': row['is_verified'],
                    'is_inverted': row['is_inverted'],
                    'is_printed': row['is_printed'],
                    'is_handwritten': row['is_handwritten'],
                    'queue': row['queue']}
        for prop, description in iteritems(DATA_PROPERTIES):
            if str(prop) in cur_data['properties']:
                cur_data['properties'][str(prop)] = {'value': row[str(prop)],
                                                     'description': str(description)}
        data_list.append(cur_data)
    return data_list

@application.route('/usage', methods=['GET'])
@requires_auth
def usage():
    return render_template('usage.html')

@application.route('/queues', methods=['GET'])
@requires_auth
def queues():
    return render_template('queues.html')

@application.route('/health', methods=['GET'])
def get_health():
    application.logger.info("Health endpoint.")
    return json.dumps({'success': True})

@application.route('/keys', methods=['GET'])
@requires_auth
def keys():
    return render_template('keys.html')

@application.route('/ping', methods=['GET'])
def ping():
    return "Success"

@application.route('/user/<user_id>', methods=['GET'])
@requires_auth
def user(user_id):
    return render_template("user.html", username=user_id)

@application.route('/users', methods=['GET'])
@requires_auth
def admin():
    return render_template("admin.html")

def create_anno(image_basepath, text, x, y, w, h):
    anno = {"src": image_basepath,
            "text": text,
            "shapes": [
                {
                    "type": "rect",
                    "style": {"outline": '#00ff00'},
                    "geometry": {
                        "x": x,
                        "y": y,
                        "width": w,
                        "height": h
                    }
                }
            ]}
    return anno

@application.route('/mycounts', methods=['GET'])
@requires_auth
def mycounts():
    return render_template('mycounts.html')

@application.route('/data')
@requires_auth
def annotations():
    return render_template("data.html")

@application.route('/normalized-data')
@requires_auth
def normalized_data():
    return render_template("normalized_data.html")

@application.route('/predicted-data')
@requires_auth
def predicted_annotations():
    return render_template("predicted_data.html")

@application.route('/predicted-triage')
@requires_auth
def predicted_triage():
    return render_template("predicted_triage.html")

@application.route('/user-data')
@requires_auth
def userData():
    return render_template("user_data.html")

@application.route('/graph', methods=['GET'])
@requires_auth
def get_graph():
    return render_template('graph.html')

@application.route('/api/queue-image', methods=['POST'])
@requires_auth
def queue_equation():
    # NOTE: currently only suitable for OCR / TRIAGE datasets
    data = request.get_json(cache=False)
    image = data['image']
    dataset_original = data['dataset']
    update_log = data.get('update_log', False)
    image_id = image['image_id']
    result = image['result']
    internal = image['internal']
    request_args = image['request_args']
    group_id = image['group_id']
    db = get_db()
    cur = db.cursor()
    # insert into redis
    queue = dataset_original
    redis_db.sadd('queues', queue)
    redis_db.hset('queues_dataset', queue, dataset_original)
    if dataset_original == "triage":
        image_id_triage = image_id + "_triage"
        redis_db.rpush(queue, image_id_triage)
    elif dataset_original == "ocr":
        image_id_ocr = image_id + "_ocr"
        redis_db.rpush(queue, image_id_ocr)
    else:
        redis_db.rpush(queue, image_id)
    # commit to db, return response
    db.commit()
    json_body = {'image_id': image_id, 'datetime': image['datetime']}
    if update_log is True:
        request_url = proxy_address + "/queue-image"
        r = requests.post(request_url, json=json_body, headers=DB_API_HEADERS)
        flask_response = Response(response=r.content, status=r.status_code)
        return flask_response
    return json.dumps({'success': True})

@application.route('/api/queue-image-list', methods=['POST'])
@requires_api_auth
def queue_image_list():
    data = request.get_json(cache=False)
    image_id_list = data['image_id_list']
    queue = data['queue_name']
    dataset = data['dataset']
    redis_db.sadd('queues', queue)
    redis_db.hset('queues_dataset', queue, dataset)
    for image_id in image_id_list:
        redis_db.rpush(queue, image_id)
    url = "https://admin2.zenpix.io/annotate/" + dataset + "?queue=" + queue
    return json.dumps({'success': True, 'url': url})

def session_id_pop(queue_id):
    queue_count = redis_db.llen(queue_id)
    if queue_count == 0:
        return None, 0
    _, session_id = redis_db.brpop(queue_id)
    session_id = session_id.decode('utf-8')
    application.logger.info(session_id)
    return session_id, queue_count - 1

@application.route('/')
@requires_auth
def index():
    session_id = request.args.get('sessionID', None)
    queue_id = request.args.get('queue', MAIN_QUEUE)
    username = session['profile']['username']
    if type(username) != str:
        username = username.decode('utf-8')
    application.logger.info("Username: %s" % (username, ))
    application.logger.info("Index request with username: %s" % username)
    if session_id is None and queue_id is None:
        return render_template('home.html')
    return redirect("/data")

@application.route('/annotate/<dataset>')
@requires_auth
def annotate(dataset):
    session_id = request.args.get('sessionID', None)
    queue_id = request.args.get('queue', dataset)
    username = session['profile']['username']
    if type(username) != str:
        username = username.decode('utf-8')
    application.logger.info("Index request with username: %s" % username)
    if session_id is None and queue_id is not None:
        if queue_id in QUEUE_CLEAN_LIST:
            db = get_db()
            cur = db.cursor()
            cur.execute("SELECT session_id FROM TrainingEquations WHERE dataset=%s AND is_good=true AND is_verified=false ORDER BY random() LIMIT 1", (dataset,))
            rows = cur.fetchall()
            if len(rows) == 0:
                return redirect('/queues')
            session_id = rows[0][0]
            queue_count = 100
            query_param = request.base_url + "?" + urlencode({
                "sessionID": session_id,
                "queue": queue_id})
            return redirect(query_param)
        else:
            session_id, queue_count = session_id_pop(queue_id)
            query_param = request.base_url + "?" + urlencode({
                "sessionID": session_id,
                "queue": queue_id})
            return redirect(query_param)
    if queue_id in QUEUE_CLEAN_LIST:
        queue_count = 100
    else:
        queue_count = redis_db.llen(queue_id)
    return render_template('annoUI.html', username=username, queue_name=queue_id, queue_count=queue_count, dataset=dataset, timestamp=time.time())

@application.route('/synthetic')
@requires_auth
def synthetic():
    username = session['profile']['username']
    if type(username) != str:
        username = username.decode('utf-8')
    application.logger.info("synthetic request with username: %s" % username)
    return render_template('synthetic.html', username=username)

@application.route("/vis", methods=['GET'])
@requires_auth
def vis():
    return render_template("vis.html")

@application.route("/instructions", methods=['GET'])
@requires_auth
def instructions():
    return render_template("instructions.html")

@application.route("/debug", methods=['GET'])
@requires_auth
def debug():
    return render_template("debug.html")

@application.route('/api/users', methods=['GET'])
@requires_auth
def api_get_users():
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT distinct(username) FROM trainingequations")
    row_list = cur.fetchall()
    users = [row[0] for row in row_list]
    result = {
        'data': {
            'users': users
        }
    }
    return json.dumps(result)

@application.route('/api/anno-id-list', methods=['GET'])
@requires_auth
def api_get_anno_id_list():
    result = {
        'data': {
            'anno_id_list': ANNO_ID_LIST
        }
    }
    return json.dumps(result)

@application.route('/api/text-to-s3', methods=['POST'])
@requires_auth
def latexToS3():
    global TYPESET_API_URL, S3_BUCKET, s3
    json_data = request.get_json(cache=False)
    text= json_data["text"]
    # generate image by using typesetting api
    req = urllib.request.Request(url=TYPESET_API_URL, data=text.encode('utf-8'))
    res = urllib.request.urlopen(req)
    resBody = res.read()
    image = Image.open(io.BytesIO(resBody))
    col = image.width
    row = image.height
    image.close()
    # generate session_id  (uuid v4)
    session_id = "synth_{}".format(uuid.uuid4())
    image_path = 'eqn_images/{}.jpg'.format(session_id)
    s3.put_object(Bucket=S3_BUCKET, Key=image_path, Body=resBody, ContentType='image/jpeg')

    # Get image height and width
    is_good = json_data.get("is_good", False)
    group_id = json_data.get("group_id", "synth")
    username = json_data.get("username", "synth")
    application.logger.info("Image path: %s" % image_path)
    db = get_db()
    cur = db.cursor(cursor_factory=DictCursor)
    query = (
       'INSERT INTO TrainingEquations ',
       '(username, datetime, image_path, session_id, text, is_good, ',
       'contains_geometry, contains_table, is_inverted, is_printed, is_handwritten,  ',
       'anno_list, group_id, char_size, image_width, ' +
       'image_height, contains_foreign_alphabet, is_full_page, dataset) ',
       'VALUES %s')
    query = "".join(query)
    anno_list = json.dumps([
        {"src": image_path,
         "text": "",
         "boxId": "equations",
         "shapes": [{"type": "rect", "style": {"outline": "#FF0000", "outline_width": 2},
         "geometry": {"x": 0, "y": 0, "width": 1, "height": 1}}]
        }])
    # makes it convenient to delete data (newer than now!)
    now = 'NOW()'
    data_list = []
    dataset = "mathpix"
    data_list.append([username, now, image_path, session_id, text,
                      is_good, False, False, False, True, False, anno_list,
                      group_id, 14.5, col, row, False, False, dataset])
    psycopg2.extras.execute_values(cur, query, data_list, template=None, page_size=100)
    db.commit()
    return json.dumps({'success': True, 'session_id': session_id})


@application.route('/api/<path:other>', methods=['GET'])
@requires_auth
def other(other):
    request_url = proxy_address + "/" + other
    username = session['profile']['username']
    if type(username) != str:
        username = username.decode('utf-8')
    if len(request.query_string) > 0:
        request_url += "?" + request.query_string.decode('utf-8')
        extra = urlencode({"username": username})
        request_url += "&" + extra
    else:
        extra = urlencode({"username": username})
        request_url += "?" + extra
    r = requests.get(request_url, headers=DB_API_HEADERS)
    flask_response = Response(response=r.content,
                              status=r.status_code)
    return flask_response

@application.route('/api/<path:other>', methods=['POST'])
@requires_auth
def other2(other):
    request_url = proxy_address + "/" + other
    try:
        json_body = request.get_json(cache=False)
    except Exception as e:
        json_body = {}
        application.logger.error(e)
        application.logger.error("Route name: %s" % other)
    username = session['profile']['username']
    if type(username) != str:
        username = username.decode('utf-8')
    json_body['username'] = username
    r = requests.post(request_url, json=json_body, headers=DB_API_HEADERS)
    flask_response = Response(response=r.content,
                              status=r.status_code)
    return flask_response

@application.route('/api/<path:other>', methods=['PATCH'])
@requires_auth
def other3(other):
    request_url = proxy_address + "/" + other
    try:
        json_body = request.get_json(cache=False)
    except Exception as e:
        json_body = {}
        application.logger.error(e)
    username = session['profile']['username']
    if type(username) != str:
        username = username.decode('utf-8')
    json_body['username'] = username
    r = requests.patch(request_url, json=json_body, headers=DB_API_HEADERS)
    flask_response = Response(response=r.content,
                              status=r.status_code)
    return flask_response


application.secret_key = '1IjhrtKRRiOeY9B'
application.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
parser = argparse.ArgumentParser()
parser.add_argument("--debug", action="store_true")
parser.add_argument('--port', default='8080', type=int)
args = parser.parse_args()
application.debug = args.debug
import logging
from logging.handlers import SysLogHandler
log_format_str = '[%(asctime)s] p%(process)s {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s'
logging.basicConfig(format=log_format_str, filename="global.log", level=logging.DEBUG)
syslog = SysLogHandler(address=('logs6.papertrailapp.com', 40729))
syslog.setLevel(logging.DEBUG)
formatter = logging.Formatter(log_format_str, '%m-%d %H:%M:%S')
fileHandler = logging.FileHandler("summary.log")
fileHandler.setLevel(logging.DEBUG)
fileHandler.setFormatter(formatter)
streamHandler = logging.StreamHandler()
streamHandler.setLevel(logging.DEBUG)
streamHandler.setFormatter(formatter)
application.logger.addHandler(fileHandler)
application.logger.addHandler(streamHandler)
application.logger.addHandler(syslog)
logging.getLogger('werkzeug').addHandler(streamHandler)
logging.getLogger('werkzeug').addHandler(syslog)
application.logger.info("Logging is set up.")
port = os.environ.get('PORT', args.port)
application.logger.info("Should be running...")

if __name__ == '__main__':
    application.run(host='0.0.0.0', port=port, threaded=True)
