<?php
ini_set("memory_limit", "8M");
?>

<pre class="usage-stats">
<?php
echo file_get_contents('/tmp/www/usage_stats.js');	
?>
</pre>

<pre class="dnsmasq-conf">
<?php
echo file_get_contents('/tmp/dnsmasq.conf');
?>
</pre>

<pre class="dnsmasq-leases">
<?php
echo file_get_contents('/tmp/dnsmasq.leases');
?>  
</pre>

<pre class="ipmapping">
<?php
$wan = shell_exec('/usr/sbin/nvram get wan_ifname');
echo shell_exec('grep -v "0x0" /proc/net/arp | grep -v ' . $wan . ' | grep IP');
?>
</pre>

<pre class="iptables">
<?php
echo shell_exec('iptables -L BWMON -vnx');
?>
</pre>