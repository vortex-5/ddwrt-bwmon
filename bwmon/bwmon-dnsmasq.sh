#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

DNS_CONF=/tmp/dnsmasq.conf
DYNAMIC_FILE=/tmp/www/mac-names.js

echo "var MAC_NAMES = {" > $DYNAMIC_FILE

cat $DNS_CONF | while IFS='=' read OPTION VALUE
do
	if [ "$OPTION" == "dhcp-host" ]; then
		echo "$VALUE" | while IFS=',' read MAC NAME IP LEASETIME
		do
			echo "'$MAC': '$NAME'," >> $DYNAMIC_FILE
		done 
	fi
done
echo "'DUMMY': 'DUMMY'" >> $DYNAMIC_FILE
echo "};" >> $DYNAMIC_FILE