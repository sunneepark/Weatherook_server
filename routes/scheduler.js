var cron= require('cron');
const express=require('express');
const router=express.Router();
const get = require('../module/get.js');

var cronJob= cron.job("*/1 * * * *", function(){
    //let weather= await get.http_gets(x,y);
    console.log("dfsd");
});
cronJob.start();