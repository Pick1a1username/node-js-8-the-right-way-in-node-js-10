#!/bin/bash

declare -r CURRENT_DIR="$(pwd)"
declare -r SOURCE_DATA="http://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2"
declare -r SOURCE_DATA_FILENAME=$(echo ${SOURCE_DATA} | awk -F"/" '{ print $NF }')
declare -r SOURCE_DATA_EPUB="cache/epub"
declare -r RDF_TO_BULK="../databases/rdf-to-bulk.js"
declare -r BULK_DATA="bulk_pg.ldj"
declare -r ES_SERVER="es"
declare -r ESCLU="../esclu/esclu"

function check_exit_code {
  local exit_code="$?"
  if [ "${exit_code}" != "0" ]; then
    echo "Something went wrong! Exit code: ${exit_code}"
    exit 1
  fi
}

function download_source_data {
  curl -s -O ${SOURCE_DATA}
  return $?
}

function extract_source_data {
  # Extract the data.
  echo ${SOURCE_DATA_FILENAME}
  tar -xvjf ${SOURCE_DATA_FILENAME}

  # Todo: Return the exit code of tar.
  if [ "$?" != "0" ]; then
    return 1
  fi

  # Verify the data.
  # Todo: Return something meaningful.
  if [ ! -d  "${SOURCE_DATA_EPUB}" ]; then
    return 1
  fi
}

function generate_bulk_data {
  local exit_code=""

  cd $(dirname ${RDF_TO_BULK})

  # node $(echo ${RDF_TO_BULK} | awk -F"/" '{ print $NF }') ${CURRENT_DIR}/${SOURCE_DATA_EPUB} > ${CURRENT_DIR}/${BULK_DATA}
  node rdf-to-bulk.js ${CURRENT_DIR}/${SOURCE_DATA_EPUB} > ${CURRENT_DIR}/${BULK_DATA}

  exit_code="$?"

  cd ${CURRENT_DIR}

  return ${exit_code}
}

function main {
  if [ ! -d "${SOURCE_DATA_EPUB}" ]; then
    echo "Downloading source data..."

    download_source_data

    check_exit_code

    echo "Extracting source data..."

    extract_source_data

    check_exit_code
  fi

  if [ ! -f "${BULK_DATA}" ]; then
    echo "Generating bulk data..."

    generate_bulk_data

    check_exit_code
  fi

  if [ ! -f "${ESCLU}" ]; then
    echo "esclu doesn't exist!"

    exit 1
  fi

  # exit 1

  echo "Checking ElasticSearch working..."
  ${ESCLU} -o ${ES_SERVER} get '_cat/indices?v'

  echo "Creating an index named 'books'..."
  ${ESCLU} -o ${ES_SERVER} create-index --index books

  echo "Importing bulk data..."
  ${ESCLU} -o ${ES_SERVER} bulk bulk_pg.ldj -i books -t book > bulk_result.json

}


main