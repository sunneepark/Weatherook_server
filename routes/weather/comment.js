const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');
//날씨 감성글 보여주기
router.post('/', async function(req, res){
    let weather_temp=req.body.weather_temp;
    let weather_weather=req.body.weather_weather;

    if(!weather_temp && !weather_weather){
        res.status(400).send({
            message : "No weather info"
        }); 
    }
    else{
        let checkweatherQuery='SELECT weather_text_temp, weather_text_weather FROM weather_show WHERE weather_temp_min <= ? and weather_temp_max > ? and weather_weather= ? ';
        let checkweatherResult = await db.queryParam_Arr(checkweatherQuery, [weather_temp, weather_temp, weather_weather]);
        
        if(!checkweatherResult){
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        else{
            res.status(201).send({
                message : "Successfully get One board", 
                data : checkweatherResult[0]
            }); 
        }
    }
    
}); 

module.exports = router; 
