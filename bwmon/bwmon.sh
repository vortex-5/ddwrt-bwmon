#!/bin/sh
#
# Traffic logging tool for OpenWRT-based routers
#
# Created by Emmanuel Brucy (e.brucy AT qut.edu.au)
#
# Based on work from Fredrik Erlandsson (erlis AT linux.nu)
# Based on traff_graph script by twist - http://wiki.openwrt.org/RrdTrafficWatch
# 
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# Modified by Chee Kok Aun (RemoveThisSpamProtectionwolfkodi AT gmail DOT com)
# to calculate live traffic in 10 seconds intervals.

WAN_IFACE=$(nvram get wan_ifname)

fixValue()
{
	if [ -z "$1" ]
	then
		fixedValue="0"
	else
		fixedValue="$1"
	fi
}

case ${1} in

"setup" )

	#Create the BWMON CHAIN (it doesn't matter if it already exists).
	iptables -N BWMON 2> /dev/null

	#Add the BWMON CHAIN to the FORWARD chain (if non existing).
	iptables -L FORWARD --line-numbers -n | grep "BWMON" | grep "1" > /dev/null
	if [ $? -ne 0 ]; then
		iptables -L FORWARD -n | grep "BWMON" > /dev/null
		if [ $? -eq 0 ]; then
			echo "DEBUG : iptables chain misplaced, recreating it..."
			iptables -D FORWARD -j BWMON
		fi
		iptables -I FORWARD -j BWMON
	fi

	#For each host in the ARP table
	grep -v ${WAN_IFACE} /proc/net/arp | grep -v IP | while read IP TYPE FLAGS MAC MASK IFACE
	do
		#Add iptable rules (if non existing).
		iptables -nL BWMON | grep "${IP} " > /dev/null
		if [ $? -ne 0 ]; then
			iptables -I BWMON -d ${IP} -j RETURN
			iptables -I BWMON -s ${IP} -j RETURN
		fi
	done	
	;;

"read" )

	#Read counters
	iptables -L BWMON -vnx > /tmp/traffic_pre.tmp
	;;

