#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

startup=$(nvram get rc_startup)
if [ "$startup" = "sleep 120;$SCRIPT_DIR/start.sh auto" ]; then
    $SCRIPT_DIR/bwmon.sh setup
fi
