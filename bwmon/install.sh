#!/bin/sh

# Directory the installer is stored
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

chmod +x "$SCRIPT_DIR/startup.sh"
chmod +x "$SCRIPT_DIR/start.sh"
chmod +x "$SCRIPT_DIR/stop.sh"
chmod +x "$SCRIPT_DIR/backup.sh"
chmod +x "$SCRIPT_DIR/clean.sh"
chmod +x "$SCRIPT_DIR/bwmon-running.sh"
chmod +x "$SCRIPT_DIR/bwmon-autobackup.sh"
chmod +x "$SCRIPT_DIR/bwmon.sh"
chmod +x "$SCRIPT_DIR/lighttpd-running.sh"

# confirmation
echo "Installation completed."
echo "Type $SCRIPT_DIR/startup.sh to start the script"
echo "You can visit the stats page by navigating to http://routerip/user/bwmon.html"
