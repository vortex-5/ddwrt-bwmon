#!/bin/sh
psValue=$(ps | grep -c 'lighttpd -f')
if [ "$psValue" = "2" ]; then
	printf "true\n"
else
	printf "false\n"
fi