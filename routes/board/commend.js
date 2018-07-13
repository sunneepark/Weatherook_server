const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const jwt = require('../../module/jwt.js');
const get = require('../../module/get.js');

//추천게시물 보여주기
router.post('/', async function(req, res){
    let token = req.headers.token;
    let user_idx;
    if(token){
        let decoded = jwt.verify(token);
        //decoding 실패시
        if(decoded == -1){
            res.status(500).send({
                message : "Token Error"
            });
            return;
        }
        
        user_idx = decoded.user_idx;
    }
    //지역
    let x=req.body.x;
    let y=req.body.y;
    let date_type=req.body.date_type;
    let loc_type; 
    if(!x || !y){
        loc_type=0;
    }
    else{
        await get.type_get(x,y).then(num=>{loc_type=num});//지역 type
    }
    
    let checkweatherQuery = "SELECT * FROM weather WHERE date_type= ? and loc_type= ?"; 
    let checkweatherResult = await db.queryParam_Arr(checkweatherQuery, [date_type, loc_type]);
    
    console.log(checkweatherResult);
    let weather_temp=(parseInt(checkweatherResult[0].temp_min)+parseInt(checkweatherResult[0].temp_max))/2;
    weather_temp=parseInt(weather_temp);
    console.log(weather_temp);
    let weatherQuery;
    let weatherResult;
    
    if(user_idx){ //유저가 있을 때
        weatherQuery='select commend_idx, commend_img,commend_ref,commend_gender from board_commend where commend_temp between ? and ? and commend_check=0 and commend_gender =(select user_gender from user where user_idx= ?) and commend_style in (select style_idx from user_style where user_idx=?) order by rand() limit 5';
        weatherResult= await db.queryParam_Arr(weatherQuery, [weather_temp-2, weather_temp+4, ,user_idx, user_idx]);

    }
    else{
        console.log("no user");
        weatherQuery='SELECT commend_idx, commend_img,commend_ref FROM board_commend WHERE commend_temp between ? and ? and commend_check=0 order by rand() limit 5';
        weatherResult= await db.queryParam_Arr(weatherQuery, [weather_temp-2, weather_temp+4]);
    }
        console.log(weatherResult);
        let weatherupdateQuery='UPDATE board_commend SET commend_check=0';
        let weatherupdateResult = await db.queryParam_None(weatherupdateQuery);

        if (!weatherResult){ //쿼리 에러
            res.status(500).send({
                message : "Internal Server Error1"
            }); 
        }
        else{
            res.status(201).send({
                message : "Successfully get today fashion list",
                data : weatherResult
            });
            var change="";
            for(var i=0;i<weatherResult.length;i++){
                change=change.concat(weatherResult[i].commend_idx);
                if(i!=weatherResult.length-1)
                    change=change.concat(", ");
            }
            weatherQuery='UPDATE board_commend SET commend_check = 1 WHERE commend_idx in ('+change+')';
            weatherResult = await db.queryParam_Arr(weatherQuery);
            if(!weatherResult){
                console.log("no update");
            }
        }
});

module.exports = router;