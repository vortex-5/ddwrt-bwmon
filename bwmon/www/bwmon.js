'use strict'
let bwmon = angular.module('bwmonApp', ['ui.bootstrap']);

bwmon.controller('MainController', ['$scope', '$interval', '$http', '$location', function($scope, $interval, $http, $location) {
	/**
	 * @type {string} The speed at which the bwmon-running.sh polls during non lighttpd mode.
	 */
	$scope.SCRIPT_INTERVAL = 10;

	$scope.CONVERSION_FACTOR = 8; // From KB/s to Kbps (when divided by the script interval)

	/**
	 * @type {number} 1 month in seconds.
	 */
	$scope.SECONDS_IN_MONTH = 60 * 60 * 24 * 30;

	/**
	 * @type {string} How frequently the service will call bwreader.
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
	 * @type {string} Defines the rate to be shown in the speed indicator this is either Kbps or KB/s
	 */
	$scope.displayRate = 'Kbps';

	/**
	 * @type {string} Valid values are bwmon and bwmondark.
	 */
	$scope.displayStyleSheet = 'bwmondark';

	/**
	 * @type {string} The url to the bwreader service.
	 */
	$scope.serviceLocation = '/bwreader.cgi';

	/**
	 * When in non service mode we fetch these two resources to decode things.
	 */
	$scope.nonServiceDnsConf = 'dnsmasq-conf.js';
	$scope.nonServiceDnsLeases = 'dnsmasq-leases.js';

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

	// Names Type
	$scope.displayNameOptions = {
		NAME: 'NAME',
		IP: 'IP',
		MAC: 'MAC'
	}
	$scope.displayNameType = $scope.displayNameOptions.NAME;

	function average(array) {
		if (!array || array.length === 0)
			return 0;

		for (let i = 0; i < array.length; i++) {
			if (array[i] < 0)
				return -1;
		}

		let total = 0;

		for (let i = 0; i < array.length; i++) {
			total += array[i];
		}
		return total / array.length;
	}

	$scope.filterSection = function(data, sectionName) {
		if (!data)
			return data;

		let regex = new RegExp('<pre class="' + sectionName + '">([\\s\\S]+?)</pre>', 'gm');
		let match = regex.exec(data);
		return match[1];
	};

	/**
	 * Updates the mac names filed using the information found in the dnsmasq.conf file
	 * @param {string} data The contents of the dnsmasq.conf file.
	 */
	$scope.updateDnsConf = function(data) {
		let dnsmasqRegex = /^dhcp-host=([0-9a-fA-F:]+),([\s\S]+?),([0-9.]+)/gm;
		let match = dnsmasqRegex.exec(data);

		while(match) {
			$scope.macNames[match[1].toLowerCase()] = match[2];
			$scope.macIpDns[match[1].toLowerCase()] = match[3];
			match = dnsmasqRegex.exec(data);
		}
	};

	/**
	 * Updates the contents of the macNames using the data in the dnsmasq.leases files.
	 * @param {string} data The contents of the dnsmasq.leases file.
	 */
	$scope.updateDnsLeases = function(data) {
		let dnsmasqRegex = /^[0-9]+ ([0-9a-fA-F:]+) ([0-9.]+) ([\s\S]+?) [0-9a-fA-F:*]*$/gm;
		let match = dnsmasqRegex.exec(data);

		while(match) {
			$scope.macNames[match[1].toLowerCase()] = match[3];
			$scope.macIpDns[match[1].toLowerCase()] = match[2];
			match = dnsmasqRegex.exec(data);
		}
	};

	$scope.updateMissingEntries = function(macNames) {
		// Updates the missing dnsmasq entries.
		function addEntry(mac) {
			let item = {};

			item.mac = mac;
			item.postDown = 0;
			item.postUp = 0;
			item.preDown = 0;
			item.preUp = 0;
			item.date = '--';

			$scope.usageData.push(item);
		}

		let knownMacs = [];
		for (let i = 0; i < $scope.usageData.length; i++) {
			knownMacs.push($scope.usageData[i].mac);
		}

		for (let mac in macNames) {
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
			for (let mac in MAC_NAMES) {
				if (MAC_NAMES.hasOwnProperty(mac)) {
					$scope.macNames[mac.toLowerCase()] = MAC_NAMES[mac];
				}
			}
		}
    };

	$scope.updatemacToIpMapping = function(data) {
		let regex = /^([0-9.]+)[\s]+[0-9]x[0-9][\s]+[0-9]x[0-9][\s]+([0-9a-zA-Z:]+)/gm;
		let match = regex.exec(data);
		let ipmap = {};
		while(match) {
			ipmap[match[2]] = match[1];
			match = regex.exec(data);
		}
		$scope.macToIpMapping = ipmap;
	};

	$scope.updateUsage = function(data) {
		let iptables = data;
		let regex = /^[\s]+\d+[\s]+(\d+)[\s]+\w+\s+\d+\s+[a-zA-z0-9-]+\s+\S+\s+\S+\s+([0-9./]+)\s+([0-9./]+)/gm;

		let match = regex.exec(iptables);

		let dataIn = {};
		let dataOut = {};

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
			let curTime = $scope.sampleTimes[$scope.currentSample].getTime();
			let preTime = $scope.sampleTimes[($scope.currentSample + 1) % 2].getTime();
			return curTime - preTime;
		}

		if ($scope.serviceEnabled) {
			if ($scope.droppedSamples > 0) {
				$scope.droppedSamples--;
				(function() {
					for (let ip in $scope.dataDownSamples[$scope.currentSample]) {
						if ($scope.dataDownSamples[$scope.currentSample].hasOwnProperty(ip)) {
							$scope.downRateAverage[ip] = -1;
						}

					}
				})();
				(function() {
					for (let ip in $scope.dataUpSamples[$scope.currentSample]) {
						if ($scope.dataUpSamples[$scope.currentSample].hasOwnProperty(ip)) {
							$scope.upRateAverage[ip] = -1;
						}
					}
				})();
				return;
			}

			(function() {
				for (let ip in $scope.dataDownSamples[$scope.currentSample]) {
					if ($scope.dataDownSamples[$scope.currentSample].hasOwnProperty(ip)) {
						let curDown = $scope.dataDownSamples[$scope.currentSample][ip];
						let preDown = $scope.dataDownSamples[($scope.currentSample + 1) % 2][ip];

						if (!curDown)
							curDown = 0;

						if (!preDown)
							preDown = 0;

						if (!$scope.downHistoryValue[ip]) {
								$scope.downHistoryValue[ip] = [0, 0, 0];
						}

						let value = (curDown - preDown) * ($scope.CONVERSION_FACTOR / getInterval());
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
				for (let ip in $scope.dataUpSamples[$scope.currentSample]) {
					if ($scope.dataUpSamples[$scope.currentSample].hasOwnProperty(ip)) {
						let curUp = $scope.dataUpSamples[$scope.currentSample][ip];
						let preUp = $scope.dataUpSamples[($scope.currentSample + 1) % 2][ip];

						if (!curUp)
							curUp = 0;

						if (!preUp)
							preUp = 0;

						if (!$scope.upHistoryValue[ip]) {
							$scope.upHistoryValue[ip] = [0, 0, 0];
						}

						let value = (curUp - preUp) * ($scope.CONVERSION_FACTOR / getInterval());
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
		let downRate = 0;
		let upRate = 0;

		function containsMac(mac) {
			for (let i = 0; i < $scope.usageData.length; i++) {
				if ($scope.usageData[i].mac === mac) {
					return true;
				}
			}
			return false;
		}

		for (let mac in $scope.macToIpMapping) {
			if ($scope.macToIpMapping.hasOwnProperty(mac)) {
				if (!containsMac) {
					let ip = $scope.macToIpMapping[mac];
					let postDown = $scope.dataDownSamples[$scope.currentSample][ip];
					let postUp = $scope.dataUpSamples[$scope.currentSample][ip];

					if (postUp + postDown > 0) {
						$scope.addUsageData(mac, postDown, postUp);
					}
				}
			}
		}
	};

	$scope.fetchUpdate = function() {
		let config = {
			headers: {
				'pragma': 'no-cache',
				'cache-control': 'no-cache'
			}
		}

		function oldService() {
			$http.get($scope.nonServiceDnsLeases, config).then(function(responseLeases) {
				$http.get($scope.nonServiceDnsConf, config).then(function(responseConf) {
					$scope.macNames = {};

					let dnsmasqLeasesData = responseLeases.data;
					let dnsmasqConfData = responseConf.data;

					$scope.updateDnsLeases(dnsmasqLeasesData);
					$scope.updateDnsConf(dnsmasqConfData);
					$scope.updateMissingEntries($scope.macNames);
					$scope.macNamesOverride();
				});
			});
			$http.get('usage_stats.js', config).then(function(response) {
				$scope.usageData = [];
				$scope.updateUsageData(response.data);
			});
		}

		if ($scope.serviceEnabled) {
			let beforeSample = new Date();
			$http.get($scope.serviceLocation, config).then(function(response) {
				let filtered = $scope.filterSection(response.data, 'usage-stats');
				$scope.currentSample = ($scope.currentSample + 1) % 2;
				let afterSample = new Date();
				$scope.sampleTimes[$scope.currentSample] = new Date((beforeSample.getTime() + afterSample.getTime()) / 2);

				$scope.usageData = [];
				$scope.updateUsageData(filtered);

				$scope.macNames = {};

				let dnsmasqLeasesData = $scope.filterSection(response.data, 'dnsmasq-leases');
				$scope.updateDnsLeases(dnsmasqLeasesData);

				let dnsmasqConfData = $scope.filterSection(response.data, 'dnsmasq-conf');
				$scope.updateDnsConf(dnsmasqConfData);

				$scope.updateMissingEntries($scope.macNames);

				$scope.macNamesOverride();

				let ipmappingData = $scope.filterSection(response.data, 'ipmapping');
				$scope.updatemacToIpMapping(ipmappingData);

				let iptablesData = $scope.filterSection(response.data, 'iptables');
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

	$scope.setCookie = function(name, value, maxAgeSec) {
		let cookieStream = [];
		cookieStream.push(name + '=' + value);
		if (maxAgeSec)
			cookieStream.push('max-age' + '=' + maxAgeSec);

		document.cookie = cookieStream.join(';');
	};

	$scope.readCookie = function(name) {
		return $scope.readCookies()[name];
	};

	$scope.readCookies = function() {
		let rawCookies = document.cookie;
		let cookies = {};

		if (rawCookies) {
			let cookieValues = rawCookies.split(';');
			for (let i = 0; i < cookieValues.length; i++) {
				let cookieValue = cookieValues[i];
				let index = cookieValue.indexOf('=');
				if (!index)
					return;

				let key = cookieValue.substring(0, index).trim();
				let value = cookieValue.substring(index + 1, cookieValue.length);

				cookies[key] = value;
			}
		}

		return cookies;
	};

	$scope.updateUsageData = function(data) {
		let resultLines = data.split('\n');

		for (let i = 0; i < resultLines.length; i++) {
			let line = resultLines[i];
			if (line.trim().length > 0) {
				let entry = line.split(',');
				let item = {};

				item.mac = entry[0];
				item.postDown = Number(entry[1]);
				item.postUp = Number(entry[2]);
				item.preDown = Number(entry[3]);
				item.preUp = Number(entry[4]);
				item.date = entry[5];

				$scope.usageData.push(item);
			}
		}
	};

	$scope.addUsageData = function(mac, totalDown, totalUp) {
		let item = {};
		item.mac = mac;
		item.postDown = totalDown;
		item.postUp = totalUp;
		let now = new Date();
		item.date = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes();
		$scope.usageData.push(item);
	};

	$scope.getName = function(macAddress) {
		macAddress = macAddress.toLowerCase(); // Internal mac addresses are always stored in lowercase.
		let name;
		switch ($scope.displayNameType) {
			case $scope.displayNameOptions.NAME:
				name = $scope.macNames[macAddress];
				return name ? name : macAddress.toUpperCase();
			case $scope.displayNameOptions.IP:
				name = $scope.macIpDns[macAddress];
				return name ? name : macAddress.toUpperCase();
		}
		return macAddress.toUpperCase();
	};

	$scope.nextNameType = function() {
		switch ($scope.displayNameType) {
			case ($scope.displayNameOptions.NAME):
				$scope.displayNameType = $scope.displayNameOptions.IP;
				break;
			case ($scope.displayNameOptions.IP):
				$scope.displayNameType = $scope.displayNameOptions.MAC;
				break;
			default:
				$scope.displayNameType = $scope.displayNameOptions.NAME;
		}
	}

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

	$scope.getRate = function(KBps10) {
		if (isNaN(KBps10) || KBps10 < 0)
			return '--';

		if ($scope.displayRate === 'Kbps') {
			let Kbps = KBps10 * ($scope.CONVERSION_FACTOR / $scope.SCRIPT_INTERVAL);
			if (Kbps / 1000 > 1)
				return $scope.round(Kbps/1000) + ' Mbps';

			return $scope.round(Kbps) + ' Kbps';
		}
		else {
			let KBps = KBps10 / $scope.SCRIPT_INTERVAL;
			if (KBps / 1000 > 1)
				return $scope.round(KBps/1000) + ' MB/s';

			return $scope.round(KBps) + ' KB/s';
		}
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
			let ip = $scope.macToIpMapping[device.mac];
			if (!ip)
				return 0;
			return $scope.downRateAverage[ip];
		}
		else {
			return device.postDown - device.preDown;
		}
	};

	$scope.getUpRate = function(device) {
		if (!device)
			return 0;

		if ($scope.serviceEnabled) {
			let ip = $scope.macToIpMapping[device.mac];
			if (!ip)
				return 0;
			return $scope.upRateAverage[ip];
		}
		else {
			return device.postUp - device.preUp;
		}
	};

	$scope.getTotals = function(devices) {
		let subTotal = 0;
		for (let i = 0; i < devices.length; i++) {
			subTotal += $scope.getDeviceTotal(devices[i]);
		}
		return subTotal;
	};

	$scope.getTotalDown = function(devices) {
		let total =  0;
		for (let i = 0; i < devices.length; i++) {
			total += devices[i].postDown;
		}
		return total;
	};

	$scope.getTotalUp = function(devices) {
		let total =  0;
		for (let i = 0; i < devices.length; i++) {
			total += devices[i].postUp;
		}
		return total;
	};

	$scope.getTotalDownRate = function(devices) {
		let total =  0;
		for (let i = 0; i < devices.length; i++) {
			total += $scope.getDownRate(devices[i]);
		}
		return total;
	};

	$scope.getTotalUpRate = function(devices) {
		let total =  0;
		for (let i = 0; i < devices.length; i++) {
			total += $scope.getUpRate(devices[i]);
		}
		return total;
	};

	$scope.isZeroUsage = function(device) {
		return $scope.getDeviceTotal(device) + $scope.getDownRate(device) + $scope.getUpRate(device) <= 0;
	};

	$scope.resetStats = function() {
		$http.get('/bwreset.cgi')
	}

	$scope.sortFunction = function(device) {
		let metric
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

		let density = $scope.readCookie('bwmon-displayDensity');
		if (density)
			$scope.displayDensity = density;

		$scope.$watch('displayDensity', function() {
			$scope.setCookie('bwmon-displayDensity', $scope.displayDensity, $scope.SECONDS_IN_MONTH);
		});

		let displayNameType = $scope.readCookie('bwmon-displayNameType');
		if (displayNameType)
			$scope.displayNameType = displayNameType;

		$scope.$watch('displayNameType', function() {
			$scope.setCookie('bwmon-displayNameType', $scope.displayNameType, $scope.SECONDS_IN_MONTH);
		});

		let displayRate = $scope.readCookie('bwmon-displayRate');
		if (displayRate)
			$scope.displayRate = displayRate;

		$scope.$watch('displayRate',function() {
			$scope.setCookie('bwmon-displayRate', $scope.displayRate, $scope.SECONDS_IN_MONTH);
		});

		let stylesheet = $scope.readCookie('bwmon-displayStyleSheet');
		if (stylesheet)
			$scope.displayStyleSheet = stylesheet;

		$scope.$watch('displayStyleSheet', function() {
			$scope.setCookie('bwmon-displayStyleSheet', $scope.displayStyleSheet, $scope.SECONDS_IN_MONTH);
			changeCSS($scope.displayStyleSheet+'.css', 1);
		});
	};

	$scope.init();
}]);

/**
 * Changes the css file on the fly. Index must be 1 because 0 is bootstrap's css.
 * @param {string} cssFile url path for the css to load.
 * @param {number} cssLinkIndex index of the link to replace.
 */
function changeCSS(cssFile, cssLinkIndex) {
		let oldlink = document.getElementsByTagName("link").item(cssLinkIndex);
		let newlink = document.createElement("link");
		newlink.setAttribute("rel", "stylesheet");
		newlink.setAttribute("type", "text/css");
		newlink.setAttribute("href", cssFile);
		document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
	}
