#!/bin/sh
printf 'Content-Type: text/html\n\n\n'

printf '<pre class="usage-stats">\n'
cat /tmp/www/usage_stats.js
printf '</pre>\n\n'

printf '<pre class="dnsmasq-conf">\n'
cat /tmp/dnsmasq.conf
printf '</pre>\n\n'

printf '<pre class="dnsmasq-leases">\n'
cat /tmp/dnsmasq.leases
printf '</pre>\n\n'

printf '<pre class="ipmapping">\n'
grep -v "0x0" /proc/net/arp | grep -v `/usr/sbin/nvram get wan_ifname`
printf '</pre>\n\n'

printf '<pre class="iptables">\n'
iptables -L BWMON -vnx
printf '</pre>\n'