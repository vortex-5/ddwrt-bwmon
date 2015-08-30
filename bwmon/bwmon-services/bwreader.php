<pre class="dnsmasq">
<?php
echo file_get_contents('/tmp/dnsmasq.conf');
?>
</pre>

<pre class="ipmapping">
<?php
$wan = shell_exec('/usr/sbin/nvram get lan_ifname');
echo shell_exec('grep -v "0x0" /proc/net/arp | grep ' . $wan);
?>
</pre>

<pre class="iptables">
<?php
echo shell_exec('iptables -L BWMON -vnx');
?>
</pre>