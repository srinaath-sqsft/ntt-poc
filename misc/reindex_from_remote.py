import json
import os
import logging
import sys
from time import sleep
from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan, parallel_bulk
from datetime import date, time, datetime
from itertools import islice, chain


# luca.wintergerst rum cluster
# es_host = 'https://89e26e6c71e74acc8556ede79344b199.europe-west1.gcp.cloud.es.io:9243'
# es_user = 'elastic'
# es_password = '8LLk7XuqxV8v7e6ympJ6s7dO'

#dev next
es_host = 'https://f42082887b4e4520a53204a4d4907ee7.us-east-1.aws.staging.foundit.no:9243'
es_user = 'elastic'
es_password = 'SYQq7VuMJAkN1I4kz7T2jDd1'


es = Elasticsearch(hosts=[es_host], http_auth=(es_user, es_password), use_ssl=True,
                       verify_certs=True, http_compress=True)


es_dest_host = 'https://d9d774c648ea46b8b3e66fa1745cb6c6.europe-west1.gcp.cloud.es.io:9243'
es_dest_user = 'elastic'
es_dest_password = 'jI57xgodYsuzuZdBfHX5F6Io'


es_dest = Elasticsearch(hosts=[es_dest_host], http_auth=(es_dest_user, es_dest_password), use_ssl=True,
                       verify_certs=True, http_compress=True)

print("starting")

def read():
    c = 0
    for doc in scan(es, timeout=None, request_timeout=100,
                    index='apm-8.0.0-span-2020.10.02-000001,apm-8.0.0-transaction-2020.10.02-000001,apm-8.0.0-metric-2020.10.02-000001,apm-8.0.0-error-2020.10.02-000001',
                    scroll='1m',
                    raise_on_error=True, size=4000, query={
                "query": {
                    "bool": {
                        "must": [
                            {"query_string": {"query": "agent.name: rum-js"}},
                            {"range": {"@timestamp": {"gt": "2020-10-14T00:00:00", "lte": "2020-10-21T00:00:00"}}},
                            {"exists": {"field": "trace.id"}},
                            {
                                "script": {
                                    "script": {
                                        "source": "doc['trace.id'].value.endsWith('d')", "lang": "painless"
                                    }
                                }
                            }
                        ]
                    }
                }
            }):

        c = c+1
        if c%1000 == 0:
            print(c)
        doc["_type"] = "_doc"
        #doc["_source"]["event"]["outcome"] = "success"
        yield doc


for success, info in parallel_bulk(es_dest, read(), thread_count=4, chunk_size=1000, ):
    if not success:
        print('A document failed:', info)