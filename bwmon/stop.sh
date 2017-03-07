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

rm angular.min.js
rm arrow-left.png
rm bootstrap.min.css
rm bwmon.css
rm bwmon.html
rm bwmon.js
rm bwmondark.css
rm bwreader.php
rm mac-names.js
rm ui-bootstrap-tpls.min.js
rm dnsmasq-conf.js
rm dnsmasq-leases.js
# End Cleanup WebGUI

# font-awesome is now depricated we should attempt to remove it.
rm -rf font-awesome


# User confirmation
echo 'bandwidth monitor shutdown completed'
