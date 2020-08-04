#!/bin/sh
iptables -D FORWARD -j BWMON
iptables -F BWMON
iptables -X BWMON

echo "Iptables have been cleared"
