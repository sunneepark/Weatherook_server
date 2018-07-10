const express = require('express');
const router = express.Router();
const db = require('../../../module/pool.js'); 
const moment = require('moment');

router.get('/', async function(req, res){
    
    let board_date = moment().format('YYYY-MM-DD HH:mm:ss');
    let board_day = moment().format('2018-07-01');

    let start_day = board_day.concat(' 00:00:00'); 
    let end_day = board_day.concat(' 23:59:59');

    let board_list = []; 
    let board_data; 
    let comment_arr = []; 
    let user_img; 
    //board에서 오늘의 게시글(PUBLIC)을 COUNT(LIKE_IDX)별로 가져오기 
    /*
    SELECT * 
    FROM (SELECT * 
	    FROM board 
	    WHERE board_date BETWEEN ? AND ? 
		AND board_auth = "PUBLIC") today_board, 
	like,
	board_like
    WHERE board_like.board_idx = today_boar.board_idx 
    GROUP BY board_idx
    ORDER BY COUNT(like_idx) ASC 
    */
   //today_board.board_idx, today_board.board_img, today_board.board_desc, today_board.board_date, today_board.board_weather, today_board.board_temp_min, today_board.board_temp_max, today_board.board_auth, today_board.writer_id, like.like_idx, like.like_date, like.user_idx, count(board_like.like_idx) FROM (SELECT * FROM board WHERE board_auth = "PUBLIC") today_board, weatherook.like, board_like WHERE board_like.board_idx = today_board.board_idx GROUP BY today_board.board_idx ORDER BY board_like.like_idx ASC;
    //let getTodayBoard = 'SELECT * FROM (SELECT * FROM board WHERE board_date BETWEEN ? AND ? AND board_auth = "PUBLIC") today_board, weatherook.like, board_like WHERE board_like.board_idx = today_boar.board_idx GROUP BY today_board.board_idx ORDER BY COUNT(board_like.like_idx) ASC ';
    //board_idx, board_img, board_desc, board_date, board_weather, board_temp_min, board_temp_max, board_auth, writer_id, like_idx, like_date, user_idx, board_idx, like_idx(idx별 cnt)
    let getTodayBoard = 'SELECT * FROM board WHERE board_date BETWEEN ? AND ? AND board_auth = "PUBLIC"';
    let getIdxOrderLike = 'SELECT * FROM ? GROUP BY board_idx ORDER BY count(like_idx)';
    let getTodayBoardRes = await db.queryParam_Arr(getTodayBoard, [start_day, end_day]); 

    if(!getTodayBoardRes)
    {
        res.status(500).send({
            message : "Internal Server Error1"
        }); 
    }
    else if(getTodayBoardRes.length==0){
        res.status(200).send({
            message : "No Data"
        }); 
    }
    else {
        //사용자 img 가져오기
        let getUserImg = 'SELECT u.user_img FROM user u where u.user_id = ?';
        //comment INDEX 가져오기
        let getCmtIdx = 'SELECT comment_idx FROM board_comment WHERE board_idx=?';
        let getCntLike = 'SELECT count(like_idx) FROM board_like WHERE board_idx = ?'; 
        for(var i=0; i<5; i++){
            let getCmtIdxRes = await db.queryParam_Arr(getCmtIdx, [getTodayBoardRes[0].board_idx]);
            let getUserImgRes = await db.queryParam_Arr(getUserImg, [getTodayBoardRes[0].writer_id]); 
            let getCntLikeRes = await db.queryParam_Arr(getCntLike, [getTodayBoardRes[0].board_idx]); 
            
            if(!getUserImgRes || !getCmtIdxRes || !getCntLikeRes){
                res.status(500).send({
                    message : "Internal Server Error2"
                });
                return;  
            }
            
            //사용자의 프로필 사진이 없을 때
            if(getUserImgRes.length == 0){
                user_img = null;
            }
            else {
                user_img = getUserImgRes[0].user_img; 
            }
            let getCmtInfo = 'SELECT * FROM comment WHERE comment_idx = ?'; 
            let getCmtInfoRes; 
            let comment_idx; 
            if(getCmtIdxRes.length < 2){
                flag = 0; 
                len_cmt = getCmtIdxRes.length; 
            }
            else if(getCmtIdxRes.length >= 2){
                flag = 1;
                len_cmt = 2
            }
            for(var j=0; j<len_cmt; j++){
                comment_idx = getCmtIdxRes[j].comment_idx;
                getCmtInfoRes = await db.queryParam_Arr(getCmtInfo, comment_idx);
                if(!getCmtInfoRes){
                    res.status(500).send({
                        message : "Internal Server Error3"
                    }); 
                }
                else{
                    comment_arr = comment_arr.concat(getCmtInfoRes[0]);
                }
            }
            board_data = {
                user_img : user_img, 
                user_id : getTodayBoardRes[0].writer_id,
                board_idx : getTodayBoardRes[0].board_idx,
                board_img : getTodayBoardRes[0].board_img,
                board_desc : getTodayBoardRes[0].board_desc, 
                like_cnt : getCntLikeRes[0],
                board_temp_min : getTodayBoardRes[0].board_temp_min,
                board_temp_max : getTodayBoardRes[0].board_temp_max,
                board_weather : getTodayBoardRes[0].board_weather,
                comment_list : comment_arr,
                comment_count : getCmtIdxRes.length,
                flag : flag          
            }; 
            board_list = board_list.concat(board_data);
        }
        
        res.status(200).send({
            message : "Successfully get today fashion list", 
            data : board_list
        }); 
    }
}); 

module.exports = router; 