#!/bin/bash

mkdir imgdb
 jq -c -r '.[] | "\(.id) \(.photoURL)"' offenders_database.json | 
 while read id url; \
   do wget -nc -O ./imgdb/$id.jpg $url; \
 done

