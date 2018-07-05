const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');
const jwt = require('../../module/jwt.js');

//팔로우 할때
router.post('/', async function(req, res){
    let token = req.headers.token; 
    let follower_idx=req.body.follower_id;
    let decoded = jwt.verify(token);
    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }
    else{
        let user_index=decoded.user_idx;
        let putStyleQuery="SELECT user_idx FROM user WHERE user_id= ?";
        let putStyleResult=await db.queryParam_Arr(putStyleQuery, [follower_idx]);

        let follow_index=putStyleQuery[0].user_idx;
        let follow_date = moment().format('YYYY-MM-DD HH:mm:ss'); 
        if(user_index == follow_index){
            return res.status(500).send({
                message : "two users are same user"
            });
        }
        putStyleQuery="INSERT INTO follow (follow_date, user_idx , follow_idx) VALUES (?, ?)";
        putStyleResult=await db.queryParam_Arr(putStyleQuery, [follow_date, user_index ,follow_index]);
            if(!putStyleResult){ //쿼리 에러 
                res.status(500).send({
                    message : "Internal Server Error, failed to insert style"
                }); 
            } 
            else{
                res.status(201).send({
                    message : "success follow",
                });
            }
    
    }
});

module.exports = router;