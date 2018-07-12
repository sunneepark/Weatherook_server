const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const jwt = require('../../module/jwt.js');

//좋아요 누를 때
router.post('/', async function(req, res){
    let token = req.headers.token;
    let board_idx = req.body.board_idx; 
    /*
    if (!board_idx){
        res.status(400).send({
            message : "Null Values"
        }); 
        return;     
    }
    */

    let decoded = jwt.verify(token);
    if(decoded == -1){
        res.status(400).send({
            message : "Token Error"
        }); 
    }
    else {
        let like_flag=0;
        let user_idx = decoded.user_idx; 
        
        let checkDupLike = 'select * from weatherook.like where like_idx in (select like_idx from board_like where board_idx =?)'
        let checkDupLikeRes = await db.queryParam_Arr(checkDupLike, board_idx);
        console.log(checkDupLikeRes);
        if(!checkDupLikeRes){
            res.status(500).send({
                message : "Internal Server Error"
            });
            return;
        }
        else{
            for (var i=0; i<checkDupLikeRes.length; i++){
                if(checkDupLikeRes[i].user_idx == user_idx){ //좋아요가 눌러졌을 때
                    like_flag=1;
                    let deletelike='DELETE from weatherook.like where like_idx=?';
                    let deletequery=await db.queryParam_Arr(deletelike, [checkDupLikeRes[i].like_idx]);

                    if(!deletequery){
                        res.status(500).send({
                            message : "Internal Server Error"
                        }); 
                    }
                    break;
                } 
            }
        }
        if(like_flag==0){

            let insertLikeInfo = 'INSERT INTO weatherook.like (user_idx) VALUES (?)';
            let insertLikeInfoRes = await db.queryParam_Arr(insertLikeInfo, [user_idx]);
            let like__idx=insertLikeInfoRes.insertId;
            let insertLikeInBoard = 'INSERT INTO board_like (board_idx, like_idx) VALUES (?,?)'; 
            let insertLikeInBoardRes = await db.queryParam_Arr(insertLikeInBoard, [board_idx, like__idx]);
    
            if(!insertLikeInfoRes || !insertLikeInBoardRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }
            else{
                if(like_flag==0){
                    res.status(201).send({
                        message : "Successfully update like"
                    });
                }
            }
        }
        if(like_flag==1){
            res.status(201).send({
                message : "Successfully delete like"
            });
        }
    
    }
});

module.exports = router; 