#!/bin/bash

set -ex

if [[ -z "${AS_BASE_URL}" ]]; then
  echo "The environment variable AS_BASE_URL must be set to run the container."
  exit 1
fi

if [[ -z "${PRODUCT_ENGINE_NAME}" ]]; then
  echo "The environment variable PRODUCT_ENGINE_NAME must be set to run the container."
  exit 1
fi

if [[ -z "${KB_ENGINE_NAME}" ]]; then
  echo "The environment variable KB_ENGINE_NAME must be set to run the container."
  exit 1
fi

if [[ -z "${KB_URL}" ]]; then
  echo "The environment variable KB_URL must be set to run the container."
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

#write to public config
echo "{\"apmServerUrl\": \"${GATSBY_ELASTIC_APM_SERVER_URLS}\",\"endpointBase\": \"${AS_BASE_URL}\",\"searchKey\": \"${AS_SEARCH_API_KEY}\",\"kbUrl\":\"${KB_URL}\",\"engineNames\": { \"products\": \"${PRODUCT_ENGINE_NAME}\", \"kb\": \"${KB_ENGINE_NAME}\"}}" | jq '.' > /usr/src/eas-ecom-demo/public/config/credentials.json
gatsby serve -H 0.0.0.0