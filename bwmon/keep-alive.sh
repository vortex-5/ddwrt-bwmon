#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

psValue=$(ps | grep -c 'bwmon-running.sh')
if [ "$psValue" = "2" ]; then
    printf "bwmon is already running no need to do anything.\n"
else
	printf "restarting bwmon...\n"
    # Restart the router monitoring script
    $SCRIPT_DIR/startup.sh
fi