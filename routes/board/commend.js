const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const jwt = require('../../module/jwt.js');


//추천게시물 보여주기
router.post('/', async function(req, res){
    let token = req.headers.token;
    let weather_weather=req.body.weather_weather;
    let weather_temp = parseInt(req.body.weather_temp,10);

    let user_index;
    if(token){
        //토큰을 decoding
        let decoded = jwt.verify(token);
        //decoding 실패시
        if(decoded == -1){
            return res.status(500).send({
                message : "Token Error"
            });
        }
        user_index=decoded.user_idx;
    }
    else{
        
        let weatherQuery='SELECT commend_idx, commend_img FROM board_commend WHERE commend_temp_min <= ? and commend_temp_max > ? and commend_weather= ? and commend_check=0 order by rand() limit 4';
        let weatherResult = await db.queryParam_Arr(weatherQuery, [weather_temp, weather_temp, weather_weather]);

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
    }    
});

module.exports = router;