#!/bin/bash

set -e

export AS_BASE_URL=${AS_BASE_URL:-"http://localhost:3002"}

#These may be potentially different if AS_BASE_URL is public and behind SAML (api addresses still exposed over key auth). AS_CREDS_URL can represent an internal connection address.
if [[ -z "${AS_CREDS_URL}" ]]; then
  echo "AS_CREDS_URL not set so using AS_BASE_URL"
  export AS_CREDS_URL=$AS_BASE_URL
fi

function wait_for_as {
  local continue=1
  set +e
  while [ $continue -gt 0 ]; do
    curl --connect-timeout 5 --max-time 10 --retry 10 --retry-delay 0 --retry-max-time 120 --retry-connrefuse -s -o /dev/null ${AS_CREDS_URL}/swiftype-app-version
    continue=$?
    if [ $continue -gt 0 ]; then
      sleep 1
    fi
  done
  set -e
}

function get_search_key () {
  local AS_USERNAME=${AS_USERNAME:-"enterprise_search"}
  local AS_PASSWORD=${AS_PASSWORD:-"password"}
  local AS_CREDS_URL=${AS_CREDS_URL:-"http://localhost:3002"}
  local SEARCH_URL="${AS_CREDS_URL}/api/as/v1/credentials"
  response_read=$(curl -w "%{http_code}" -u ${AS_USERNAME}:${AS_PASSWORD} -s "${SEARCH_URL}/skey")
  http_code_read=${response_read: -3}
  if [ $http_code_read -eq 200 ]; then
	  export AS_SEARCH_API_KEY=$(echo $response_read | sed 's/^.*\"key\":\"\([^\"]*\).*$/\1/')
  elif [ $http_code_read -eq 404 ]; then
    response_write=$(curl -X POST -H "Content-Type: application/json" -s -u ${AS_USERNAME}:${AS_PASSWORD} -d '{"name": "skey", "type": "search", "access_all_engines": True}' ${SEARCH_URL})
    export AS_SEARCH_API_KEY=$(echo $response_write | sed 's/^.*\"key\":\"\([^\"]*\).*$/\1/')
    $(curl -X DELETE -H "Content-Type: application/json" -s -u ${AS_USERNAME}:${AS_PASSWORD} "${SEARCH_URL}/search-key")
  else
    return 1
  fi
}

function get_private_key () {
  local AS_USERNAME=${AS_USERNAME:-"enterprise_search"}
  local AS_PASSWORD=${AS_PASSWORD:-"password"}
  local AS_CREDS_URL=${AS_CREDS_URL:-"http://localhost:3002"}
  local SEARCH_URL="${AS_CREDS_URL}/api/as/v1/credentials"

  response_read=$(curl -w "%{http_code}" -u ${AS_USERNAME}:${AS_PASSWORD} -s "${SEARCH_URL}/pkey")
  http_code_read=${response_read: -3}
  if [ $http_code_read -eq 200 ]; then
	  export AS_PRIVATE_API_KEY=$(echo $response_read | sed 's/^.*\"key\":\"\([^\"]*\).*$/\1/')
  elif [ $http_code_read -eq 404 ]; then
    response_write=$(curl -X POST -H "Content-Type: application/json" -s -u ${AS_USERNAME}:${AS_PASSWORD} -d '{"name": "pkey", "type": "private", "read": True, "write": True, "access_all_engines": True}' ${SEARCH_URL})
    export AS_PRIVATE_API_KEY=$($response_write | sed 's/^.*\"key\":\"\([^\"]*\).*$/\1/')
    $(curl -X DELETE -H "Content-Type: application/json" -s -u ${AS_USERNAME}:${AS_PASSWORD} "${SEARCH_URL}/private-key")
  else
    return 1
  fi
}

echo "Waiting for App Search to be started..."
wait_for_as

echo "Retrieve Private API key ..."
for i in {1..5}; do get_private_key && break || echo "Retry private API key ..." && sleep 30; done

echo "Retrieve Search API key ..."
for i in {1..5}; do get_search_key && break || echo "Retry search API key ..." && sleep 30 ; done

