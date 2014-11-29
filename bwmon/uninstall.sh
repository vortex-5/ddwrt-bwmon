#!/bin/sh

# Directory the installer is stored
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# remove mypage
nvram unset mypage_scripts="$SCRIPT_DIR/usage.sh"
nvram commit

# confirmation
echo 'removal completed'
