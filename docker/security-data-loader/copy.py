import argparse
import json
import datetime
import os
from dateutil import parser as dateparser


import pytz
from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk, parallel_bulk, scan
import sys

parser = argparse.ArgumentParser()
#required args
parser.add_argument('--es_host', dest='es_host', required=True)
parser.add_argument('--mode', dest='mode', required=True)
parser.add_argument('--data_folder', dest='data_folder', required=False)
#e.g. ".app-search-analytics-logs-loco_togo_production-{:%Y.%m.%d}"
parser.add_argument('--index_pattern', dest='index_pattern', required=False)

parser.add_argument('--timeout', dest='timeout', required=False, default=120,type=int)
parser.add_argument('--es_user', dest='es_user', required=False, default='elastic')
parser.add_argument('--es_password', dest='es_password', required=False, default='changeme')
parser.add_argument('--chunk_size', dest='chunk_size', default=1000, type=int)
parser.add_argument('--date_field', dest='date_field', required=False, default='@timestamp')
parser.add_argument('--date_pattern', dest='date_pattern', required=False, default="%Y-%m-%dT%H:%M:%S")
parser.add_argument('--fill_forward', dest='fill_forward', action='store_true', default=False)
parser.add_argument('--pipeline', dest='pipeline', required=False)
parser.add_argument('--threads', dest='threads', default=4, type=int)

args = parser.parse_args()

def check_file(data_file, date_field, date_pattern):
    print('Checking file %s' % data_file)
    if not os.path.isfile(data_file):
        raise Exception('File %s does not exist' % data_file)
    previous_time = pytz.utc.localize(datetime.datetime.min)
    min = 0
    with open(data_file) as input_file:
        print("Checking order of file %s" % data_file, flush=True)
        i = 0
        for line in input_file:
            doc = json.loads(line)
            if date_field in doc:
                try:
                    timestamp = datetime.datetime.strptime(doc[date_field], date_pattern).astimezone(pytz.utc)
                    if (timestamp - previous_time).total_seconds() < 0:
                        raise Exception('%s on line %s is not greater than %s on line %s' % (doc[date_field][:-9], i, previous_time.strftime(date_pattern),i-1))
                    if i == 0:
                        min = timestamp
                    previous_time = timestamp
                except Exception as e:
                    print('WARNING: Ignoring line %s due to %s'% (i, e))
            else:
                raise Exception('Date field missing from line %s' % i)
            i += 1
    print('File OK')
    return min, timestamp

def handle_data_file(data_file, date_field, date_pattern, shift_time):
    with open(data_file) as input_file:
        i = 0
        for line in input_file:
            doc = json.loads(line)
            del doc["_type"]
            try:
                timestamp = dateparser.parse(doc['_source'][date_field]) + shift_time - datetime.timedelta(hours=27, minutes=0)
                doc['_source'][date_field] = timestamp.strftime(date_pattern)
                doc['_id'] = doc['_id'] +  str(timestamp.timestamp())
                yield doc
                i += 1
            except Exception as e:
                print('WARNING: Ignoring line %s during indexing due to %s' % (i, e))

def handle_data_folder(data_folder, date_field, date_pattern, index_pattern, fill_forward):
    for data_file in os.listdir(data_folder):
        try:
            if data_file.endswith('.json'):
                shift = datetime.datetime.utcnow() - datetime.datetime.strptime( "2021-06-14T00:00:00", date_pattern).astimezone(pytz.utc).replace(tzinfo=None)
                yield from handle_data_file(os.path.join(data_folder, data_file), date_field, date_pattern, shift)
            else:
                print('Ignoring file %s' % data_file)
        except Exception as e:
            print('Invalid data file')
            print(str(e))
            sys.exit(1)



if __name__ == '__main__':

    cnt = 0
    start_date = datetime.datetime.utcnow()
    es = Elasticsearch(hosts=[args.es_host], http_auth=(args.es_user, args.es_password), use_ssl=True,
                       verify_certs=True, timeout=args.timeout, http_compress=True)
    try:
        es.info()
    except Exception as e:
        print('Unable to establish connection to Elasticsearch at %s - %s' % (args.es_host, str(e)))
        sys.exit(1)

    if args.mode == "read":
        results = scan(es,
                                             index=args.index_pattern,
                                             preserve_order=False,
                                             query={"query": {
                                                "range": {
                                                  "@timestamp": {
                                                    "gte": "2021-06-14T00:00:00+00:00",
                                                    "lte": "2021-06-21T00:00:00+00:00"
                                                  }
                                                }
                                              }},
                                             size=10000,
                                             )
        with open('./file.json', 'w') as file:
            for result in results:
                file.write(json.dumps(result))
                file.write('\n')
                cnt += 1
                if cnt % 10000 == 0:
                  print('Wrote %s documents' % str(cnt), flush=True)

    else:
        for success, info in parallel_bulk(
                  es,
                  handle_data_folder(args.data_folder, args.date_field, args.date_pattern, args.index_pattern, args.fill_forward),
                  chunk_size=args.chunk_size,
                  timeout='%ss' % args.timeout,
                  thread_count=args.threads,
                  pipeline=args.pipeline
        ):
          if success:
            cnt += 1
            if cnt % args.chunk_size == 0:

              print('Indexed %s documents' % str(cnt), flush=True)
              sys.stdout.flush()
          else:
            print('Doc failed', info, flush=True)
        print('DONE\nIndexed %s documents in %.2f seconds' % (
          cnt, (datetime.datetime.utcnow()-start_date).total_seconds()
        ), flush=True)
        print('INDEXING CYCLE COMPLETE', flush=True)
