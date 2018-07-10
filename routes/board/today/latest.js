var express = require('express');
var router = express.Router();
const db = require('../../../module/pool.js'); 
const moment = require('moment');

router.get('/', async function(res, res){
    let board_date = moment().format('MM-DD');
    let board_day = moment().format('2018-07-01');

    let start_day = board_day.concat(' 00:00:00'); 
    let end_day = board_day.concat(' 23:59:59');

    let board_list = []; 

    let getTodayBoard = 'SELECT * FROM board WHERE board_date BETWEEN ? AND ? AND board_auth = "PUBLIC"'; 
    let getTodayBoardRes = await db.queryParam_Arr(getTodayBoard, [start_day, end_day]); 
    if(!getTodayBoardRes)
    {
        res.status(500).send({
            message : "Internal Server Error"
        }); 
    }
    else if(getTodayBoardRes.length==0){
        res.status(200).send({
            message : "No Data"
        }); 
    }
    else {
        console.log(getTodayBoardRes)
    }
})

module.exports = router; 