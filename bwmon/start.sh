#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Load database
cp $SCRIPT_DIR/data/usage.js /tmp/www/usage.js

#copy html webgui
cp $SCRIPT_DIR/www/* /tmp/www/

# Create DNS Names from DNS Config (This maybe safely disabled if you wish to use a manual mac-names.js file)
$SCRIPT_DIR/bwmon-dnsmasq.sh

# Bandwidth Download/Upload Rate Counter
$SCRIPT_DIR/bwmon-running.sh &

# Backup usage database file
$SCRIPT_DIR/bwmon-autobackup.sh &

# Startup confirmation
echo "bandwidth monitor started use $SCRIPT_DIR/bwmon-stop.sh to stop"
