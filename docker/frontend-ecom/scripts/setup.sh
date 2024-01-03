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

node seed.js products.json ./static/config/schema.json