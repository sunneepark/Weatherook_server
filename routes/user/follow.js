const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');
const moment = require('moment');
const jwt = require('../../module/jwt.js');

//팔로우 버튼 눌렀을 때
router.post('/', async function(req, res){
    let token = req.headers.token; 
    let follower_id=req.body.follower_id;
    if(!follower_id){
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
        let putfollowQuery="SELECT user_idx FROM user WHERE user_id = ?";
        let putStyleResult=await db.queryParam_Arr(putfollowQuery, follower_id);

        let follower_index=putStyleResult[0].user_idx;
        if(user_index == follower_index){
            return res.status(500).send({
                message : "two users are same user"
            });
        }
        putfollowQuery="SELECT * FROM follow WHERE user_idx = ? and follower_idx =? ";
        putStyleResult=await db.queryParam_Arr(putfollowQuery, [user_index, follower_index]);
        if(putStyleResult.length > 0){ //이미 팔로우 했다면
            let deleteQuery="DELETE FROM follow where user_idx = ? and follower_idx= ?";
            let deleteResult=await db.queryParam_Arr(deleteQuery, [user_index ,follower_index]);
            if(!deleteResult){ //쿼리 에러 
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
        else{ //팔로우 안했다면 
            let follow_date = moment().format('MM-DD'); 
        
            putfollowQuery="INSERT INTO follow (follow_date, user_idx , follower_idx) VALUES (?, ?, ?)";
            putStyleResult=await db.queryParam_Arr(putfollowQuery, [follow_date, user_index ,follower_index]);
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
        
    
    }
});

module.exports = router;