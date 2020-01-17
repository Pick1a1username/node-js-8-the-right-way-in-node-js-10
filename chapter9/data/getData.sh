#!/bin/bash

# Chapter 5
curl -O http://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2
tar -xvjf rdf-files.tar.bz2

node rdf-to-bulk.js ../data/cache/epub/ > ../data/bulk_pg.ldj

# Chapter 6

./esclu create-index --index books

./esclu get '_cat/indices?v'

./esclu bulk ../data/bulk_pg.ldj -i books -t book > ../data/bulk_result.json

# Chapter ?

curl -s -X POST localhost:60702/api/bundle?name=test_reading

curl -s -X POST -d name=reading1 -d userKey=local-1 localhost:60702/api/bundle 

curl -s -X PUT localhost:60702/api/bundle/$BUNDLE_ID/name/foo

curl -s -X PUT localhost:60702/api/bundle/$BUNDLE_ID/book/pg132

