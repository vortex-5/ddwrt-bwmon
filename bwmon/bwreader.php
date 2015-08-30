<?php
$output = shell_exec('iptables -L BWMON -vnx');
echo "<pre>$output</pre>";
?>