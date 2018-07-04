const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise'); 
const db = require('../../module/pool.js')


//회원가입
router.post('/', async function(req, res){
    let user_id = req.body.user_id;
    let user_pw = req.body.user_pw;
    let user_desc=req.body.user_desc;
    let user_gender = req.body.user_gender; 
    let user_age = req.body.user_age; 
    let user_height = parseInt(req.body.user_height,10); 
    let user_weight = parseInt(req.body.user_weight,10);
    
    let user_bmi=user_weight/(user_height/100*user_height/100);
    let user_stylelist=JSON.parse("["+req.body.user_stylist+"]");

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
            
            let signupUserQuery = "INSERT INTO user (user_id, user_pw, user_gender, user_age, user_height, user_weight, user_salt, user_bmi, user_desc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"; 
            let signupUserResult = await db.queryParam_Arr(signupUserQuery, [user_id, hashedpw.toString('base64'), user_gender, user_age, user_height, user_weight, salt.toString('base64'), user_bmi,user_desc]);
            
            if(!signupUserResult){ //쿼리 에러 
                return res.status(500).send({
                    message : "Internal Server Error2"
                }); 
            }
            else{
                checkUserResult = await db.queryParam_Arr(checkUserQuery, user_id);
    
                    for(var i=0;i<user_stylelist.length;i++){ //유저와 스타일 등록
                        let signupStyleQuery="SELECT style_idx FROM style WHERE style_type= ?";
                        let signupStyleResult = await db.queryParam_Arr(signupStyleQuery,user_stylelist[i]);
                        let styleindex=parseInt(signupStyleResult[0].style_idx,10);
                        let userindex=parseInt(checkUserResult[0].user_idx,10);
                       
                        let putStyleQuery="INSERT INTO user_style (user_idx , style_idx) VALUES (?, ?)";
                        let putStyleResult=await db.queryParam_Arr(putStyleQuery, [userindex ,styleindex]);
                        if(!signupStyleResult || !putStyleResult){ //쿼리 에러 
                            res.status(500).send({
                                message : "Internal Server Error, failed to insert style"
                            }); 
                        }
                       
                    }
                     res.status(201).send({
                        message : "Successfully sign up"
                    }); 
                
            }
            
        }
    }
}); 

module.exports = router;

