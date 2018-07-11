const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js');
const jwt = require('../../module/jwt.js');
const upload = require('../../config/multer.js');




//개인 정보 보기
router.get('/', async function(req, res){
    let token = req.headers.token; 
    let decoded = jwt.verify(token);
    

    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }
    else {
        let user_idx = decoded.user_idx;

        //개인 정보 보여주기
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
                    showUserResult
                }
            });
        }
    }
})

//개인 정보 수정
router.put('/',upload.single('user_img'), async function(req, res){
    let token = req.headers.token; 
    let decoded = jwt.verify(token);

   
    //토큰 없을시 오류 
    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }
    else {
        let user_idx = decoded.user_idx;
        let user_age = req.body.user_age;
        let user_desc = req.body.user_desc;
        let user_height =  req.body.user_height;
        let user_weight = req.body.user_weight;
        let user_gender = req.body.user_gender;
        let user_stylelist= req.body.user_stylelist;
        user_img = req.file.location; 


        let updateUserQuery = 'UPDATE user SET user_desc = ?,user_gender=?, user_age= ?, user_img = ?, user_height= ?, user_weight= ? WHERE user_idx = ?';
        let updateUserResult = await db.queryParam_Arr(updateUserQuery, [user_desc, user_gender, user_age, user_img, user_height, user_weight, user_idx]);

            if(user_stylelist){
            let deleteUserStyle = 'DELETE FROM user_style WHERE user_idx = ?'
            let deleteUserStyleResult = await db.queryParam_Arr(deleteUserStyle, [user_idx]);

            for(var i=0;i<user_stylelist.length;i++){ //유저와 스타일 등록
                let settingStyleQuery= "SELECT style_idx FROM style WHERE style_type= ?";
                let settingStyleResult = await db.queryParam_Arr(settingStyleQuery,user_stylelist[i]);
                let styleindex=parseInt(settingStyleResult[0].style_idx,10);

                let updateStyleQuery="INSERT INTO user_style (user_idx, style_idx) VALUES(?,?)";
                let updateStyleResult = await db.queryParam_Arr(updateStyleQuery,[user_idx, styleindex]);

                if(!settingStyleResult || !updateStyleResult || !deleteUserStyleResult){ //쿼리 에러 
                    res.status(500).send({
                        message : "Internal Server Error, failed to insert style"
                    }); 
                }
            }
        }
        if(!updateUserResult){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }else{
            res.status(201).send({
                message : "Successfully user Updated",
                data : {
                    user_idx : user_idx,
                    user_desc : user_desc,
                    user_gender : user_gender,
                    user_age : user_age,
                    user_img : user_img,
                    user_height : user_height,
                    user_weight : user_weight,
                    user_stylelist : user_stylelist
                }
            });
        }
    }
});





module.exports = router;