const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const upload = require('../../config/multer.js');
const jwt = require('../../module/jwt.js');

router.post('/', async function(req, res){
    let board_day = moment().format('2018-07-01');

    let start_day = board_day.concat(' 00:00:00'); 
    let end_day = board_day.concat(' 23:59:59');

    let getTodayBoard = 'SELECT * FROM board WHERE board_date BETWEEN ? AND ? AND board_auth = "PUBLIC"'; 
    let getTodayBoardRes = await db.queryParam_Arr(getTodayBoard, [start_day, end_day]); 
    if(!getTodayBoardRes){
        res.status(500).send({
            message : "Internal Server Error"
        }); 
        return; 
    }
    else if(getTodayBoardRes.length == 0){
        res.status(200).send({
            message : "No Data"
        }); 
    }
    else {
        let gender = req.body.gender; 
        let height = req.body.height;
        let size = req.body.size; 
    
        var bmi_range_min;
        var bmi_range_max;

        if(size == '마름'){
            bmi_range_min = 0;
            bmi_range_max = 18; 
        }
        else if(size =='보통'){
            bmi_range_min=19;
            bmi_range_max=22;
        }
        else if(size =='통통'){
            bmi_range_min=23;
            bmi_range_max=25;
        }
        else if(size =='뚱뚱'){
            bmi_range_min=26;
            bmi_range_max=70;
        }
    }

    let checkUserQuery = 'SELECT * from user_board where user_idx in (SELECT user_idx FROM user WHERE user_bmi BETWEEN ? and ? and user_gender = ? and user_height between ? and ?)';
    let checkUserResult = await db.queryParam_Arr(checkUserQuery, [bmi_range_min, bmi_range_max,height-2, height+2]); 
    
    let style=req.body.stylelist;
    let temp=req.body.temp;
    let weather=req.body.weather;
    
    let checkBoardQuery = 'SELECT board_idx FROM board WHERE ? between board_temp_min and board_temp_max and board_weather = ? and board_index in (SELECT board_idx from user_board where user_idx in (SELECT user_idx FROM user WHERE user_bmi BETWEEN ? and ? and user_gender = ? and user_height between ? and ?))';
    let checkBoardResult=await db.queryParam_Arr(checkBoardQuery, [temp, weather,bmi_range_min, bmi_range_max,gender, height-2, height+2]);
    
    let checkstyleQuery='SELECT * FROM board_style WHERE board_idx = ? and style_idx =(select style_idx from style_type= ?';
    let checkstyleResult;
    let real_board_idx=[];
    for(var j=0; j<checkBoardResult.length; j++){
        let check=0;
        for(var i=0;i<style.length;i++){
            checkstyleResult = await db.queryParam_Arr(checkstyleQuery, [checkstyleResult[j].board_idx, style[i]]);
            if(checkBoardrResult) check=1;
            if(check==1){
                real_board_idx.push(checkBoardResult[j].board_idx);
                break;
            }
        }
    }
})