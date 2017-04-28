/**
 * Created by raniys on 4/27/17.
 */

var mainApp = angular.module('mainApp', [])
    .filter('trustAsResourceUrl', ['$sce', function ($sce) {
        return function (val) {
            return $sce.trustAsResourceUrl(val);
        };
    }]);

//Controller间通信的服务
mainApp.factory('Service', function () {
    return {
        //网络状态
        networkReady: false,
        isLogin: false,
        //文件地址
        fileUrl: FILE_URL,
        ossUrl: OSS_URL
    }
});

mainApp.controller('mainController', function ($scope, Service, $filter) {
    $scope.service = Service;

});