"update" )

	[ -z "${2}" ] && echo "ERROR : Missing argument 2" && exit 1

	# Uncomment this line if you want to abort if database not found
	# [ -f "${2}" ] || exit 1
		
	#Read and reset counters
	iptables -L BWMON -vnxZ > /tmp/traffic_post.tmp

	grep -v "0x0" /proc/net/arp | grep -v ${WAN_IFACE} | grep -v IP | while read IP TYPE FLAGS MAC MASK IFACE
	do
		#Add new data to the graph. Count in Kbs to deal with 16 bits signed values (up to 2G only)
		#Have to use temporary files because of crappy busybox shell
		grep ${IP} /tmp/traffic_pre.tmp | while read PKTS BYTES TARGET PROT OPT IFIN IFOUT SRC DST
		do
			[ "${DST}" = "${IP}" ] && echo $((${BYTES})) > /tmp/in_$$.tmp
			[ "${SRC}" = "${IP}" ] && echo $((${BYTES})) > /tmp/out_$$.tmp
		done
		IN=$(cat /tmp/in_$$.tmp)
		OUT=$(cat /tmp/out_$$.tmp)
		rm -f /tmp/in_$$.tmp
		rm -f /tmp/out_$$.tmp
		
		if [ ${IN} -gt 0 -o ${OUT} -gt 0 ];  then
			#echo "DEBUG : New traffic for ${MAC} since last update : ${IN}k:${OUT}k"
			
			LINE=$(grep ${MAC} ${2})
			if [ -z "${LINE}" ]; then
				#echo "DEBUG : ${MAC} is a new host !"
				POST_USAGE_IN=0
				POST_USAGE_OUT=0
				PRE_USAGE_IN=0
				PRE_USAGE_OUT=0
			else
				POST_USAGE_IN=$(echo ${LINE} | cut -f2 -s -d, )
				POST_USAGE_OUT=$(echo ${LINE} | cut -f3 -s -d, )
				PRE_USAGE_IN=$(echo ${LINE} | cut -f4 -s -d, )
				PRE_USAGE_OUT=$(echo ${LINE} | cut -f5 -s -d, )
			fi
			
			# Zero values need to be corrected before we attempt to evaluate with expr
			fixValue "$PRE_USAGE_IN"
			PRE_USAGE_IN="$fixedValue"
			fixValue "$IN"
			IN="$fixedValue"
			fixValue "$PRE_USAGE_OUT"
			PRE_USAGE_OUT="$fixedValue"
			fixValue "$OUT"
			OUT="$fixedValue"
			
			PRE_USAGE_IN=$(expr ${PRE_USAGE_IN} + ${IN})
			PRE_USAGE_OUT=$(expr ${PRE_USAGE_OUT} + ${OUT})
			
			grep -v "${MAC}" ${2} > /tmp/db_$$.tmp
			mv /tmp/db_$$.tmp ${2}
			echo ${MAC},${POST_USAGE_IN},${POST_USAGE_OUT},${PRE_USAGE_IN},${PRE_USAGE_OUT},$(date "+%Y-%m-%d %H:%M") >> ${2}
		fi
	done

	grep -v "0x0" /proc/net/arp | grep -v ${WAN_IFACE} | grep -v IP | while read IP TYPE FLAGS MAC MASK IFACE
	do
		#Add new data to the graph. Count in Kbs to deal with 16 bits signed values (up to 2G only)
		#Have to use temporary files because of crappy busybox shell
		grep ${IP} /tmp/traffic_post.tmp | while read PKTS BYTES TARGET PROT OPT IFIN IFOUT SRC DST
		do
			[ "${DST}" = "${IP}" ] && echo $((${BYTES})) > /tmp/in_$$.tmp
			[ "${SRC}" = "${IP}" ] && echo $((${BYTES})) > /tmp/out_$$.tmp
		done
		IN=$(cat /tmp/in_$$.tmp)
		OUT=$(cat /tmp/out_$$.tmp)
		rm -f /tmp/in_$$.tmp
		rm -f /tmp/out_$$.tmp
		
		if [ ${IN} -gt 0 -o ${OUT} -gt 0 ];  then
			LINE=$(grep ${MAC} ${2})
			POST_USAGE_IN=$(echo ${LINE} | cut -f2 -s -d, )
			POST_USAGE_OUT=$(echo ${LINE} | cut -f3 -s -d, )
			PRE_USAGE_IN=$(echo ${LINE} | cut -f4 -s -d, )
			PRE_USAGE_OUT=$(echo ${LINE} | cut -f5 -s -d, )
			
			# Zero values need to be corrected before we attempt to evaluate with expr
			fixValue "$POST_USAGE_IN"
			POST_USAGE_IN="$fixedValue"
			fixValue "$IN"
			IN="$fixedValue"
			fixValue "$POST_USAGE_OUT"
			POST_USAGE_OUT="$fixedValue"
			fixValue "$OUT"
			OUT="$fixedValue"
			
			POST_USAGE_IN=$(expr ${POST_USAGE_IN} + ${IN})
			POST_USAGE_OUT=$(expr ${POST_USAGE_OUT} + ${OUT})
			
			grep -v "${MAC}" ${2} > /tmp/db_$$.tmp
			mv /tmp/db_$$.tmp ${2}
			echo ${MAC},${POST_USAGE_IN},${POST_USAGE_OUT},${PRE_USAGE_IN},${PRE_USAGE_OUT},$(date "+%Y-%m-%d %H:%M") >> ${2}
		fi
	done
	;;

"publish" )

	[ -z "${2}" ] && echo "ERROR : Missing argument 2" && exit 1
	[ -z "${3}" ] && echo "ERROR : Missing argument 3" && exit 1

	USERSFILE="/etc/dnsmasq.conf"
	[ -f "${USERSFILE}" ] || USERSFILE="/tmp/dnsmasq.conf"
	[ -z "${4}" ] || USERSFILE=${4}
	[ -f "${USERSFILE}" ] || USERSFILE="/dev/null"

	cp ${2} ${3}

	#Make previous bandwidth values match the current
	touch /tmp/matched_$$.tmp
	cat ${2} | while IFS=, read MAC POST_USAGE_IN POST_USAGE_OUT PRE_USAGE_IN PRE_USAGE_OUT LASTSEEN
	do
		echo ${MAC},${POST_USAGE_IN},${POST_USAGE_OUT},${POST_USAGE_IN},${POST_USAGE_OUT},${LASTSEEN} >> /tmp/matched_$$.tmp
	done
	mv /tmp/matched_$$.tmp ${2}
	;;

*)
	echo "Usage : $0 {setup|update}updatereset|publish|match} [options...]"
	echo "Options : "
	echo "   $0 setup"
	echo "   $0 read"
	echo "   $0 update database_file"
	echo "   $0 publish database_file path_of_html_report [user_file]"
	echo "Examples : "
	echo "   $0 setup"
	echo "   $0 read"
	echo "   $0 update /tmp/usage.db"
	echo "   $0 publish /tmp/usage.db /www/user/usage.htm /jffs/users.txt"
	echo "Note : [user_file] is an optional file to match users with their MAC address"
	echo "       Its format is : 00:MA:CA:DD:RE:SS,username , with one entry per line"
	exit
	;;
esac
