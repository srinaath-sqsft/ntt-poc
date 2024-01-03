import os


class Config(object):
    ELASTICSEARCH_HOST = os.environ.get('ES_HOST') or 'http://localhost:9200'
    ELASTICSEARCH_USER = os.environ.get('ES_USER') or 'elastic'
    ELASTICSEARCH_PASSWORD = os.environ.get('ES_PWD') or 'changeme'
    CORS_HEADERS = os.environ.get('CORS_HEADERS') or 'Content-Type'
    K_RESULTS = int(os.environ.get('K_RESULTS')) or 5
