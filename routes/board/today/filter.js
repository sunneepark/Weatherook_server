const express = require('express');
const router = express.Router();
const db = require('../../../module/pool.js'); 
const upload = require('../../../config/multer.js');
const jwt = require('../../../module/jwt.js'); 
const moment = require('moment');

router.post('/', async function(req, res){
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

    let board_day = moment().format('2018-07-01');
    let start_day = board_day.concat(' 00:00:00'); 
    let end_day = board_day.concat(' 23:59:59');

    let gender = req.body.gender;
    let height = req.body.height;
    let size = req.body.size;

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
    //오늘이면서 성별/키/신체인 board_idx와 user_idx 뽑기
    let getBoardInUser = "SELECT * FROM user_board WHERE board_idx IN (SELECT board_idx FROM board WHERE board_date BETWEEN ? AND ? AND board_auth = 'PUBLIC') AND user_idx IN (SELECT user_idx FROM user WHERE user_gender = ? AND user_bmi BETWEEN ? AND ? AND user_height BETWEEN ? AND ?) "
    let getBoardInUserRes = await db.queryParam_Arr(getBoardInUser, [start_day, end_day, gender, bmi_range_min, bmi_range_max, height-2, height+2]);

    if(!getBoardInUserRes){
        res.status(500).send({
            message : "Internal Server Error"
        }); 
        return; 
    }

    //let checkUserQuery = 'SELECT * from user_board where user_idx in (SELECT user_idx FROM user WHERE user_bmi BETWEEN ? and ? and user_gender = ? and user_height between ? and ?)';
    //let checkUserResult = await db.queryParam_Arr(checkUserQuery, [bmi_range_min, bmi_range_max,height-2, height+2]); 
    
    let style=req.body.stylelist;
    let checkBoardQuery = 'SELECT * FROM user_board WHERE board_idx IN (SELECT board_idx FROM board WHERE board_date BETWEEN ? AND ? AND board_auth = "PUBLIC") AND user_idx IN (SELECT user_idx FROM user WHERE user_gender = ? AND user_bmi BETWEEN ? AND ? AND user_height BETWEEN ? AND ?)';
    let checkBoardResult=await db.queryParam_Arr(checkBoardQuery, [start_day, end_day, gender, bmi_range_min, bmi_range_max, height-2, height+2]);
    let checkstyleQuery='SELECT * FROM board_style WHERE board_idx = ? and style_idx =(select style_idx from style where style_type= ?)';
    let checkstyleResult;
    let real_board_idx=[];

    //console.log(checkBoardResult);
    //스타일과 보드를 비교함.
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
    console.log(real_board_idx.length);
    //필터링 결과로 게시글 출력
    let board_list = []; 
    for(var i = 0; i<real_board_idx.length; i++){
        let board_idx = real_board_idx[i]; 
        let comment_idx;
        let comment_arr = [];
        let like_flag=0;
        if(!board_idx){
            res.status(400).send({
                message : "Null Value"
            });
        }
        else {
            //필터링한 보드 정보
            let getBoardInFilter = 'SELECT * FROM board WHERE board_idx = ?'; 
            let getBoardInFilterRes = await db.queryParam_Arr(getBoardInFilter, [board_idx]); 
            
            //필터링한 보드의 작성자 이미지 
            let getUserImgInFilter = 'SELECT * FROM user WHERE user_idx IN (SELECT user_idx FROM user_board WHERE board_idx = ?)'; 
            let getUserImgInFilterRes = await db.queryParam_Arr(getUserImgInFilter, [board_idx]); 

            //필터링한 보드의 좋아요 수
            let getLikeCntInFilter = 'SELECT count(*) FROM board_like WHERE board_idx = ?';
            let getLikeCntInFilterRes = await db.queryParam_Arr(getLikeCntInFilter, [board_idx]);
        
            //comment를 가져오기 위한 board_comment와 comment 테이블 접근
            let checkCommentInBoard = 'SELECT * FROM board_comment WHERE board_idx = ?'; 
            let checkCommentInBoardRes = await db.queryParam_Arr(checkCommentInBoard, [board_idx]); 
            
            if(user_user_idx){
                console.log(user_user_idx);
                //like flag를 가져오기 위한 user 테이블 비교
                let checkLikeInBoard = 'select * from weatherook.like where user_idx = ? and like_idx in (select like_idx from board_like where board_idx=?);'; 
                let checkLikeInBoardRes = await db.queryParam_Arr(checkLikeInBoard, [user_user_idx, board_idx]); 
                console.log(checkLikeInBoardRes);
                if(checkLikeInBoardRes.length>0) like_flag=1;
            }

            if(!getBoardInFilterRes || !getUserImgInFilterRes || !getLikeCntInFilterRes || !checkCommentInBoardRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }
            else {
                
                let getUserId = 'SELECT * FROM user WHERE user_id = ?'; 
                let getUserIdRes = await db.queryParam_Arr(getUserId, [getBoardInFilterRes[0].writer_id]);
                
                if(!getUserIdRes){
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return
                }
                //console.log("getUserImgInFilterRes : ", getUserImgInFilterRes)
                user_id = getUserImgInFilterRes[0].user_id;
               // console.log("user_id : ", user_id);
                user_img = getUserImgInFilterRes[0].user_img; 
                
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
                            mesasge : "Internal Server Error"
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
                board_idx : getBoardInFilterRes[0].board_idx,
                board_img : getBoardInFilterRes[0].board_img,
                board_desc : getBoardInFilterRes[0].board_desc, 
                //hashtag_desc : hashtag_desc, 
                like_cnt : getLikeCntInFilterRes[0].count, 
                like_flag : like_flag,
                board_temp_min : getBoardInFilterRes[0].board_temp_min, 
                board_temp_max : getBoardInFilterRes[0].board_temp_max,
                board_weather : getBoardInFilterRes[0].board_weather,
                board_date : moment(getBoardInFilterRes[0].board_date).format('MM-DD'),
                comment_list : comment_arr,
                comment_cnt : checkCommentInBoardRes.length,
                flag : flag
            }
            board_list = board_list.concat(data_res);
        }
    }
    res.status(200).send({
        message : "Successfully today board filtering",
        data : board_list
    });
})

module.exports = router;