#!/bin/sh
psValue=$(ps | grep -c 'lighttpd -f')
if [ "$psValue" = "2" ]; then
	echo 'true'
else
	echo 'false'
fi