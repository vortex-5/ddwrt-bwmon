#!/bin/sh
SCRIPT_DIR=$(dirname ${0})
SCRIPT_DIR=$(cd ${SCRIPT_DIR} && pwd)

# Create folder that the password file lives in
if [ ! -d $SCRIPT_DIR/data ]
then
	mkdir $SCRIPT_DIR/data
fi

echo 'Please type your password below or leave blank and press enter for no password (default).'

read password
if [ "$password" = "" ]
then
	echo "Password has been cleared."
	printf "window.serverPasswordHash='';\n" > $SCRIPT_DIR/data/password.js
else
	SHA256HASH_RAW=$(printf "$password" | openssl dgst -sha256)
	SHA256HASH=${SHA256HASH_RAW:9}
	printf "window.serverPasswordHash='$SHA256HASH';\n" > $SCRIPT_DIR/data/password.js
	echo 'Your selected password has been set.'
fi

echo 'Please restart the server for your changes to take effect.'