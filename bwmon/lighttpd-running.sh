#!/bin/sh
psValue=$(ps aux | grep -c 'lighttpd -f')
if [ "$psValue" = "2" ]; then
	echo 'true'
else
	echo 'false'
fi
