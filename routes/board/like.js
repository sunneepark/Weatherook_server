const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const jwt = require('../../module/jwt.js');

//좋아요 누를 때
router.post('/', async function(req, res){
    let token = req.headers.token;
    let board_idx = req.body.board_idx; 
    
    if (!board_idx){
        res.status(400).send({
            message : "Null Values"
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
        let user_idx = decoded.user_idx; 
        let checkDupLikeInBoard = 'SELECT * FROM board_like WHERE board_idx =?'
        let checkDupLikeInBoardRes = await db.queryParam_Arr(checkDupLikeInBoard, [board_idx]);
        if (!checkDupLikeInBoardRes){
            res.status(500).send({
                message : "Internal Server Error"
            }); 
            return; 
        }

        let checkDupLike = 'SELECT * FROM weatherook.like WHERE like_idx = ?'
        for (var i=0; i<checkDupLikeInBoardRes.length; i++){
            let checkDupLikeRes = await db.queryParam_Arr(checkDupLike, checkDupLikeInBoardRes[i].like_idx)
            

            if(!checkDupLikeRes){
                res.status(500).send({
                    message : "Internal Server Error"
                });
            }
            else if(checkDupLikeRes != []){
                let checkLikeUser = 'SELECT * FROM weatherook.like WHERE user_idx = ?';
                let checkLikeUserRes = await db.queryParam_Arr(checkLikeUser, [checkDupLikeRes[i].user_idx]);

                if(!checkLikeUserRes){
                    res.status(500).send({
                        message : "Internal Server Error"
                    }); 
                }
                else if(checkLikeUserRes != []){
                    let delLike = 'DELETE FROM weatherook.like WHERE like_idx = ?';
                    let delLikeRes = await db.queryParam_Arr(delLike, [checkDupLikeRes[i].like_idx]);
                    if(!delLikeRes){
                        res.status(500).send({
                            message : "Internal Server Error"
                        }); 
                    }
                    else {
                        res.status(200).send({
                            message : "Succssfully delete like"
                        }); 
                    }
                }
            }
        }

        let insertLikeInfo = 'INSERT INTO weatherook.like (user_idx) VALUES (?)';
        let insertLikeInfoRes = await db.queryParam_Arr(insertLikeInfo, [user_idx]);

        if(!insertLikeInfoRes){
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        else {
            let insertLikeInBoard = 'INSERT INTO board_like (like_idx, board_idx) VALUES (?,?)'; 
            let insertLikeInBoardRes = await db.queryParam_Arr(insertLikeInBoard, [insertLikeInfoRes.insertId, board_idx]);
            if(!insertLikeInBoardRes){
                res.status(500).send({
                    message : "Internal Server Error"
                });
            }
            else{
                res.status(201).send({
                    message : "Successfully update like"
                }); 
            }
        }
    }
});

module.exports = router; 