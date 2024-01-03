import json
import os
import logging
import sys
from time import sleep
from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan
from datetime import date, time, datetime
from itertools import islice, chain

es_host = 'https://3e0527abba6f4453ad2f8dca4d0d2a68.us-central1.gcp.cloud.es.io:9243'
es_user = 'elastic'
es_password = 'xk2WqdH3x2xrmoDCQok7LmlL'


es = Elasticsearch(hosts=[es_host], http_auth=(es_user, es_password), use_ssl=True,
                       verify_certs=True)

c = 0
print("starting")
for doc in scan(es, index='apm-7.7.0-error-000026', scroll='5m',
                raise_on_error=True, size=100):
    print(".", end='')
    transaction = es.search(index='apm-7.7.0-transaction-000026', body={
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "query": doc['_source']['transaction']['id']
          }
        }
      ]
    }
  }
})
    if transaction['hits']['total']['value'] != 1:
      print("more than 1 hit")
    if transaction['hits']['total']['value'] >= 0:
        reindex_doc = transaction['hits']['hits'][0]
        reindex_doc['_source']['http']['response']['status_code'] = 500
        es.index(index="apm-7.7.0-transaction-000028", id=reindex_doc['_id'], body=reindex_doc['_source'])
        print(c)
    c = c+1

print(c)