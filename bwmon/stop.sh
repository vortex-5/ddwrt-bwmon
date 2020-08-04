#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Terminate the bandwidth monitor
ps | grep bwmon-running.sh | grep -v grep | awk '{print $1}' | xargs -r kill -9
ps | grep bwmon-autobackup.sh | grep -v grep | awk '{print $1}' | xargs -r kill -9
ps | grep bwmon.sh | grep -v grep | awk '{print $1}' | xargs -r kill -9
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
rm mac-names.js
rm ui-bootstrap-tpls.min.js
rm dnsmasq-conf.js
rm dnsmasq-leases.js
rm password.js
rm bwreader.cgi
rm bwreset.cgi
# End Cleanup WebGUI

# font-awesome is now depricated we should attempt to remove it.
rm -rf font-awesome

# clear ip tables
$SCRIPT_DIR/clear-iptables.sh

# remove cron job
stopservice crond
rm /tmp/cron.d/bwmon_cron
startservice crond
echo "Cron job removed successfully"

# User confirmation
echo 'bandwidth monitor shutdown completed'
