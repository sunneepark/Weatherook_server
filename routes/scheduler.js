var cron= require('cron');
const express=require('express');
const router=express.Router();
const moment = require('moment');
const db = require('../module/pool.js'); 
const get = require('../module/get.js');


var current=0;
var insert_weather=async function(date, Data, loc_type){ //내일 날씨 저장
    for(var i=0;i<Data.length;i++){
        if(Data[i].day == 1){
            var temp_min = parseInt(Data[i].temp);
            var temp_max = parseInt(Data[i].temp);
            console.log(Data[i].temp);
            var weather_am=await get.weather_get(0,Data[i+2].wfKor[0],0);
            var weather_af=await get.weather_get(0,Data[i+5].wfKor[0],0);
            for(var j=1;j<8;j++){
                temp=parseInt(Data[i+j].temp);
                if(temp!=0){
                    if(temp_min > temp) temp_min=temp;
                    if(temp_max < temp) temp_max=temp;
                }
            }

            let insertQuery = 'INSERT INTO weather (date,temp_min, temp_max, weather_am, weather_af,date_type, loc_type) VALUES (?, ?, ?, ?, ?, ?, ?)'; 
            let insertResult = await db.queryParam_Arr(insertQuery,[date, temp_min,temp_max, weather_am,weather_af,3, loc_type]);
            if(!insertResult) console.log("wrong query");
            return;
        }
    }
}
var update_weather= async function(Data, save){ //data가 새로 들어온, save는 기존 data
    var date_type;

    var temp_min_a;
    var temp_max_a;

    if(Data[0].day ==0 ){ //오늘 일때
        date_type=2;
    }
    else date_type=3;

    for(var j=0;j<save.length;j++){
        var change_flag=0;
        if(save[j].date_type == date_type){

            temp=parseInt(Data[0].temp);
            current
            if(temp!=0){
                temp_min_a=save[j].temp_min;
                temp_max_a=save[j].temp_max;
                console.log(temp,temp_min_a);
                console.log(temp,temp_max_a);
                if(temp_min_a > temp) {
                    
                console.log(temp,temp_min_a);
                    temp_min_a=temp;
                    change_flag=1;
                }
                 
                if(temp_max_a < temp) {
                    
                console.log(temp,temp_max_a);
                    temp_max_a=temp;
                    change_flag=1;
                }
                if(change_flag==1){
                    checkBoardQuery = 'UPDATE weather SET temp_min= ? , temp_max= ? WHERE idx= ?'; 
                    checkBoardResult = await db.queryParam_Arr(checkBoardQuery,[temp_min_a,temp_max_a,save[j].idx]);
                }
            }
                            
        }
    }
    return temp;
}
var cronJob_am= cron.job("* */3 * * * *", async function(){ //3시간마다 비교

    let checkBoardQuery = 'SELECT date FROM weather WHERE date_type=2'; 
    let checkBoardResult = await db.queryParam_None(checkBoardQuery);
    
    var today=moment().format('YYYY-MM-DD');
    var tomorrow;
    var insert_flag=0;
    if(moment(today,'YYYY-MM-DD').diff(checkBoardResult[0].date,'day') != 0){ //오늘 (type=2)가 오늘이 아니면 0 삭제하고 하나씩 빼주기
        
        let checkQuery = 'DELETE FROM weather WHERE date_type=0'; 
        let checkResult = await db.queryParam_None(checkQuery);

        let checkQuery1 = 'UPDATE weather SET date_type=date_type-1'; 
        let checkResult1 = await db.queryParam_None(checkQuery1);
        console.log("update completed!");
        if(!checkResult || !checkResult1) console.log("query error today");

        tomorrow=moment(today).add(1,'days').format('YYYY-MM-DD');
        insert_flag=1;
    }
    
    let checkQuery2 = 'SELECT * FROM weather WHERE loc_type=0 AND (date_type=2 OR date_type=3)'; 
    let checkResult2 = await db.queryParam_None(checkQuery2); 
    get.getKoreanWeather("서울특별시","강남구","역삼1동",async function(error,topObj,midObj,leafObj,weather){  
        await update_weather(weather,checkResult2).then(num=>{current=num});
        if(insert_flag==1) insert_weather(tomorrow,weather,0);
    });
    
    let checkQuery3 = 'SELECT * FROM weather WHERE loc_type=1 AND (date_type=2 OR date_type=3)'; 
    let checkResult3 = await db.queryParam_None(checkQuery3);
    get.getKoreanWeather("서울특별시","영등포구","대림2동",function(error,topObj,midObj,leafObj,weather){
        update_weather(weather,checkResult3);
        if(insert_flag==1) insert_weather(tomorrow,weather,1);
    });

    let checkQuery4 = 'SELECT * FROM weather WHERE loc_type=2 AND (date_type=2 OR date_type=3)'; 
    let checkResult4 = await db.queryParam_None(checkQuery4);
    get.getKoreanWeather("서울특별시","서대문구","연희동",function(error,topObj,midObj,leafObj,weather){
        update_weather(weather,checkResult4);
        if(insert_flag==1) insert_weather(tomorrow,weather,2);
    });

    let checkQuery5 = 'SELECT * FROM weather WHERE loc_type=3 AND (date_type=2 OR date_type=3)'; 
    let checkResult5 = await db.queryParam_None(checkQuery5);
    get.getKoreanWeather("서울특별시","성북구","안암동",function(error,topObj,midObj,leafObj,weather){
        update_weather(weather,checkResult5);
        if(insert_flag==1) insert_weather(tomorrow,weather,3);
    });
});
cronJob_am.start();



module.exports = router;