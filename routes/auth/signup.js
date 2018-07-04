const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise'); 
const db = require('../../module/pool.js')


//회원가입
router.post('/', async function(req, res){
    let user_id = req.body.user_id;
    let user_pw = req.body.user_pw; 
    let user_gender = req.body.user_gender; 
    let user_age = req.body.user_age; 
    let user_height = req.body.user_height; 
    let user_weight = req.body.user_weight; 
    

    //id 또는 pw 입력 오류 시
    if(!user_id || !user_pw){
        res.status(400).send({
            message : "Null Value"
        }); 
    }

    else {
        let checkUserQuery = "SELECT * FROM user WHERE user_id = ?"
        let checkUserResult = await db.queryParam_Arr(checkUserQuery, user_id);

        if (!checkUserResult){ //쿼리 에러
            res.status(500).send({
                message : "Internal Server Error1"
            }); 
        }
        else if(checkUserResult.length >0){ //이미 존재하는 유저 정보 입력
            res.status(400).send({
                message : "Already Exist"
            }); 
        }
        else { //정상 수행
            const salt = await crypto.randomBytes(32);
            const hashedpw = await crypto.pbkdf2(user_pw, salt.toString('base64'), 100000, 32, 'sha512');
            
            let signupUserQuery = "INSERT INTO user (user_id, user_pw, user_gender, user_age, user_height, user_weight, user_salt) VALUES (?, ?, ?, ?, ?, ?, ?)"; 
            let signupUserResult = await db.queryParam_Arr(signupUserQuery, [user_id, hashedpw.toString('base64'), user_gender, user_age, user_height, user_weight, salt.toString('base64')]);

            if(!signupUserResult){ //쿼리 에러 
                res.status(500).send({
                    message : "Internal Server Error2"
                }); 
            }
            else { //쿼리 정상 수행 
                res.status(201).send({
                    message : "Successfully sign up"
                }); 
            }
        }
    }
}); 

module.exports = router;

