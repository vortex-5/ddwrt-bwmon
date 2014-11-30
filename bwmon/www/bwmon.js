var bwmon = angular.module('bwmonApp', []);

bwmon.controller('MainController', ['$scope', '$timeout', '$http', function($scope, $timeout, $http) {
  $scope.usageData = [];

  $scope.init = function() {
    $http.get('usage_stats.js').success(function(data, status, headers, config) {
      $scope.updateUsageData(data);
    });
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
      return $scope.round(KB/1000000) + 'GB';

    if (KB / 1000 > 1)
      return $scope.round(KB/1000) + 'MB';
      
    return $scope.round(KB) + 'KB';
  };
  
  $scope.getRate = function(KiBs) {
    var KBps = KiBs * 1.024;
    var Kbps = KBps * 8;
    
    if (Kbps / 1000 > 1)
      return $scope.round(Kbps/1000) + 'Mbps';
      
    return $scope.round(Kbps) + 'Kbps';
  };

  $scope.init();
}]);