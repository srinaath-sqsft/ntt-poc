#!/usr/bin/env bash

if [[ -z "${ELASTICSEARCH_URL}" ]]; then
  echo "The environment variable ELASTICSEARCH_URL must be set to run the container."
  exit 1
fi


if [[ -z "${ELASTICSEARCH_PASSWORD}" ]]; then
  echo "The environment variable ELASTICSEARCH_PASSWORD must be set to run the container."
  exit 1
fi

if [[ -z "${ENGINE_NAME}" ]]; then
  echo "The environment variable ENGINE_NAME must be set to run the container."
  exit 1
fi

export INGEST_PIPELINE="set_engine_id_${ENGINE_NAME}"
ENGINE_ID=$(curl -s "${ELASTICSEARCH_URL}/.ent-search-actastic-engines*/_search?q=name:${ENGINE_NAME}&_source_includes=_id" -u "elastic:${ELASTICSEARCH_PASSWORD}" | jq -r '.hits.hits[0]._id')
curl -s -XPUT "${ELASTICSEARCH_URL}/_ingest/pipeline/${INGEST_PIPELINE}" -u "elastic:${ELASTICSEARCH_PASSWORD}" -H 'Content-Type: application/json' -d"{\"processors\":[{\"set\":{\"field\":\"labels.engine_id\",\"value\":\"${ENGINE_ID}\"}},{\"set\":{\"field\":\"event.created\",\"value\":\"{{ @timestamp }}\"}},{\"append\":{\"field\":\"event.tags\",\"value\":[\"${ENGINE_NAME}\"]}}]}"

#turn off onboarding
curl -u "elastic:${ELASTICSEARCH_PASSWORD}" -X POST "${ELASTICSEARCH_URL}/.ent-search-actastic-app_search_accounts_v*/_update_by_query?refresh=true" -H "Content-Type: application/json" -d '{ "script": { "source": "ctx._source.onboarding_state = \"complete\"", "lang": "painless" }, "query": { "exists": { "field": "onboarding_state" } } }'


/etc/docker-entrypoint.sh

