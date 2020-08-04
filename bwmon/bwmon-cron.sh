#!/bin/sh
#Run this on a cron job if you don't care about real time
#traffic logging.
#
# Note this should be run every minute in a cron job to ensure accuracy
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

$SCRIPT_DIR/bwmon.sh update /tmp/www/usage.js
$SCRIPT_DIR/bwmon.sh publish /tmp/www/usage.js /tmp/www/usage_stats.js
$SCRIPT_DIR/bwmon.sh read

cp /tmp/www/usage.js $SCRIPT_DIR/data/usage.js