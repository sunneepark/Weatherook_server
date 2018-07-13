const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const upload = require('../../config/multer.js');
const jwt = require('../../module/jwt.js');
const moment = require('moment');

router.post('/',upload.single('board_img'), async function(req, res){
    let gender=req.body.gender;
    let height=parseInt(req.body.height);
    let size=req.body.size;
    if(!gender) gender="여";
    if(!height) height=160;
    if(!size) size="보통";

    let token = req.headers.token; 
    let user_user_idx;
    if(token){
        let decoded = jwt.verify(token);
    
        if (decoded == -1){
            res.status(500).send({
                message : "Token error"
            }); 
        }
        user_user_idx = decoded.user_idx;
    }
    var bmi_range_min;
    var bmi_range_max;

    if(size =='마름'){
        bmi_range_min=0;
        bmi_range_max=18;
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
    //let checkUserQuery = 'SELECT * from user_board where user_idx in (SELECT user_idx FROM user WHERE user_bmi BETWEEN ? and ? and user_gender = ? and user_height between ? and ?)';
    //let checkUserResult = await db.queryParam_Arr(checkUserQuery, [bmi_range_min, bmi_range_max,height-2, height+2]); 
    
    let style=req.body.stylelist;
 
    let temp=parseInt(req.body.temp);
    let weather=req.body.weather;
    if(!temp) temp=26;
    if(!weather) weather=0;
    let checkBoardQuery = 'SELECT board_idx FROM board WHERE ? between board_temp_min and board_temp_max and board_weather = ? and board_auth=\'public\' and board_idx in (SELECT board_idx from user_board where user_idx in (SELECT user_idx FROM user WHERE user_bmi BETWEEN ? and ? and user_gender = ? and user_height between ? and ?))';
    let checkBoardResult=await db.queryParam_Arr(checkBoardQuery, [temp, weather,bmi_range_min, bmi_range_max,gender, height-2, height+2]);
    
    let checkstyleQuery='SELECT * FROM board_style WHERE board_idx = ? and style_idx =(select style_idx from style where style_type= ?)';
    let checkstyleResult;
    let real_board_idx=[];

    //console.log(checkBoardResult);
    //스타일과 보드를 비교함.
    if(style){
        for(var j=0;j<checkBoardResult.length;j++){
            let check=0;
            for(var i=0;i<style.length;i++){
                checkstyleResult = await db.queryParam_Arr(checkstyleQuery, [checkBoardResult[j].board_idx, style[i]]);
                
                if(checkstyleResult.length != 0) check=1;
                if(check==1){
                    real_board_idx.push(checkBoardResult[j].board_idx);
                    break;
                }
            }
        }
    }
    else{
        for(var j=0;j<checkBoardResult.length;j++){
        
               real_board_idx.push(checkBoardResult[j].board_idx);

        }
    }
   
    console.log(real_board_idx);
    let data_res;
    let data_result=[];
    for(var k=0;k<real_board_idx.length;k++){
        let like_flag=0;
        let board_idx=real_board_idx[k];
        let comment_idx;
        let comment_arr = []; 
        let user_id;
        let user_img;
        var flag; //댓글이 2개 이상인지 확인하는 flag
        //board_idx 게시글이 존재하는지 확인
        //board_idx 입력 오류 
        if(!board_idx){
            res.status(400).send({
                message : "Null Value"
            }); 
        }
        else {
            let selectOneBoardQuery = 'SELECT * FROM board WHERE board_idx = ?'; 
            let selectOneBoardResult = await db.queryParam_Arr(selectOneBoardQuery, [board_idx]); 
            
            //user_idx를 가져오기 위한 user_board 테이블에 접근
            let selectWriterOneBoardQuery = 'SELECT * FROM user_board WHERE board_idx = ?'; 
            let selectWriterOneBoardResult = await db.queryParam_Arr(selectWriterOneBoardQuery, [board_idx]);
            
            //like_cnt를 가져오기 위한 board_like와 like 테이블 접근
            let selectLikesCnt = 'SELECT count(*) as count FROM board_like WHERE board_idx = ?';
            let selectLikesCntResult = await db.queryParam_Arr(selectLikesCnt, [board_idx]);
            
            //comment를 가져오기 위한 board_comment와 comment 테이블 접근
            let checkCommentInBoard = 'SELECT * FROM board_comment WHERE board_idx = ?'; 
            let checkCommentInBoardRes = await db.queryParam_Arr(checkCommentInBoard, [board_idx]); 
            if(user_user_idx){
                //like flag를 가져오기 위한 user 테이블 비교
                let checkLikeInBoard = 'select * from weatherook.like where user_idx = ? and like_idx in (select like_idx from board_like where board_idx=?);'; 
                let checkLikeInBoardRes = await db.queryParam_Arr(checkLikeInBoard, [user_user_idx, board_idx]); 
                
                if(checkLikeInBoardRes.length>0) like_flag=1;
            }
            if(!checkCommentInBoardRes || !selectOneBoardResult || !selectWriterOneBoardResult || !selectLikesCntResult){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }
            else {
                let getUserId = 'SELECT * FROM user WHERE user_idx = ?'; 
                let getUserIdRes = await db.queryParam_Arr(getUserId, [selectWriterOneBoardResult[0].user_idx]);
                
                if(!getUserIdRes){
                    res.status(500).send({
                        message : "Internal Server Error1"
                    });
                    return
                }
                user_id = getUserIdRes[0].user_id;
                user_img = getUserIdRes[0].user_img; 
                
                //let getCommentInfo = 'SELECT * FROM comment c, (SELECT user_img FROM user u, board b WHERE u.user_id = b.writer_id) u WHERE comment_idx = ?'; 
                //let getCommentInfoRes;
                let getCommentInfo = 'SELECT * FROM comment WHERE comment_idx = ?'; 
                let getCommentInfoRes;
                
                var len_cmt; 
                if(checkCommentInBoardRes.length > 2){
                    flag = 1; //댓글 수가 2개 이상일 때 flag = 1
                    len_cmt = 2 //board에서 뿌려줄 comment 수는 2개
                }
                else {
                    flag = 0; //댓글 수가 2개보다 적을 때는 flag = 0
                    len_cmt = checkCommentInBoardRes.length //board에서 뿌려줄 comment 수는 원래 코멘트 수와 같다. 
                }
                
                for (var l=0; l<len_cmt; l++){
                    comment_idx = checkCommentInBoardRes[l].comment_idx; 
                    getCommentInfoRes = await db.queryParam_Arr(getCommentInfo, [comment_idx]); 
                    if(!getCommentInfoRes){
                        res.status(500).send({
                            mesasge : "Internal Server Error2"
                        }); 
                    }
                    else {
                        comment_arr = comment_arr.concat(getCommentInfoRes[0]);
                    }
                }
            }
            data_res = {
                user_img : user_img,
                user_id : user_id, 
                board_idx : selectOneBoardResult[0].board_idx,
                board_img : selectOneBoardResult[0].board_img,
                board_desc : selectOneBoardResult[0].board_desc, 
                //hashtag_desc : hashtag_desc, 
                like_cnt : selectLikesCntResult[0].count, 
                like_flag : like_flag,
                board_temp_min : selectOneBoardResult[0].board_temp_min, 
                board_temp_max : selectOneBoardResult[0].board_temp_max,
                board_weather : selectOneBoardResult[0].board_weather,
                board_date : moment(selectOneBoardResult[0].board_date).format('MM-DD'),
                comment_list : comment_arr,
                comment_cnt : checkCommentInBoardRes.length,
                flag : flag
            }
        }
        data_result.push(data_res);
    }
        res.status(201).send({
            message : "Successfully total board filtering", 
            data : data_result
        }); 
    
});

module.exports = router;