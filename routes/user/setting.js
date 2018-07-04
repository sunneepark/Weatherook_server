const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');



//개인 정보 보기
router.get('/:user_idx', async function(req, res){
    const user_idx = req.params.user_idx;
    let user_img = req.params.user_img;
    let user_desc = req.params.user_desc;
    let user_age = req.params.user_age;
    let user_height = req.params.user_height;
    let user_weight = req.params.user_weight;

    if(!user_idx){
        res.status(400).send({
            message : "Null Value"
        });
    }
    else {
        let showUserQuery = 'SELECT user_img, user_desc, user_age, user_height, user_weight FROM user WHERE user_idx = ?';
        let showUserResult = await db.queryParam_Arr(showUserQuery, [user_idx]);

        if(!showUserResult){
            res.status(500).send({
                message : "Internal Server Error"
            });
        }
        else{
            res.status(201).send({
                message : "user show success",
                data : {
                    user_idx : user_idx,
                    showUserResult
                }
            });
        }
    }
})

//개인 정보 수정
router.put('/', async function(req, res){
    let user_idx = req.body.user_idx;
    let user_age = req.body.user_age;
    let user_img = req.body.user_img;
    let user_desc = req.body.user_desc;
    let user_height =  req.body.user_height;
    let user_weight = req.body.user_weight;
    //let style_type = JSON.parse("["+req.body.style_type+"]");
   
    

    //user_idx 없을시 오류 
    if(!user_idx){
        res.status(400).send({
            message : "Null Value"
        }); 
    }
    else {
        let updateUserQuery = 'UPDATE user SET user_desc = ?, user_age= ?, user_img = ?, user_height= ?, user_weight= ? WHERE user_idx = ?';
        let updateUserResult = await db.queryParam_Arr(updateUserQuery, [user_desc, user_age, user_img, user_height, user_weight, user_idx]);
        /*
        if(style_type){
            let updateStyleQuery = 'DELETE FROM user_style WHERE user_idx = ? '
            let updateStyleResult = await db.queryParam_Arr(updateStyleQuery, [user_idx]);
        }
        */

        //쿼리 에러
        if(!updateUserResult) {
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        //정상 수행
        else {
            res.status(201).send({
                message : "Successfully user setting",
                data : {
                    user_idx : user_idx,
                    user_desc : user_desc,
                    user_age : user_age,
                    user_img : user_img,
                    user_height : user_height,
                    user_weight : user_weight,
                    
                }
            }); 
        }
    }
})

module.exports = router; 