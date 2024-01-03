#!/bin/bash

set -ex

if [[ -z "${AS_BASE_URL}" ]]; then
  echo "The environment variable AS_BASE_URL must be set to run the container."
  exit 1
fi

if [[ -z "${ENGINE_NAME}" ]]; then
  echo "The environment variable ENGINE_NAME must be set to run the container."
  exit 1
fi

if [[ -z "${AS_USERNAME}" ]] || [[ -z "${AS_PASSWORD}" ]]; then
    echo "The environment variable AS_USERNAME and AS_PASSWORD must be set to run the container"
    exit 1;
fi

fullpath=$(realpath $0)
script_dir=$(dirname $fullpath)
source $script_dir/retrieve-credentials.sh

if [[ -z "${AS_PRIVATE_API_KEY}" ]]; then
    echo "Unable to retrieve App Admin credentials."
    exit 1;
fi

echo "Configuring Synonyms for ${ENGINE_NAME} engine"

curl -X POST "${AS_BASE_URL}/api/as/v1/engines/${ENGINE_NAME}/synonyms" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AS_PRIVATE_API_KEY}" \
-d '{
  "synonyms": ["pant", "trouser", "knickers", "slacks"]
}'

curl -X POST "${AS_BASE_URL}/api/as/v1/engines/${ENGINE_NAME}/synonyms" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AS_PRIVATE_API_KEY}" \
-d '{
  "synonyms": ["high heel", "pump", "stiletto", "pins"]
}'

curl -X POST "${AS_BASE_URL}/api/as/v1/engines/${ENGINE_NAME}/synonyms" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AS_PRIVATE_API_KEY}" \
-d '{
  "synonyms": ["shirt", "blouse", "gown"]
}'

echo "Configuring Weights for ${ENGINE_NAME} engine"

curl -X PUT "${AS_BASE_URL}/api/as/v1/engines/${ENGINE_NAME}/search_settings" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AS_PRIVATE_API_KEY}" \
-d '{
  "search_fields": {
    "category": {
      "weight": 3.4
    },
    "colors": {
      "weight": 1
    },
    "department": {
      "weight": 2.4
    },
    "description": {
      "weight": 1
    },
    "details": {
      "weight": 1
    },
    "fit": {
      "weight": 1
    },
    "images": {
      "weight": 1
    },
    "name": {
      "weight": 5.8
    },
    "on_sale": {
      "weight": 1
    },
    "sizes": {
      "weight": 1
    }
  }
}'