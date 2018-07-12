var http = require('http');
var async = require('async');
var querystring = require('querystring');
var xml2js = require('xml2js');
let request=require('async-request');
let Math=require('math');

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
    toGrid : async function(v1,v2){
       
        var RE = 6371.00877; // 지구 반경(km)
		var GRID = 5.0;      // 격자 간격(km)
		var SLAT1 = 30.0;    // 투영 위도1(degree)
		var SLAT2 = 60.0;    // 투영 위도2(degree)
		var OLON = 126.0;    // 기준점 경도(degree)
		var OLAT = 38.0;     // 기준점 위도(degree)
		var XO = 43;         // 기준점 X좌표(GRID)
		var YO = 136;        // 기1준점 Y좌표(GRID)

		
		var DEGRAD = Math.PI / 180.0;
		var RADDEG = 180.0 / Math.PI;

			  var re = RE / GRID;
			  var slat1 = SLAT1 * DEGRAD;
			  var slat2 = SLAT2 * DEGRAD;
			  var olon  = OLON  * DEGRAD;
			  var olat  = OLAT  * DEGRAD;

			  var sn = Math.tan( Math.PI*0.25 + slat2*0.5 ) / Math.tan( Math.PI*0.25 + slat1*0.5 );
			  sn = Math.log( Math.cos(slat1) / Math.cos(slat2) ) / Math.log(sn);
			  var sf = Math.tan( Math.PI*0.25 + slat1*0.5 );
			  sf = Math.pow(sf,sn) * Math.cos(slat1) / sn;
			  var ro = Math.tan( Math.PI*0.25 + olat*0.5 );
			  ro = re * sf / Math.pow(ro,sn);
			  var rs = {};
				  rs['lat'] = v1;
				  rs['lng'] = v2;
				var ra = Math.tan( Math.PI*0.25 + (v1)*DEGRAD*0.5 );
				ra = re * sf / Math.pow(ra,sn);
				var theta = v2 * DEGRAD - olon;
				if (theta >  Math.PI) theta -= 2.0 * Math.PI;
				if (theta < -Math.PI) theta += 2.0 * Math.PI;
				theta *= sn;
				rs['x'] = Math.floor( ra*Math.sin(theta) + XO + 0.5 );
				rs['y'] = Math.floor( ro - ra*Math.cos(theta) + YO + 0.5 );
        
        return rs;
    },
    type_get :async function(x,y){
        let result;
        await this.toGrid(x,y).then(num=>{result=num});
        x=result.x;
        y=result.y;
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
        let result_ch;
        await this.toGrid(x,y).then(num=>{result_ch=num});
        x=result_ch.x;
        y=result_ch.y;
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
