#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Startup confirmation
echo "bandwidth monitor started use $SCRIPT_DIR/stop.sh to stop"

# Bandwidth Download/Upload Rate Counter
while :
do
	$SCRIPT_DIR/bwmon.sh setup
	$SCRIPT_DIR/bwmon.sh read
	sleep 10
	$SCRIPT_DIR/bwmon.sh update /tmp/www/usage.js
	$SCRIPT_DIR/bwmon.sh publish /tmp/www/usage.js /tmp/www/usage_stats.js
done
