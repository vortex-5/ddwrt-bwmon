#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

psValue=$(ps | grep -c 'bwmon-running.sh')
if [ "$psValue" = "2" ]; then
    echo 'bwmon is already running no need to do anything.'
else
	echo 'restarting bwmon...'
    # Restart the router monitoring script
    $SCRIPT_DIR/startup.sh
fi