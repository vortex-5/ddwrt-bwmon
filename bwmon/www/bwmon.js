var bwmon = angular.module('bwmonApp', []);

bwmon.controller('MainController', ['$scope', '$timeout', '$http', function($scope, $timeout, $http) {
	$scope.SCRIPT_INTERVAL = 10;
	$scope.SAMPLED_RATE_TO_KBPS_FACTOR = Math.pow(8 / $scope.SCRIPT_INTERVAL, 2);
	$scope.OVERHEAD_COMPENSATION_FACTOR = 1.04;
	$scope.CONVERSION_FACTOR = $scope.SAMPLED_RATE_TO_KBPS_FACTOR * $scope.OVERHEAD_COMPENSATION_FACTOR;
	$scope.POLL_WAIT_TIME = $scope.SCRIPT_INTERVAL/2;
  $scope.usageData = [];
	$scope.pollCountDown = 0;

  $scope.init = function() {	
		(function tick() {
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
			$timeout(tick, 1000);
		})();
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
        item.date = entry[5].replace(' ', ' ');
        
        $scope.usageData.push(item);
      }
    });
  };
  
  $scope.getName = function(macAddress) {
    var name = MAC_NAMES[macAddress];
    return name ? name : macAddress
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

  $scope.init();
}]);