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
    //오늘 게시글 조회
    let getTodayBoard = 'SELECT board_idx FROM board WHERE board_date BETWEEN ? AND ? AND board_auth = "PUBLIC" order by rand() limit 6';
    let getTodayBoardRes = await db.queryParam_Arr(getTodayBoard, [start_day, end_day]); 

    let PopularBoard = 'select board_idx, count(like_idx) as count from board_like group by board_idx order by count desc';
    let PopularResult = await db.queryParam_None(PopularBoard);
    
    if(!getTodayBoardRes || !PopularResult)
    {
        res.status(500).send({
            message : "Internal Server Error1"
        }); 
    }
    else if(getTodayBoardRes.length==0){
        res.status(201).send({
            message : "No Data"
        }); 
    }
    else {//보드 인덱스들 마다 가져오기
        let real_board_idx=[];
        var l;
        var j;
        for(l=0;l<PopularResult.length;l++){
            var flag=0;
            for(j=0;j<getTodayBoardRes.length;j++){
                if(getTodayBoardRes[j].board_idx == PopularResult[l].board_idx)
                    real_board_idx.push(getTodayBoardRes[j].board_idx);
            }
        }
        for(l=0;l<getTodayBoardRes.length;l++){
            var flag=0;
            for(j=0;j<real_board_idx.length;j++){
                if(real_board_idx[j] == getTodayBoardRes[l].board_idx)
                    break;
            }
            if(j==real_board_idx.length)
                real_board_idx.push(getTodayBoardRes[l].board_idx);
        }
        console.log(real_board_idx,getTodayBoardRes.board_idx);

        let data_res;
        let data_result=[];
        for(var k=0;k<real_board_idx.length;k++){
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
                
                if(!checkCommentInBoardRes || !selectOneBoardResult || !selectWriterOneBoardResult || !selectLikesCntResult){
                    res.status(500).send({
                        message : "Internal Server Error"
                    }); 
                    return;
                }
                else {
                    let getUserId = 'SELECT * FROM user WHERE user_idx = ?'; 
                    let getUserIdRes = await db.queryParam_Arr(getUserId, [selectWriterOneBoardResult[0].user_idx]);
                    
                    if(!getUserIdRes){
                        res.status(500).send({
                            message : "Internal Server Error1"
                        });
                        return;
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
                    
                    for (var i=0; i<len_cmt; i++){
                        comment_idx = checkCommentInBoardRes[i].comment_idx; 
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
                    board_idx : board_idx,
                    user_img : user_img,
                    user_id : user_id, 
                    board_img : selectOneBoardResult[0].board_img,
                    board_desc : selectOneBoardResult[0].board_desc, 
                    //hashtag_desc : hashtag_desc, 
                    like_cnt : selectLikesCntResult[0].count, 
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
                message : "Successfully today popular", 
                data : data_result
            }); 
        }  
}); 

module.exports = router; 