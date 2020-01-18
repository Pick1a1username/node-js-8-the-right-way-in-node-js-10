#!/bin/bash

cd data
./import_data.sh

cd -
cd b4-app
npm start
