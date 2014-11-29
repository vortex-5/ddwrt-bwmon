#!/bin/sh

# Directory the installer is stored
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

chmod +x "$SCRIPT_DIR/startup.sh"
chmod +x "$SCRIPT_DIR/start.sh"
chmod +x "$SCRIPT_DIR/stop.sh"
chmod +x "$SCRIPT_DIR/backup.sh"
chmod +x "$SCRIPT_DIR/bwmon-running.sh"
chmod +x "$SCRIPT_DIR/bwmon-autobackup.sh"
chmod +x "$SCRIPT_DIR/usage.sh"
chmod +x "$SCRIPT_DIR/wrtbwmon"

# Setup mypage
nvram set mypage_scripts="$SCRIPT_DIR/usage.sh"
nvram commit

# confirmation
echo 'installation completed'
