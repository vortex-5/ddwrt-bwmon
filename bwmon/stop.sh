#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Terminate the bandwidth monitor
killall bwmon-running.sh
killall bwmon-autobackup.sh
killall bwmon.sh
killall sleep

# Backup the DB immediately
$SCRIPT_DIR/backup.sh

# Begin Cleanup the WebGUI
if [ "$($SCRIPT_DIR/lighttpd-running.sh)" = "true" ]; then
    cd /jffs/www
else
    cd /tmp/www
fi
rm -rf font-awesome/
rm angular.min.js
rm arrow-left.png
rm bootstrap.min.css
rm bwmon.css
rm bwmon.html
rm bwmon.js
rm bwreader.php
rm mac-names.js
rm ui-bootstrap-tpls.min.js
# End Cleanup WebGUI


# User confirmation
echo 'bandwidth monitor shutdown completed'
