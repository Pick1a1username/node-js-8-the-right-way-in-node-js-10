#!/bin/bash

declare -r CURRENT_DIR="$(pwd)"
declare -r SOURCE_DATA="http://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2"
declare -r SOURCE_DATA_FILENAME=$(echo ${SOURCE_DATA} | awk -F"/" '{ print $NF }')
declare -r SOURCE_DATA_EPUB="cache/epub"
declare -r RDF_TO_BULK="../databases/rdf-to-bulk.js"
declare -r BULK_DATA="bulk_pg.ldj"
declare -r ES_URL=""


function download_source_data {
  curl -s -O ${SOURCE_DATA}
  return $?
}

function extract_source_data {
  # Extract the data.
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
  cd $(dirname ${RDF_TO_BULK})

  node $(echo ${RDF_TO_BULK} | awk -F"/" '{ print $NF }') ${CURRENT_DIR}/${SOURCE_DATA_EPUB} > ${CURRENT_DIR}/${BULK_DATA}

  return $?
}



function main {
  if [ ! -f "${SOURCE_DATA}" ]; then
    echo "Downloading source data..."

    download_source_data

    if [ "$?" != "0" ]; then
      echo "Something went wrong!"
      exit 1
    fi
  fi

  if [ ! -f "${SOURCE_DATA_FILENAME}" ]; then
    echo "Extracting source data..."

    extract_source_data

    if [ "$?" != "0" ]; then
      echo "Something went wrong!"
      exit 1
    fi
  fi

  if [ ! -f "${BULK_DATA}" ]; then
    echo "Generating bulk data..."

    generate_bulk_data

    if [ "$?" != "0" ]; then
      echo "Something went wrong!"
      exit 1
    fi
}


main