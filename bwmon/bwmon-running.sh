#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Startup confirmation
echo "bandwidth monitor started use $SCRIPT_DIR/stop.sh to stop"

# Bandwidth Download/Upload Rate Counter
while :
do
	$SCRIPT_DIR/wrtbwmon setup
	$SCRIPT_DIR/wrtbwmon read
	sleep 9
	$SCRIPT_DIR/wrtbwmon update /tmp/usage.db
	$SCRIPT_DIR/wrtbwmon publish /tmp/www/usage.db /tmp/www/usage.html $SCRIPT_DIR/MAC-PCname.txt
done
