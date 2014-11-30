#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Startup confirmation
echo "bandwidth monitor autobackup started use $SCRIPT_DIR/stop.sh to stop"

# Backup usage database file
while :
do
	sleep 900
	cp /tmp/www/usage.js $SCRIPT_DIR/data/usage.js
done
