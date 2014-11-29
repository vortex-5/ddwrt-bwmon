#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Backup the DB immediately
cp /tmp/www/usage.db $SCRIPT_DIR/usage.db

echo 'backup completed'
