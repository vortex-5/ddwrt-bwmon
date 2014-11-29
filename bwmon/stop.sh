#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Terminate the bandwidth monitor
killall bwmon-running.sh
killall bwmon-autobackup.sh
killall sleep

# Backup the DB immediately
$SCRIPT_DIR/backup.sh

# User confirmation
echo 'bandwidth monitor shutdown completed'
