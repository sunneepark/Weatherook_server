const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js');
const jwt = require('../../module/jwt.js');

router.get('/', async function (req, res) {
    let token = req.headers.token; 
    let decoded = jwt.verify(token);
    
    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }
    else{
        let user_idx = decoded.user_idx;

        let showFollowingingID = 'SELECT user_id, user_img, user_desc FROM user JOIN follow ON user.user_idx = follow.follower_idx WHERE follow.user_idx = ?';
        let showFollowingingIDResult = await db.queryParam_Arr(showFollowingingID, [user_idx]);

        if(!showFollowingingIDResult){
            res.status(500).send({
                message : "Internal Server Error"
            });
        }
        else{
            console.log(showFollowingingIDResult);
            res.status(201).send({
                message : "User Following ID success",
                data : {
                    showFollowingingIDResult,
                }
            });
        }
    }
});


//팔로잉 중에  user_id  검색
router.put('/', async function (req, res) {
    let token = req.headers.token; 
    let decoded = jwt.verify(token);
    
    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }
    else{
        let user_idx = decoded.user_idx;
        let find_id = req.body.find_id;

        let showFollowingingID = 'SELECT user_id, user_img, user_desc FROM user JOIN follow ON user.user_idx = follow.follower_idx WHERE follow.user_idx = ?';
        let showFollowingingIDResult = await db.queryParam_Arr(showFollowingingID, [user_idx]);

        for(var i=0; i<showFollowingingIDResult.length; i++){
            if(showFollowingingIDResult[i].user_id == find_id){
                if(!showFollowingingIDResult){
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                }
                else{
                    res.status(201).send({
                        message : "User Following ID success",
                        user_id : showFollowingingIDResult[i].user_id,
                        user_img :showFollowingingIDResult[i].user_img,
                        user_desc : showFollowingingIDResult[i].user
                    });
                }
            }
        }
        res.status(400).send({
            message: "팔로잉 검색 결과가 없습니다."
        });
    }
});

module.exports = router;