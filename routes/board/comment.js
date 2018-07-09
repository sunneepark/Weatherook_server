const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');
const moment = require('moment');
const jwt = require('../../module/jwt.js');

router.post('/', async function(req, res){
    //댓글 등록시 접근 테이블 : comment, board_comment, user_comment 
    let board_idx = req.body.board_idx; 
    let comment_desc = req.body.comment_desc;
    let token = req.headers.token; 

    let decoded = jwt.verify(token); 
    if(!board_idx){
        res.status(400).send({
            message : "Null Value"
        }); 
    }
    else{
        if(decoded == -1){
            res.status(400).send({
                mesasge : "Token Error"
            }); 
            return; 
        }
        
        let user_idx = decoded.user_idx;
        

        let insertComment = 'INSERT INTO comment (comment_desc, comment_id) VALUES(?, (SELECT user_id FROM user WHERE user_idx= ?));'; 
        let insertCommentRes = await db.queryParam_Arr(insertComment, [comment_desc, user_idx]);
        if(!insertCommentRes){
            res.status(500).send({
                mesasge : "Internal Server Error"
            }); 
        }
        else {
            let comment_idx = insertCommentRes.insertId; 
            let insertCommentUser = 'INSERT INTO user_comment (comment_idx, user_idx) VALUES (?, ?)';
            let insertCommentBoard = 'INSERT INTO board_comment (comment_idx, board_idx) VALUES (?, ?)'; 
            let insertCommentUserRes = await db.queryParam_Arr(insertCommentUser, [comment_idx, user_idx]);
            let insertCommentBoardRes = await db.queryParam_Arr(insertCommentBoard, [comment_idx, board_idx, ]); 
            if(!insertCommentUserRes || !insertCommentBoardRes){
                res.status(500).send({
                    message : "Internal Server Error"
                });
                return;  
            }
            else{
                res.status(201).send({
                    message : "Successfully register comment",
                    comment_idx : comment_idx
                });
            }
        }
    }
});

