#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Load database
cp "$SCRIPT_DIR/usage.db" /tmp/usage.db

# Bandwidth Download/Upload Rate Counter
$SCRIPT_DIR/bwmon-running.sh &

# Backup usage database file
$SCRIPT_DIR/bwmon-autobackup.sh &

# Startup confirmation
echo "bandwidth monitor started use $SCRIPT_DIR/bwmon-stop.sh to stop"
