from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
import json


client = Elasticsearch(hosts=['https://36c3850b05a44cf2b64dc055759ece3b.us-central1.gcp.cloud.es.io'], http_auth=('elastic', 'l8eTbK00vTmhWD9sKHWbuilW'), port=9243)

s = Search(using=client, index="apm-*") \
    .filter("range", ** {'@timestamp': {'gte': 'now-10000m'}}) \
    .query("match", **{"service.name": "emailService"})

s.aggs.bucket('per_version', 'terms', field='service.version') \
    .metric('response_time', 'avg', field='transaction.duration.us')

response = s.execute()

response_time_before = 0
response_time_now = 0

for version in response.aggregations.per_version.buckets:
  if(version.key == '1.6'):
    response_time_now = version.response_time.value
  if(version.key == '1.7'):
    response_time_before = version.response_time.value

print('Response time now: ', response_time_now)
print('Response time before: ', response_time_before)
