const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');
const moment = require('moment');
const jwt = require('../../module/jwt.js');

//팔로우 할때
router.post('/', async function(req, res){
    let token = req.headers.token; 
    let follower_idx=req.body.follower_id;
    if(!follower_idx){
        return res.status(400).send({
            message : "Null value"
        });
    }
    let decoded = jwt.verify(token);
    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }
    else{
        let user_index=decoded.user_idx;
        let putStyleQuery="SELECT user_idx FROM user WHERE user_id = ?";
        let putStyleResult=await db.queryParam_Arr(putStyleQuery, follower_idx);

        let follow_index=putStyleResult[0].user_idx;
        let follow_date = moment().format('YYYY-MM-DD HH:mm:ss'); 
        if(user_index == follow_index){
            return res.status(500).send({
                message : "two users are same user"
            });
        }
        putStyleQuery="INSERT INTO follow (follow_date, user_idx , follower_idx) VALUES (?, ?, ?)";
        putStyleResult=await db.queryParam_Arr(putStyleQuery, [follow_date, user_index ,follow_index]);
            if(!putStyleResult){ //쿼리 에러 
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            } 
            else{
                res.status(201).send({
                    message : "success follow",
                });
            }
    
    }
});

//팔로우 취소 할때
router.delete('/', async function(req, res){
    let token = req.headers.token; 
    let follower_idx=req.body.follower_id;
    if(!follower_idx){
        return res.status(400).send({
            message : "Null value"
        });
    }
    let decoded = jwt.verify(token);
    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }
    else{
        let user_index=decoded.user_idx;
        let putStyleQuery="SELECT user_idx FROM user WHERE user_id = ?";
        let putStyleResult=await db.queryParam_Arr(putStyleQuery, follower_idx);

        let follow_index=putStyleResult[0].user_idx;
        if(user_index == follow_index){
            return res.status(500).send({
                message : "two users are same user"
            });
        }
        
        putStyleQuery="DELETE FROM follow where user_idx = ? and follower_idx= ?";
        putStyleResult=await db.queryParam_Arr(putStyleQuery, [user_index ,follow_index]);
            if(!putStyleResult){ //쿼리 에러 
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            } 
            else{
                res.status(201).send({
                    message : "success unfollow",
                });
            }
    }
});
module.exports = router;