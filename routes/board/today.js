const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const upload = require('../../config/multer.js'); 
const moment = require('moment');
const jwt = require('../../module/jwt.js');

router.get('/', async function(req, res){
    
    let board_date = moment().format('YYYY-MM-DD HH:mm:ss');
    let board_day = moment().format('YYYY-MM-DD');

    let start_day = board_day.concat(' 00:00:00'); 
    let end_day = board_day.concat(' 23:59:59');

    //board에서 오늘의 게시글을 가져오기 
    let getDateInBoard = 'SELECT * FROM board WHERE board_date BETWEEN ? AND ?';
    let getDateInBoardRes = await db.queryParam_Arr(getDateInBoard, [start_day, end_day]); 
    
    let res_board = {
        
    }
    
    if(!getDateInBoardRes){
        res.status(500).send({
            message : "Internal Server Error"
        }); 
    }
    else {
        res.status(200).send({
            message : "Successfully get today fashion list"
        })
    }
}); 