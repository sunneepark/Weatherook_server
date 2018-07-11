const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js');
const jwt = require('../../module/jwt.js');
const moment = require('moment');


//유저 개인 페이지 보여주기
router.get('/', async function(req, res){
    let token = req.headers.token; 
    let decoded = jwt.verify(token);
    let data_result=[];
    let user_idx = decoded.user_idx;
    if (decoded == -1){
        res.status(400).send({
            message : "Token error"
        }); 
        connection.release();
    }
    else{
        //사용자 사진, 아이디, 소개 보여주기
        let showUserPage = 'SELECT user_img, user_id, user_desc FROM user WHERE user_idx = ? ';
        let showUserPageResult = await db.queryParam_Arr(showUserPage, [user_idx]);
        //게시물 수
        let showBoardNum = 'SELECT COUNT(board_idx) AS board_num FROM user_board WHERE user_idx=?';
        let showBoardNumResult = await db.queryParam_Arr(showBoardNum, [user_idx]);
        //팔로워 수
        let showFollowerNum = 'SELECT COUNT(user_idx) AS follower FROM follow WHERE follower_idx=?';
        let showFollowerNumResult = await db.queryParam_Arr(showFollowerNum, [user_idx]);
        //팔로잉 수
        let showFollowingNum = 'SELECT COUNT(follower_idx) AS following FROM follow WHERE user_idx=?';
        let showFollowingNumResult = await db.queryParam_Arr(showFollowingNum, [user_idx]);

        let board_idx = 'SELECT board_idx FROM user_board WHERE user_idx = ?';
        let real_board_idx = await db.queryParam_Arr(board_idx, [user_idx]);

        //let showBoardAll = 'SELECT board_img, board_desc, board_date, board_weather, board_temp_min, board_temp_max FROM board JOIN user_board  USING (board_idx) WHERE user_board.user_idx =?';
        //let showBoardAllResult = await db.queryParam_Arr(showBoardAll, [user_idx]);

        if(!real_board_idx){
            res.status(500).send({
                message : "Internal Server Error1"
            });
        }else{
        for(var k=0;k<real_board_idx.length;k++){
            let board_idx=real_board_idx[k].board_idx;

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
                console.log(selectWriterOneBoardResult);
                
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
                    user_img : user_img,
                    user_id : user_id, 
                    board_idx : selectOneBoardResult[0].board_idx,
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
            message : "Successfully total board filtering", 
            showUserPageResult,
            showBoardNumResult,
            showFollowerNumResult,
            showFollowingNumResult,
            data : data_result
        }); 
    }
    }
});


module.exports = router;
