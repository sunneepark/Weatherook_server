const express = require('express');
const router = express.Router();
const get = require('../../module/get.js');
const db = require('../../module/pool.js');

router.post('/', async function(req, res){
    //지역
    let x=req.body.x;
    let y=req.body.y;
    if(!x || !y){
        res.status(400).send({
            message : "null value"
        }); 
        return;
    }
    let weather= await get.http_gets(x,y);
    let weather_arr=[];
    
    for(var i=0;i<6;i++){
        let weather_temp={
            hour:weather[i].hour[0],
            weather:await get.weather_get(0,weather[i].wfKor[0],0),
            temp:parseInt(weather[i].temp)
        }
        weather_arr.push(weather_temp);
    }
    res.status(201).send({
        message:"successfully get weather",
        data : weather_arr
    });

});

module.exports=router;