#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Terminate pervious session
$SCRIPT_DIR/stop.sh

# Give the router some time to get the dnsmasq configuration up
sleep 10

# Start new session
$SCRIPT_DIR/start.sh
