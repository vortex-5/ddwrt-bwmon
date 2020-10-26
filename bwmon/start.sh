#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Load database
if [ ! -d $SCRIPT_DIR/data ]
then
	mkdir $SCRIPT_DIR/data
fi

if [ -f $SCRIPT_DIR/data/usage.js ]
then
	cp $SCRIPT_DIR/data/usage.js /tmp/www/usage.js
else
	touch /tmp/www/usage.js
fi

# Temporarily all 1.6.x versions will attempt to clear the font-awsome libraries
# that are now considered depricated and unused so we can clean up the router.
if [ -d "$SCRIPT_DIR/www/font-awesome" ]
then
	rm -rf $SCRIPT_DIR/www/font-awesome
fi

# copy html webgui
if [ "$($SCRIPT_DIR/lighttpd-running.sh)" = "true" ]; then
	mkdir -p -- "/jffs/www/"
	cp -R $SCRIPT_DIR/www/* /jffs/www/
	if [ -f $SCRIPT_DIR/data/password.js ]
	then
		cp $SCRIPT_DIR/data/password.js /jffs/www/password.js
	fi
else
	cp -R $SCRIPT_DIR/www/* /tmp/www/
	if [ -f $SCRIPT_DIR/data/password.js ]
	then
		cp $SCRIPT_DIR/data/password.js /tmp/www/password.js
	fi
	ln -s /tmp/dnsmasq.conf /tmp/www/dnsmasq-conf.js
	ln -s /tmp/dnsmasq.leases /tmp/www/dnsmasq-leases.js
fi

# Publish first set of usage stats so we don't start with a blank page.
$SCRIPT_DIR/bwmon.sh publish /tmp/www/usage.js /tmp/www/usage_stats.js

# Bandwidth Download/Upload Rate Counter
$SCRIPT_DIR/bwmon.sh setup

# Setup cron job
stopservice crond
echo "* * * * * root $SCRIPT_DIR/bwmon-cron.sh" > /tmp/cron.d/bwmon_cron
echo "*/15 * * * * root $SCRIPT_DIR/backup.sh" >> /tmp/cron.d/bwmon_cron
startservice crond
echo "Cron Job Added Successfully DDWRT-BWMON is now running in the background."

# Setup resume on reboot
if [ "$1" != "auto" ]; then
nvram set rc_startup="sleep 120;$SCRIPT_DIR/start.sh auto"
nvram set rc_shutdown="$SCRIPT_DIR/stop.sh auto"
nvram set rc_firewall="$SCRIPT_DIR/firewall.sh"
nvram commit

echo "Startup job set the router will auto-start this script on every reboot."
fi

echo "To stop use $SCRIPT_DIR/stop.sh"
