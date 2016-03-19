'use strict'
var bwmon = angular.module('bwmonApp', ['ui.bootstrap']);

bwmon.controller('MainController', ['$scope', '$interval', '$http', '$location', function($scope, $interval, $http, $location) {
	/**
     * @type {string} The speed at which the bwmon-running.sh polls during non lighttpd mode.
     */
    $scope.SCRIPT_INTERVAL = 10;
    
    /**
     * @type {string} The speed at which the bwmon-running.sh polls during lighttpd mode.
     */
	$scope.SERVICE_SCRIPT_INTERVAL = 60;
    
	$scope.CONVERSION_FACTOR = 8/$scope.SCRIPT_INTERVAL; // From KB/s to Kbps
	$scope.CONVERSION_FACTOR_SERVICE = 8/$scope.SERVICE_SCRIPT_INTERVAL;
    
    /**
     * @type {string} How frequently the service will call bwreader.php.
     */
	$scope.SERVICE_INTERVAL = 2;
	$scope.POLL_WAIT_TIME = $scope.SCRIPT_INTERVAL;
	$scope.usageData = [];
	$scope.pollCountDown = 0;
    /**
     * @type {Object.<string, string>} Mapping of mac to name.
     */
	$scope.macNames = {};
    
    /**
     * $type {Object.<string, string>} Mapping used to lookup the ip from mac updated with dns.
     */
    $scope.macIpDns = {}
        
    /**
     * @type {string} Valid values are Normal and Compact.
     */
	$scope.displayDensity = 'Normal';
    
    /**
     * @type {string} The url to the bwreader.php service.
     */
	$scope.serviceLocation = '/bwreader.php';
    
    /**
     * @type {boolean} This is updated to reflect the state of the service.
     *                 Any 404 message from the server will cause this to be set false until refresh.
     */
	$scope.serviceEnabled = true;
	
    /**
     * @type {number} When using averaging a certain number of samples are invalid on startup this
     *                drops those samples resulting in better readout stability on startup with the negative
     *                being a one interval period where the speed is not shown.
     */
	$scope.droppedSamples = 1; // Number of samples to ignore.
	
	/**
     * @type {Object.<string, string>} Going from mac to ip conversion lookup this is updatd with usage.
     */
	$scope.macToIpMapping = {};
	
	// A double buffered sample of the current data
	$scope.dataDownSamples = [{},{}];
	$scope.dataUpSamples = [{},{}];
	$scope.sampleTimes = [new Date(), new Date()];
	$scope.currentSample = 0;
	
	// Smoothing function
	$scope.downHistoryValue = {};
	$scope.upHistoryValue = {};
	
	// running averages
	$scope.downRateAverage = {};
	$scope.upRateAverage = {};

	// Sorting options
	$scope.sortOptions = {
		TOTAL: 'TOTAL',
		POST_DOWN: 'POST_DOWN',
		POST_UP: 'POST_UP',
		DOWN_RATE: 'DOWN_RATE',
		UP_RATE: 'UP_RATE'
	}
	$scope.sortReverse = true;
	$scope.sortBy = $scope.sortOptions.TOTAL;
	
	function average(array) {       
		if (!array || array.length === 0)
			return 0;
		
		for (var i = 0; i < array.length; i++) {
			if (array[i] < 0)
				return -1;
		}
		
		var total = 0;
				
		angular.forEach(array, function(item) {
			total += item;
		});
		return total / array.length;
	}

	$scope.filterSection = function(data, sectionName) {
		if (!data)
			return data;
		
		var regex = new RegExp('<pre class="' + sectionName + '">([\\s\\S]+?)</pre>', 'gm');
		var match = regex.exec(data);
		return match[1];
	};
	
    /**
     * Updates the mac names filed using the information found in the dnsmasq.conf file
     * @param {string} data The contents of the dnsmasq.conf file.
     */
	$scope.updateDnsConf = function(data) {
		var dnsmasqRegex = /^dhcp-host=([0-9a-fA-F:]+),([\s\S]+?),([0-9.]+)/gm;
		var match = dnsmasqRegex.exec(data);

		while(match) {
			$scope.macNames[match[1]] = match[2];
            $scope.macIpDns[match[1]] = match[3];
            match = dnsmasqRegex.exec(data);
		}
	};
    
    /**
     * Updates the contents of the macNames using the data in the dnsmasq.leases files.
     * @param {string} data The contents of the dnsmasq.leases file.
     */
    $scope.updateDnsLeases = function(data) {
        var dnsmasqRegex = /^[0-9]+ ([0-9a-fA-F:]+) ([0-9.]+) ([\s\S]+?) [0-9a-fA-F:*]*$/gm;
        var match = dnsmasqRegex.exec(data);
        
        while(match) {
			$scope.macNames[match[1]] = match[3];
            $scope.macIpDns[match[1]] = match[2];
            match = dnsmasqRegex.exec(data);
		}
    };
    
    $scope.updateMissingEntries = function(macNames) {
        // Updates the missing dnsmasq entries.
		function addEntry(mac) {
			var item = {};

			item.mac = mac;
			item.postDown = 0;
			item.postUp = 0;
			item.preDown = 0;
			item.preUp = 0;
			item.date = '--';
			
			$scope.usageData.push(item);
		}
        
        var knownMacs = [];
        angular.forEach($scope.usageData, function(item) {
            knownMacs.push(item.mac);
        });
    
        for (var mac in macNames) {
            if (macNames.hasOwnProperty(mac)) {
                if (knownMacs.indexOf(mac) === -1) {
                    addEntry(mac);
                }
            }
        }
    };
    
    /**
     * Override any DNS entries with the user's custom mac names.
     */
    $scope.macNamesOverride = function() {
        if (MAC_NAMES) {
			for (var mac in MAC_NAMES) {
				if (MAC_NAMES.hasOwnProperty(mac)) {
					$scope.macNames[mac] = MAC_NAMES[mac];
				}
			}
		}
    };
	
	$scope.updatemacToIpMapping = function(data) {
		var regex = /^([0-9.]+)[\s]+[0-9]x[0-9][\s]+[0-9]x[0-9][\s]+([0-9a-zA-Z:]+)/gm;
		var match = regex.exec(data);
		var ipmap = {};
		while(match) {
			ipmap[match[2]] = match[1];
			match = regex.exec(data);
		}
		$scope.macToIpMapping = ipmap;
	};
	
	$scope.updateUsage = function(data) {
		var iptables = data;
		var regex = /^[\s]+\d+[\s]+(\d+)[\s]+\w+\s+\d+\s+[a-zA-z0-9-]+\s+\S+\s+\S+\s+([0-9./]+)\s+([0-9./]+)/gm;
		
		var match = regex.exec(iptables);
		
		var dataIn = {};
		var dataOut = {};
		
		while(match) {
			if (match[2] === '0.0.0.0/0') {
				dataIn[match[3]] = match[1];
			}
			if (match[3] === '0.0.0.0/0') {
				dataOut[match[2]] = match[1];
			}
			match = regex.exec(iptables);
		}

		$scope.dataDownSamples[$scope.currentSample] = dataIn;
		$scope.dataUpSamples[$scope.currentSample] = dataOut;
	};
	
	$scope.updateRates = function() {
		function getInterval() {
			var curTime = $scope.sampleTimes[$scope.currentSample].getTime();
			var preTime = $scope.sampleTimes[($scope.currentSample + 1) % 2].getTime();
			return curTime - preTime;
		}

		if ($scope.serviceEnabled) {            
			if ($scope.droppedSamples > 0) {
				$scope.droppedSamples--;
				(function() {
					for (var ip in $scope.dataDownSamples[$scope.currentSample]) {
						if ($scope.dataDownSamples[$scope.currentSample].hasOwnProperty(ip)) {
							$scope.downRateAverage[ip] = -1;
						}
						
					}
				})();
				(function() {
					for (var ip in $scope.dataUpSamples[$scope.currentSample]) {
						if ($scope.dataUpSamples[$scope.currentSample].hasOwnProperty(ip)) {
							$scope.upRateAverage[ip] = -1;
						}
					}
				})();
				return;
			}
				
			(function() {
				for (var ip in $scope.dataDownSamples[$scope.currentSample]) {
					if ($scope.dataDownSamples[$scope.currentSample].hasOwnProperty(ip)) {
						var curDown = $scope.dataDownSamples[$scope.currentSample][ip];
						var preDown = $scope.dataDownSamples[($scope.currentSample + 1) % 2][ip];
						
						if (!curDown)
							curDown = 0;
						
						if (!preDown)
							preDown = 0;
										
						if (!$scope.downHistoryValue[ip]) {
								$scope.downHistoryValue[ip] = [0, 0, 0];
						}
							
						var value = (curDown - preDown) * (8 / getInterval());
						if (isNaN(value)) {
							value = 0;
						}
						if (value >= 0) {
							$scope.downHistoryValue[ip].splice(0, 1);
							$scope.downHistoryValue[ip].push(value);
						}
						$scope.downRateAverage[ip] = average($scope.downHistoryValue[ip]);
					}
				}
			})();
			(function() {
				for (var ip in $scope.dataUpSamples[$scope.currentSample]) {
					if ($scope.dataUpSamples[$scope.currentSample].hasOwnProperty(ip)) {
						var curUp = $scope.dataUpSamples[$scope.currentSample][ip];
						var preUp = $scope.dataUpSamples[($scope.currentSample + 1) % 2][ip];
						
						if (!curUp)
							curUp = 0;
						
						if (!preUp)
							preUp = 0;
						
						if (!$scope.upHistoryValue[ip]) {
							$scope.upHistoryValue[ip] = [0, 0, 0];
						}
						
						var value = (curUp - preUp) * (8 / getInterval());
						if (isNaN(value)) {
							value = 0;
						}
						if (value >= 0) {
							$scope.upHistoryValue[ip].splice(0, 1);
							$scope.upHistoryValue[ip].push(value);
						}
						$scope.upRateAverage[ip] = average($scope.upHistoryValue[ip]);
					}
				}
			})();
		}   
	};
	
	$scope.addMissingUsage = function() {
		var downRate = 0;
		var upRate = 0;
		
		function containsMac(mac) {
			for (var i = 0; i < $scope.usageData.length; i++) {
				if ($scope.usageData[i].mac === mac) {
					return true;
				}
			}
			return false;
		}

		for (var mac in $scope.macToIpMapping) {
			if ($scope.macToIpMapping.hasOwnProperty(mac)) {
				if (!containsMac) {
					var ip = $scope.macToIpMapping[mac];
					var postDown = $scope.dataDownSamples[$scope.currentSample][ip];
					var postUp = $scope.dataUpSamples[$scope.currentSample][ip];
					
					if (postUp + postDown > 0) {
						$scope.addUsageData(mac, postDown, postUp);
					}
				}
			}
		}
	};
	
	$scope.fetchUpdate = function() {
		function oldService() {
			$http.get('usage_stats.js').then(function(response) {
				$scope.usageData = [];
				$scope.updateUsageData(response.data);
			});
		}
		
		if ($scope.serviceEnabled) {
			var beforeSample = new Date();
			// EDGE and IE insist on caching things even with IE specific no cache tags the only solution then is to force a new URL every call.
			var url = $scope.serviceLocation + '?no-cache=' + beforeSample.getTime();
			$http.get(url).then(function(response) {
				var filtered = $scope.filterSection(response.data, 'usage-stats');
				$scope.currentSample = ($scope.currentSample + 1) % 2;
				var afterSample = new Date();
				$scope.sampleTimes[$scope.currentSample] = new Date((beforeSample.getTime() + afterSample.getTime()) / 2);
				
				$scope.usageData = [];
				$scope.updateUsageData(filtered);
				
                $scope.macNames = {};
                
                var dnsmasqLeasesData = $scope.filterSection(response.data, 'dnsmasq-leases');
                $scope.updateDnsLeases(dnsmasqLeasesData);
                
				var dnsmasqConfData = $scope.filterSection(response.data, 'dnsmasq-conf');
				$scope.updateDnsConf(dnsmasqConfData);
                
                $scope.updateMissingEntries($scope.macNames);
                
                $scope.macNamesOverride();
				
				var ipmappingData = $scope.filterSection(response.data, 'ipmapping');
				$scope.updatemacToIpMapping(ipmappingData);
				
				var iptablesData = $scope.filterSection(response.data, 'iptables');
				$scope.updateUsage(iptablesData);
				
				$scope.updateRates();
			}, function(response) {
				$scope.serviceEnabled = false;
				oldService();
			});
		}
		else {
			oldService();
		}
	};
	
	$scope.init = function() {      
		function tick() {
			if ($scope.pollCountDown > 1) {
				$scope.pollCountDown--;
			}
			else {
				if ($scope.serviceEnabled)
					$scope.pollCountDown = $scope.SERVICE_INTERVAL;
				else
					$scope.pollCountDown = $scope.POLL_WAIT_TIME;
				$scope.fetchUpdate();
			}
		}
		tick();
		$interval(tick, 1000);

		if (MAC_NAMES) {
			// Required mac names won't read if it's not in a var.
			for (var mac in MAC_NAMES) {
				if (MAC_NAMES.hasOwnProperty(mac)) {
					$scope.macNames[mac] = MAC_NAMES[mac];
				}
			}
		}
		
		var density = $scope.readCookie('bwmon-displayDensity');
		if (density)
			$scope.displayDensity = density;
	};
	
	$scope.setCookie = function(name, value, maxAgeSec) {
		var cookieStream = [];
		cookieStream.push(name + '=' + value);
		if (maxAgeSec)
			cookieStream.push('max-age' + '=' + maxAgeSec);
			
		document.cookie = cookieStream.join(';');
	};
	
	$scope.readCookie = function(name) {
		return $scope.readCookies()[name];
	};
	
	$scope.readCookies = function() {
		var rawCookies = document.cookie;
		var cookies = {};
		
		if (rawCookies) {
			var cookieValues = rawCookies.split(';');
			angular.forEach(cookieValues, function(cookieValue) {
				var index = cookieValue.indexOf('=');
				if (!index)
					return;
				
				var key = cookieValue.substring(0, index);
				var value = cookieValue.substring(index + 1, cookieValue.length);
				
				cookies[key] = value;
			});
		}
		
		return cookies; 
	};

	$scope.updateUsageData = function(data) {
		var resultLines = data.split('\n');

		angular.forEach(resultLines, function(line) {
			if (line.trim().length > 0) {
				var entry = line.split(',');
				var item = {};

				item.mac = entry[0];
				item.postDown = Number(entry[1]);
				item.postUp = Number(entry[2]);
				item.preDown = Number(entry[3]);
				item.preUp = Number(entry[4]);
				item.date = entry[5];

				$scope.usageData.push(item);
			}
		});
	};
	
	$scope.addUsageData = function(mac, totalDown, totalUp) {
		var item = {};
		item.mac = mac;
		item.postDown = totalDown;
		item.postUp = totalUp;
		var now = new Date();
		item.date = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes();
		$scope.usageData.push(item);
	};

	$scope.getName = function(macAddress) {
		var name = $scope.macNames[macAddress];
		return name ? name : macAddress.toUpperCase()
	};

	$scope.round = function(value) {
		return Math.round(value * 100)/100;
	};

	$scope.getSize = function(KB) {
		if (KB / Math.pow(1024, 2) > 1)
			return $scope.round(KB/Math.pow(1024, 2)) + ' GB';

		if (KB / 1024 > 1)
			return $scope.round(KB/1024) + ' MB';

		return $scope.round(KB) + ' KB';
	};

	$scope.getRate = function(Kbps) {
		if (isNaN(Kbps) || Kbps < 0)
			return '--';
		
		if (Kbps / 1000 > 1)
			return $scope.round(Kbps/1000) + ' Mbps';

		return $scope.round(Kbps) + ' Kbps';
	};

	$scope.getDeviceTotal = function(device) {
		if (!device)
			return 0;

		return Number(device.postUp) + Number(device.postDown);
	};

	$scope.getDeviceTotalRate = function(device) {
		if (!device)
			return 0;
		
		if ($scope.getDownRate(device) < 0 || $scope.getUpRate(device) < 0)
			return 0;

		return $scope.getDownRate(device) + $scope.getUpRate(device);
	};
	
	$scope.getDownRate = function(device) {
		if (!device)
			return 0;
		
		if ($scope.serviceEnabled) {
			var ip = $scope.macToIpMapping[device.mac];
			if (!ip)
				return 0;
			return $scope.downRateAverage[ip];
		}
		else {
			return (device.postDown - device.preDown) * $scope.CONVERSION_FACTOR;
		}
	};

	$scope.getUpRate = function(device) {
		if (!device)
			return 0;

		if ($scope.serviceEnabled) {
			var ip = $scope.macToIpMapping[device.mac];
			if (!ip)
				return 0;
			return $scope.upRateAverage[ip];
		}
		else {
			return (device.postUp - device.preUp) * $scope.CONVERSION_FACTOR;
		}
	};

	$scope.getTotals = function(devices) {
		var subTotal = 0;
		angular.forEach(devices, function(device) {
			subTotal += $scope.getDeviceTotal(device);
		});
		return subTotal;
	};

	$scope.getTotalDown = function(devices) {
		var total =  0;
		angular.forEach(devices, function(device) {
			total += device.postDown;
		});
		return total;
	};

	$scope.getTotalUp = function(devices) {
		var total =  0;
		angular.forEach(devices, function(device) {
			total += device.postUp;
		});
		return total;
	};

	$scope.getTotalDownRate = function(devices) {
		var total =  0;
		angular.forEach(devices, function(device) {
			total += $scope.getDownRate(device);
		});
		return total;
	};

	$scope.getTotalUpRate = function(devices) {
		var total =  0;
		angular.forEach(devices, function(device) {
			total += $scope.getUpRate(device);
		});
		return total;
	};
	
	$scope.isZeroUsage = function(device) {
		return $scope.getDeviceTotal(device) + $scope.getDownRate(device) + $scope.getUpRate(device) <= 0;
	};

	$scope.sortFunction = function(device) {
		var metric
		switch ($scope.sortBy) {
			case $scope.sortOptions.POST_UP:
				metric = device.postUp;
				break;
			case $scope.sortOptions.POST_DOWN:
				metric = device.postDown;
				break;
			case $scope.sortOptions.DOWN_RATE:
				metric = $scope.getDownRate(device);
				break;
			case $scope.sortOptions.UP_RATE:
				metric = $scope.getUpRate(device);
				break;
			default:
				metric = device.postUp + device.postDown;
		}
		
		return metric;
	};

	$scope.setSortBy = function(option) {
		if ($scope.sortBy === option) {
			$scope.sortReverse = !$scope.sortReverse;
		}
		else {
			$scope.sortBy = option;		
		}
	};
	
	$scope.$watch('displayDensity', function() {
		$scope.setCookie('bwmon-displayDensity', $scope.displayDensity, 60 * 60 * 24 * 30);
	});
		
	$scope.init();
}]);