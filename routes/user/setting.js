const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');

router.put('/', async function(req, res){
    let user_idx = req.body.user_idx;
    let user_id = req.body.user_id;
    let user_pw = req.body.user_pw;
    let user_age = req.body.user_age;
    let user_img = req.body.user_img;
    let user_desc = req.body.user_desc;
    let user_height =  req.body.user_height;
    let user_weight = req.body.user_weight;
    let style_type = req.body.style_type;
    
    //board_idx 게시글이 존재하는지 확인
    //board_idx 입력 오류 
    if(!user_idx){
        res.status(400).send({
            message : "Null Value"
        }); 
    }
    else {
        let updateUserQuery = "UPDATE user SET user_desc = ?, user_age= ?, user_img = ?, user_height= ?, user_weight= ? WHERE user_idx = ?;";
        let updateUserResult = await db.queryParam_Arr(updateUserQuery, [user_desc, user_age, user_img, user_height, user_weight, user_idx]);
    
        //쿼리 에러
        if(!updateUserResult) {
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        //정상 수행
        else {
            res.status(201).send({
                message : "user setting success", 
                data : updateUserResult[0]
            }); 
        }
    }
})

module.exports = router; 