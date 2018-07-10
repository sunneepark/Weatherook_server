var http = require('http');
var async = require('async');
var querystring = require('querystring');
var xml2js = require('xml2js');
let request=require('async-request');

var http_get = function(url, data, callback) {
 
    var query = querystring.stringify(data);
    if (query !== '')
        url = url + '&' + query;
 
 
    http.get(url, function(res) {
            var body = '';
            res.setEncoding('utf8');
 
            res.on('readable', function() {
                var chunk = this.read() || '';
 
                body += chunk;
            });
 
            res.on('end', function() {
                callback(body);
                return body;
            });
 
            res.on('error', function(e) {
                console.log('error', e.message);
            });
        });
};
 
// 기상청 API를 사용
// 한국 도시와 법정동을 사용해 X, Y 좌표 구한다.
// top : 도, mid : 시/군/구, leaf : 읍/면/동
module.exports={
    weather_get : async function(type_, weather_,flag){ //flag가 0이면 맑음 -> 0 / 1이면 0->맑음
        let type;
        let weather;
        if(flag==0){
            if(weather_=='맑음') type=0;
            else if(weather_=='구름 조금') type=1;
            else if(weather_=='구름 많음') type=2;
            else if(weather_=='흐림') type=3;
            else if(weather_=='비') type=4;
            else if(weather_=='눈/비') type=5;
            else if(weather_=='눈') type=6;
            return type;
        }
        else if(flag==1){
            if(type_==0) weather='맑음';
            else if(type_==1) weather='구름 조금';
            else if(type_==2) weather='구름 많음';
            else if(type_==3) weather='흐림';
            else if(type_==4) weather='비';
            else if(type_==5) weather='눈/비';
            else if(type_==6) weather=='눈';
            return weather;
        }
    },
    type_get :async function(x,y){
        let loc_type;
        if(x>=61){
            if(y<=125) loc_type=0;
            else loc_type=3;
        }
        else{
            if(y<=125) loc_type=1;
            else loc_type=2;
        }
        return loc_type;
    },
    http_gets : async function(x, y){
        var response;
        var result;
        try{
            response=await request('http://www.kma.go.kr/wid/queryDFS.jsp?gridx=' + x + '&gridy=' + y);
        }catch(e){
        }
        xml2js.parseString(response.body, function(err, obj) {
            result=obj.wid.body[0].data;
        });
        return result;
    },
    getKoreanWeather : async function(top, mid, leaf, callback) {
   
    async.waterfall([
        // 도/시 검색
        function(callback) {
            http_get('http://www.kma.go.kr/DFSROOT/POINT/DATA/top.json.txt', {}, function(resData) {
                var topObj = JSON.parse(resData);
                for (var i = 0; i < topObj.length; i++) {
                    if (topObj[i].value == top) {
                        callback(null, topObj[i]);
                        return;
                    }
                }
                callback('Can not find top', top);
            });
        },
        // 시/구/군 검색
        function(topObj, callback) {
            http_get('http://www.kma.go.kr/DFSROOT/POINT/DATA/mdl.' + topObj.code + '.json.txt', {}, function(resData) {
                var midObj = JSON.parse(resData);
                if (mid === '') {
                    callback(null, topObj, midObj[0]);
                    return;
                } else {
                    for (var i = 0; i < midObj.length; i++) {
                        if (midObj[i].value == mid) {
                            //console.log(midObj[i]);
                            callback(null, topObj, midObj[i]);
                            return;
                        }
                    }
                }
                callback('Can not find mid', topObj, mid);
            });
        },
        // 읍/면/동 검색
        function(topObj, midObj, callback) {
            http_get('http://www.kma.go.kr/DFSROOT/POINT/DATA/leaf.' + midObj.code + '.json.txt', {}, function(resData) {
                var leafObj = JSON.parse(resData);
               // console.log(leafObj);
                if (leaf === '') {
                    callback(null, topObj, midObj, leafObj[0]);
                    return;
                } else {
                    for (var i = 0; i < leafObj.length; i++) {
                        if (leafObj[i].value == leaf) {
                            //console.log(leafObj[i]);
                            callback(null, topObj, midObj, leafObj[i]);

                            return;
                        }
                    }
                }
                callback('Can not find leaf', topObj, midObj, leaf);
            });
        },
        // 날씨 검색
        function(topObj, midObj, leafObj, callback) {
            http_get('http://www.kma.go.kr/wid/queryDFS.jsp?gridx=' + leafObj.x + '&gridy=' + leafObj.y, {}, function(resData) {
                xml2js.parseString(resData, function(err, obj) {
                    if (err) {
                        callback(err, topObj, midObj, leafObj, null);
                    } else {
                        callback(null, topObj, midObj, leafObj, obj.wid.body[0].data);

                    }
                });
            });
        }
    ], function(error, topObj, midObj, leafObj, weather) {
        callback(error, topObj, midObj, leafObj, weather);
        return weather;
    });
    }
}
