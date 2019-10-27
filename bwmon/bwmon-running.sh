#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

LIGHTTPD_RUNNING_CYCLE_TIME=60
LIGHTTPD_NOT_RUNNING_CYCLE_TIME=10

BACKUP_TIME=900
CURRENT_TIME=0

autoBackup() {
	CURRENT_TIME=$((${CURRENT_TIME} + ${CYCLE_TIME}))
	
	if [ "$CURRENT_TIME" -ge "$BACKUP_TIME" ]; then
		CURRENT_TIME=0
		cp /tmp/www/usage.js $SCRIPT_DIR/data/usage.js
	fi
}

if [ "$($SCRIPT_DIR/lighttpd-running.sh)" = "true" ]; then
	CYCLE_TIME=$LIGHTTPD_RUNNING_CYCLE_TIME
else
	CYCLE_TIME=$LIGHTTPD_NOT_RUNNING_CYCLE_TIME
fi

# Startup confirmation
printf "\nbandwidth monitor running with cycle time of $CYCLE_TIME\n"
printf "use $SCRIPT_DIR/stop.sh to stop\n"

# Bandwidth Download/Upload Rate Counter
while :
do
	$SCRIPT_DIR/bwmon.sh setup
	$SCRIPT_DIR/bwmon.sh read
	sleep $CYCLE_TIME
	$SCRIPT_DIR/bwmon.sh update /tmp/www/usage.js
	$SCRIPT_DIR/bwmon.sh publish /tmp/www/usage.js /tmp/www/usage_stats.js
	autoBackup
done
