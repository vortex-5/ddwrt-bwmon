'use strict'

var bwmon = angular.module('bwmonApp', ['ui.bootstrap']);

bwmon.controller('MainController', ['$scope', '$interval', '$http', function($scope, $interval, $http) {
	
	$scope.SCRIPT_INTERVAL = 10;
	$scope.CONVERSION_FACTOR = 8/$scope.SCRIPT_INTERVAL; // From KB/s to Kbps
	$scope.POLL_WAIT_TIME = $scope.SCRIPT_INTERVAL;
	$scope.usageData = [];
	$scope.pollCountDown = 0;
	$scope.macNames = {};
	$scope.displayDensity = 'Normal';

	$scope.init = function() {		
		function tick() {
			if ($scope.pollCountDown > 1) {
				$scope.pollCountDown--;
			}
			else {
				$scope.pollCountDown = $scope.POLL_WAIT_TIME;
				$http.get('usage_stats.js').success(function(data, status, headers, config) {
					$scope.usageData = [];
					$scope.updateUsageData(data);
				});
			}
		}
		tick();
		$interval(tick, 1000);

		var macNamesFile = MAC_NAMES; // Required mac names won't read if it's not in a var.
		for (var mac in macNamesFile) {
			if (macNamesFile.hasOwnProperty(mac)) {
				$scope.macNames[mac.toUpperCase()] = MAC_NAMES[mac];
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
	}
	
	$scope.readCookie = function(name) {
		return $scope.readCookies()[name];
	}
	
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
	}

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
				item.date = entry[5].replace(' ', ' ');

				$scope.usageData.push(item);
			}
		});
	};

	$scope.getName = function(macAddress) {
		var name = $scope.macNames[macAddress.toUpperCase()];
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

		return $scope.getDownRate(device) + $scope.getUpRate(device);
	};

	$scope.getDownRate = function(device) {
		if (!device)
			return 0;

		return (device.postDown - device.preDown) * $scope.CONVERSION_FACTOR;
	};

	$scope.getUpRate = function(device) {
		if (!device)
			return 0;

		return (device.postUp - device.preUp) * $scope.CONVERSION_FACTOR;
	};

	$scope.getTotals = function(devices) {
		var subTotal = 0;
		angular.forEach(devices, function(device) {
			subTotal += $scope.getDeviceTotal(device);
		});
		return subTotal;
	}

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

	$scope.sortFunction = function(device) {
		var total = device.postUp + device.postDown;
		return total;
	};
	
	$scope.$watch('displayDensity', function() {
		$scope.setCookie('bwmon-displayDensity', $scope.displayDensity, 60 * 60 * 24 * 30);
	});

	$scope.init();
}]);