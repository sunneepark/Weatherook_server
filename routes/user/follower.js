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

        let showFollowerID = 'SELECT user_id, user_img, user_desc FROM user JOIN follow ON follow.user_idx = user.user_idx WHERE follow.follower_idx = ?';
        let showFollowerIDResult = await db.queryParam_Arr(showFollowerID, [user_idx]);

        if(!showFollowerIDResult){
            res.status(500).send({
                message : "Internal Server Error"
            });
        }
        else{
            res.status(201).send({
                message : "User follower ID success",
                data : {
                    showFollowerIDResult,
                }
            });
        }
    }
});


//팔로워 중에  user_id  검색
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

        let showFollowerID = 'SELECT user_id, user_img, user_desc FROM user JOIN follow ON follow.user_idx = user.user_idx WHERE follow.follower_idx = ?';
        let showFollowerIDResult = await db.queryParam_Arr(showFollowerID, [user_idx]);

       
        for(var i=0; i<showFollowerIDResult.length; i++){
            if(showFollowerIDResult[i].user_id == find_id){
                if(!showFollowerIDResult){
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                }
                else{
                    res.status(201).send({
                        message : "User Follower ID success",
                        user_id : showFollowerIDResult[i].user_id,
                        user_img :showFollowerIDResult[i].user_img,
                        user_desc : showFollowerIDResult[i].user
                    });
                }
            }
        }
        res.status(400).send({
            message: "팔로워 검색 결과가 없습니다."
        });
    }
});

module.exports = router;