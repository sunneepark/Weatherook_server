const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js');
const jwt = require('../../module/jwt.js');


//유저 개인 페이지 보여주기
router.get('/', async function(req, res){
    let token = req.headers.token; 
    let decoded = jwt.verify(token);
    
    if (decoded == -1){
        res.status(400).send({
            message : "Token error"
        }); 
    }
    else{ 
        let user_idx = decoded.user_idx;

        //사용자 사진, 아이디, 소개 보여주기
        let showUserPage = 'SELECT user_img, user_id, user_desc FROM user WHERE user_idx = ? ';
        let showUserPageResult = await db.queryParam_Arr(showUserPage, [user_idx]);
        //게시물 수
        let showBoardNum = 'SELECT COUNT(board_idx) AS board_num FROM user_board WHERE user_idx=?';
        let showBoardNumResult = await db.queryParam_Arr(showBoardNum, [user_idx]);
        //팔로워 수
        let showFollowerNum = 'SELECT COUNT(user_idx) AS follwer FROM follow WHERE follower_idx=?';
        let showFollowerNumResult = await db.queryParam_Arr(showFollowerNum, [user_idx]);
        //팔로잉 수
        let showFolloingNum = 'SELECT COUNT(follower_idx) AS following FROM follow WHERE user_idx=?';
        let showFollogingNumResult = await db.queryParam_Arr(showFolloingNum, [user_idx]);

        let showBoardAll = 'SELECT board_img, board_desc, board_date, board_weather, board_temp_min, board_temp_max FROM board JOIN user_board  USING (board_idx) WHERE user_board.user_idx =?';
        let showBoardAllResult = await db.queryParam_Arr(showBoardAll, [user_idx]);

        let showCommentInBoard = 'SELECT  board_idx FROM user_board where user_idx = ?';
        let showCommentInBoardResult = await db.queryParam_Arr(showCommentInBoard, [user_idx]);

        for(var i=0; i<showCommentInBoardResult.length; i++){
            let showBoardComment = 'SELECT comment_desc, comment_id FROM comment JOIN board_comment USING(comment_idx) where board_idx = ?';
            let showBoardCommentResult = await db.queryParam_Arr(showBoardComment, [showCommentInBoardResult[0].board_idx]);

            if(!showBoardCommentResult|| !showUserPageResult || !showBoardNumResult || !showFollowerNumResult || !showFollogingNumResult || !showBoardAllResult || !showCommentInBoardResult ){
                res.status(500).send({
                    message : "Internal Server Error" 
                });
            }
            else{
                res.status(201).send({
                    message : "show Personal Board Img success",
                    data:{
                    showUserPageResult,
                    showBoardNumResult,
                    showFollowerNumResult,
                    showFollogingNumResult,
                    showBoardAllResult,
                    showBoardCommentResult
                    }
                });
            }
        }
    }
});

module.exports = router;