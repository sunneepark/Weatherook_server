const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const jwt = require('../../module/jwt.js');

router.post('/', async function(req, res){
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }
    else{
        let user_idx=decoded.user_idx;
        
        let checkfollowQuery='select * from board where board_auth="PUBLIC" and board_idx in(select board_idx from user_board where user_idx in (SELECT follower_idx FROM follow where user_idx= ? )) order by board_date desc';
        let checkfollowResult = await db.queryParam_Arr(checkfollowQuery, [user_idx]);
        if(!checkfollowResult){ // 쿼리 에러
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        else{
            res.status(201).send({
                message : "Successfully show follow_board_list",
                data : checkfollowResult
            }); 
        }
    }
    
}); 
module.exports = router; 