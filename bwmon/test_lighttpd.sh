#!/bin/sh
isLighttpdEnabled() {
	psValue=$(ps | grep -c 'lighttpd -f')
	if [ "$psValue" = "2" ]; then
		echo 'true'
	else
		echo 'false'
	fi
}

echo "value: $(isLighttpdEnabled)"
if [ "$(isLighttpdEnabled)" = "true" ]; then
	echo "Lighttpd is running"
else
	echo "Lighttpd is not running"
fi
