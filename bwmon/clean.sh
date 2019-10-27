#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

psValue=$(ps | grep -c 'bwmon-running.sh')
if [ "$psValue" = "2" ]; then
	isRunning="true"
	echo 'Monitor currently running'
fi

if [ "$isRunning" = "true" ]; then
	$SCRIPT_DIR/stop.sh > /dev/null
	echo 'Bandwidth monitoring stopped'
	sleep 3
fi

# clean database
echo 'Clearing bandwidth stats'
rm "$SCRIPT_DIR/data/usage.js" 
rm /tmp/www/usage.js
rm /tmp/www/usage_stats.js
rm /tmp/traffic_*.tmp
rm /tmp/sorted_*.tmp
sleep 1

if [ "$isRunning" = "true" ]; then
	echo 'Restarting bandwidth monitoring'
	$SCRIPT_DIR/start.sh > /dev/null
fi
