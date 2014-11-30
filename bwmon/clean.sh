#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# clean database
rm "$SCRIPT_DIR/data/usage.js" 
rm /tmp/www/usage.js
rm /tmp/www/usage_stats.js
rm /tmp/traffic_55.tmp
rm /tmp/traffic_66.tmp
rm /tmp/sorted_$$.tmp