router.put('/:board_idx', async function(req, res){
    //댓글 수정을 위해 
    // 1. board_idx로 board_comment에 접근하여 comment_idx 정보 확인
    // 2. comment_idx를 작성한 사용자와 token 유저가 일치하는지 확인
    // 3. UPDATE comment SET comment_desc = ? WHERE comment_idx = ? 
    let board_idx = req.params.board_idx;
    let comment_idx = req.body.comment_idx; 
    let comment_desc = req.body.comment_desc;
    let token = req.headers.token;

    if(!comment_idx){
        res.status(400).send({
            message : "Null Value"
        }); 
        return; 
    }

    let decoded = jwt.verify(token);
    if(decoded == -1){
        res.status(400).send({
            message : "Token Error"
        }); 
    }
    else {
        let getCmtInBoard = 'SELECT * FROM board_comment WHERE board_idx = ? AND comment_idx = ?'; 
        let getCmtInBoardRes = await db.queryParam_Arr(getCmtInBoard, [board_idx, comment_idx]);
        if(!getCmtInBoardRes){
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        else if(getCmtInBoardRes.length == 0) {
            res.status(400).send({
                message : "Null Value"
            }); 
        }
        else {
            let user_idx = decoded.user_idx;
            
            //comment_idx로 user_idx를 user_comment 테이블에서 가져오자
            let getUserInCmt = 'SELECT * FROM user_comment WHERE comment_idx = ?'; 
            let getUserInCmtRes = await db.queryParam_Arr(getUserInCmt, [comment_idx]); 
            if(!getUserInCmtRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
                return; 
            }
            else {
                if(getUserInCmtRes[0].user_idx == user_idx){
                    let updateCmt = 'UPDATE comment SET comment_desc=? WHERE comment_idx =?'; 
                    let updateCmtRes = await db.queryParam_Arr(updateCmt, [comment_desc, comment_idx]);
                    if(!updateCmtRes){
                        res.status(500).send({
                            message : "Internal Server Error"
                        }); 
                    }
                    else {
                        res.status(201).send({
                            message : "Successfully update comment", 
                            comment_idx : comment_idx
                        }); 
                    }
                }
            }
        }
    }
})

router.delete('/', async function(req, res){
    let comment_idx = req.body.comment_idx; 
    let token = req.headers.token; 
    let board_idx = req.body.board_idx; 

    //1. board_idx로 board_comment 테이블에 comment_idx 정보 확인
    //2. comment_idx로 user_idx와 token에 담긴 사용자 정보가 일치하는지 확인
    //3. DELETE FROM comment WHERE comment_idx = ? 

    let decoded = jwt.verify(token);
    if (decoded == -1){
        res.status(500).send({
            message : "Token Error"
        }); 
    }
    else {
        let checkCmtInBoard = 'SELECT * FROM board_comment WHERE board_idx = ? AND comment_idx=?'; 
        let checkCmtInBoardRes = await db.queryParam_Arr(checkCmtInBoard, [board_idx, comment_idx]); 

        if(!checkCmtInBoardRes){
            res.status(500).send({
                mesage : "Internsal Server Error1"
            }); 
        }
        else if(checkCmtInBoardRes.length == 0){ //삭제할 코멘트가 게시글에 달려있지 않을때!
            res.status(400).send({
                message : "Null Value"
            });
        }
        else{ //코멘트가 존재
            let user_idx = decoded.user_idx; 
            let checkUserInCmt = 'SELECT * FROM user_comment WHERE comment_idx = ? AND user_idx = ?'; 
            let checkUserInCmtRes = await db.queryParam_Arr(checkUserInCmt, [comment_idx, user_idx]);
    
            if(!checkUserInCmtRes){
                res.status(500).send({
                    message : "Internal Server Error2"
                }); 
            }
            else if(checkUserInCmtRes.length == 0){
                res.status(400).send({
                    message : "Null Value"
                }); 
            }
            else{
                let delCmtInfo = 'DELETE FROM comment WHERE comment_idx=?'; 
                let delCmtInfoRes = await db.queryParam_Arr(delCmtInfo, [comment_idx]); 
    
                if(!delCmtInfoRes){
                    res.status(500).send({
                        message : "Internal Server Error3"
                    }); 
                }
                else {
                    res.status(201).send({
                        message : "Successfully delete comment"
                    });
                }
            }   
        }
    }
}); 

router.get('/:board_idx', async function(req, res){
    let board_idx = req.params.board_idx; 

    let comment_arr = []; 
    //comment를 가져오기 위한 board_comment와 comment 테이블 접근
    let checkCmtInBoard = 'SELECT * FROM board_comment WHERE board_idx = ?'; 
    let checkCmtInBoardRes = await db.queryParam_Arr(checkCmtInBoard, [board_idx]); 

    if(!checkCmtInBoardRes){
        res.status(500).send({
            message : "Internal Server Error"
        }); 
    }
    else if(checkCmtInBoardRes.length == 0){
        //댓글이 없음
        comment_arr = null; 
    }
    else {
        //댓글이 있음
        let getCommentInfo = 'SELECT * FROM comment c, (SELECT user_img FROM user u, board b WHERE u.user_id = b.writer_id) u WHERE comment_idx = ?'; 
        let getCommentInfoRes;
        for (var i=0; i<checkCmtInBoardRes.length; i++){
            comment_idx = checkCmtInBoardRes[i].comment_idx; 
            getCommentInfoRes = await db.queryParam_Arr(getCommentInfo, [comment_idx]); 
            if(!getCommentInfoRes){
                res.status(500).send({
                    message : "Internal Server Error"
                });
            }
            else {
                comment_arr = comment_arr.concat(getCommentInfoRes[0]); 
            }
        }
    }

    let data_res = {
        user_id : getCommentInfoRes[0].writer_id,
        comment_desc : getCommentInfoRes[0].comment_desc,
        comment_date : getCommentInfoRes[0].comment_date, 
        user_img : getCommentInfoRes[0].user_img
    }

    res.status(200).send({
        message : "Successfully get comment list",
        data : data_res
    });
})

module.exports = router; 

