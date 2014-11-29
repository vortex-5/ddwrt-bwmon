#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# clean database
rm "$SCRIPT_DIR/usage.db" 
rm /tmp/www/usage.db
