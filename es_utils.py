from elasticsearch import Elasticsearch
from queue import Queue
from threading import Thread
import datetime
import os
import time

# We make this asynchronous so that it doesn't impede on annotation speed.
# adapted from mathpix/mathpix's code at mathpix/ocr/es_utils.py (ES async logging for training)

_queue = Queue(maxsize=0)
_num_threads = 2


ELASTICSEARCH_URL = os.environ['ZENPIX_ELASTICSEARCH_URL']


def _worker_func(queue, worker_id):
    es = Elasticsearch(ELASTICSEARCH_URL)
    while True:
        body= queue.get()
        fail = False
        try:
            tic = time.time()
            es.index('zenpix', body=body)
            toc = time.time()
            print("Worker {} ES log time: ".format(worker_id), toc-tic)
        except Exception as e:
            print("worker {} Failed to index to ElasticSearch:  ".format(worker_id), e)
        queue.task_done()


def log(d):
    """ logs to ES 'zenpix' data. adds 'timestamp' field automatically.
    """
    d['timestamp'] = datetime.datetime.now(tz=datetime.timezone.utc)
    _queue.put(d)

# initialization
for i in range(_num_threads):
    worker = Thread(target=_worker_func, args=(_queue, i))
    worker.setDaemon(True)
    worker.start()
