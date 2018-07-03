const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');

router.put('/', async function(req, res){
    let user_idx = req.body.user_idx;
    let user_id = req.body.user_id;
    let user_pw = req.body.user_pw;
    let user_img = req.body.user_img;
    let user_desc = req.body.user_desc;
    let user_height =  req.body.user_height;
    let user_weight = req.body.user_weight;
    let style_type = req.body.style_type;

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

            // 입력 pw와 저장 pw가 같은 경우
            if(hashedpw.toString('base64') === checkUserResult[0].user_pw){
                let updateUserQuery = "UPDATE user SET user_desc = ?, user_age= ?, user_img = ?, user_height= ?, user_weight= ? WHERE user_idx = ?;";
                let updateUserResult = await db.queryParam_Arr(updateUserQuery, [user_desc, user_age, user_img, user_height, user_weight, user_idx]); 

                if(!updateUserResult){
                    res.status(500).send({
                        message : "Internal Server Error"
                    }); 
                }
                else { 
                    res.status(201).send({
                        message : "Successfully delete account"
                    });
                }
            }
            // 입력 pw와 저장 pw가 다른 경우(pw 에러)
            else {
                res.status(400).send({
                    message : "Delete Failed - incorrect pw"
                }); 
            }
        }
        // 사용자 정보가 존재하지 않을 때(id 에러)
        else {
            res.status(400).send({
                message : "Delete Failed - incorrect id"
            }); 
        }
    }
}); 

module.exports = router; 