#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Backup the DB immediately
cp /tmp/www/usage.js $SCRIPT_DIR/data/usage.js

echo 'backup completed'
