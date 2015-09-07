#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

LIGHTTPD_RUNNING_CYCLE_TIME=10 #Should be 300 but temporarily set to same value as not running for testing
LIGHTTPD_NOT_RUNNING_CYCLE_TIME=10

if [ "$($SCRIPT_DIR/lighttpd-running.sh)" = "true" ]; then
	CYCLE_TIME=$LIGHTTPD_RUNNING_CYCLE_TIME
else
	CYCLE_TIME=$LIGHTTPD_NOT_RUNNING_CYCLE_TIME
fi

# Startup confirmation
echo "bandwidth monitor started with cycle time of $CYCLE_TIME use $SCRIPT_DIR/stop.sh to stop"

# Bandwidth Download/Upload Rate Counter
while :
do
	$SCRIPT_DIR/bwmon.sh setup
	$SCRIPT_DIR/bwmon.sh read
	sleep $CYCLE_TIME
	$SCRIPT_DIR/bwmon.sh update /tmp/www/usage.js
	$SCRIPT_DIR/bwmon.sh publish /tmp/www/usage.js /tmp/www/usage_stats.js
done
