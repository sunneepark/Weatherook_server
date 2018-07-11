const express = require('express');
const router = express.Router();
const get = require('../../module/get.js');
const sc=require('../scheduler.js');

router.get('/', async function(req, res){
    let result;
    get.getKoreanWeather("서울특별시","중구","필동",function(error,topObj,midObj,leafObj,weather){
        console.log(weather[1]);
    });
    //var current;
    //current = sc.getcurrent().current;
    //console.log(current);
});

module.exports=router;
