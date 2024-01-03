#!/usr/bin/env bash
wget https://storage.googleapis.com/eden-files/security-ransomware/logs-baseline.tar.gz
tar -xzvf logs-baseline.tar.gz

curl -XPUT -u ${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD} ${ELASTICSEARCH_URL}/.ds*/_settings -H 'Content-Type: application/json' -d'
{
  "default_pipeline": null
}'

python3 /etc/copy.py --es_host=${ELASTICSEARCH_URL} --es_password ${ELASTICSEARCH_PASSWORD} --es_user=${ELASTICSEARCH_USERNAME} --mode=write --data_folder="./" --chunk_size 1000


