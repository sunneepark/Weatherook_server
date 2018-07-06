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

module.exports = router;