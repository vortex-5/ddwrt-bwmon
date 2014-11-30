var bwmon = angular.module('bwmonApp', []);

bwmon.controller('MainController', ['$scope', '$timeout', '$http', function($scope, $timeout, $http) {
	$scope.POLL_WAIT_TIME = 5;
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
        item.down = entry[1];
        item.up = entry[2];
        item.downRate = entry[3];
        item.upRate = entry[4];
        item.date = entry[5];
        
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
  
  $scope.getSize = function(KiB) {
    var KB = KiB * 1.024;
  
    if (KB / 1000000 > 1)
      return $scope.round(KB/1000000) + ' GB';

    if (KB / 1000 > 1)
      return $scope.round(KB/1000) + ' MB';
      
    return $scope.round(KB) + ' KB';
  };
  
  $scope.getRate = function(KiBs) {
    var KBps = KiBs * 1.024;
    var Kbps = KBps * 8;
    
    if (Kbps / 1000 > 1)
      return $scope.round(Kbps/1000) + ' Mbps';
      
    return $scope.round(Kbps) + ' Kbps';
  };

	$scope.getDeviceTotal = function(device) {			
		if (!device)
			return 0;
	
		return Number(device.up) + Number(device.down);
	};
	
	$scope.getDeviceTotalRate = function(device) {
		if (!device)
				return 0;
		
		return Number(device.upRate) + Number(device.downRate);
	};
	
	$scope.getTotals = function(devices) {
		var subTotal = 0;
		angular.forEach(devices, function(device) {
			subTotal += $scope.getDeviceTotal(device);
		});
		return subTotal;
	}
	
	$scope.getTotalForField = function(arr, arrayItemValue) {
		var total = 0;
		angular.forEach(arr, function(value) {
			total += arrayItemValue(value);
		});
		return total;
	};
	
	$scope.getTotalDown = function(devices) {
		return $scope.getTotalForField(devices, function(device) {
			return Number(device.down);
		});
	};
	
	$scope.getTotalUp = function(devices) {
		return $scope.getTotalForField(devices, function(device) {
			return Number(device.up);
		});
	};
	
	$scope.getTotalDownRate = function(devices) {
		return $scope.getTotalForField(devices, function(device) {
			return Number(device.downRate);
		});
	};
	
	$scope.getTotalUpRate = function(devices) {
		return $scope.getTotalForField(devices, function(device) {
			return Number(device.upRate);
		});
	};
	
	$scope.sortFunction = function(device) {
		var total = Number(device.up) + Number(device.down);		
		return total;
	};

  $scope.init();
}]);