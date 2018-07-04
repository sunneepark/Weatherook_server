const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');
const jwt = require('../../module/jwt.js'); 

//로그인
router.post('/', async function(req, res){
    let user_id = req.body.user_id;
    let user_pw = req.body.user_pw; 
   
    if(!user_id || !user_pw){ // id, pw 입력 오류 시
        res.status(400).send({
            message : "Null Value"
        }); 
    }

    else {
        //사용자 정보가 존재하는지 체크 
        let checkUserQuery = "SELECT * FROM user WHERE user_id=?"; 
        let checkUserResult = await db.queryParam_Arr(checkUserQuery, [user_id]);

        if(!checkUserResult){ //쿼리 오류
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        //사용자 정보가 존재(정상 수행)
        else if(checkUserResult.length === 1){
            //입력한 pw와 저장한 pw의 일치 여부 검사 
            let hashedpw = await crypto.pbkdf2(user_pw, checkUserResult[0].user_salt, 100000, 32, 'sha512');
            console.log(hashedpw.toString('base64'));
            console.log(checkUserResult[0].user_pw)
            // 입력 pw와 저장 pw가 같은 경우
            if(hashedpw.toString('base64') == checkUserResult[0].user_pw){
                console.log(checkUserResult[0].user_idx); //checking result query 
                //토큰 발급
                let token = jwt.sign(checkUserResult[0].user_idx);
                console.log(token); 
                
                res.status(201).send({
                    message : "Successfully sign in",
                    token : token,
                    user_idx : checkUserResult[0].user_idx
                }); 
            }
            // 입력 pw와 저장 pw가 다른 경우 - 잘못된 비밀번호로 로그인 실패
            else {
                res.status(400).send({
                    message : "Login Failed - incorrect pw"
                }); 
            }
        }
        // 사용자 정보가 존재하지 않을 때(id 에러)
        else {
            res.status(400).send({
                message : "Login Failed - incorrect id"
            }); 
        }
    }
}); 


module.exports = router; 
