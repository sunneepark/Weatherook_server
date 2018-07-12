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
        let style = [];
        //개인 정보 보여주기
        let showUserQuery = 'SELECT user_img, user_id, user_desc, user_age, user_height, user_weight FROM user WHERE user_idx = ?';
        let showUserResult = await db.queryParam_Arr(showUserQuery, [user_idx]);

        let showUserStyle = 'SELECT style_type FROM style JOIN user_style USING(style_idx) WHERE user_idx = ?';
        let showUserstyleResult = await db.queryParam_Arr(showUserStyle, [user_idx]);

        for(var i= 0; i <showUserstyleResult.length; i++){
            style = style.concat(showUserstyleResult[i].style_type);
        }

        if(!showUserResult || !showUserstyleResult){
            res.status(500).send({
                message : "Internal Server Error"
            });
        }
        else{
            res.status(201).send({
                message : "user show success",
                data : {
                    showUserResult,
                    style
                }
            });
        }
    }
})

//개인 정보 수정
router.post('/',upload.single('user_img'), async function(req, res){
    let token = req.headers.token; 
    let decoded = jwt.verify(token);
    let user_img;

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
        if(req.file){
            user_img = req.file.location;
        }
        if(user_desc){
            let updateDesc = 'UPDATE user SET user_desc = ? WHERE user_idx =?';
            let updateDescRes = await db.queryParam_Arr(updateDesc, [user_desc, user_idx]);

            if(!updateDescRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }else{
            res.status(201).send({
                message : "Successfully user Updated",
                data : {
                    user_idx : user_idx,
                    user_desc : user_desc
                }
            });
        }
        }

        if(user_gender){
            let updateGender = 'UPDATE user SET user_gender = ? WHERE user_idx =?';
            let updateGenderRes = await db.queryParam_Arr(updateGender, [user_gender, user_idx]);

            if(!updateGenderRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }else{
            res.status(201).send({
                message : "Successfully user Updated",
                data : {
                    user_idx : user_idx,
                    user_gender : user_gender
                }
            });
        }
        }
        
        


        if(user_age){
            let updateAge = 'UPDATE user SET user_age = ? WHERE user_idx =?';
            let updateAgeRes = await db.queryParam_Arr(updateAge, [user_age, user_idx]);

            if(!updateAgeRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }else{
            res.status(201).send({
                message : "Successfully user Updated",
                data : {
                    user_idx : user_idx,
                    user_age : user_age
                }
            });
        }
        }

        if(user_img){
            let updateImg = 'UPDATE user SET user_img = ? WHERE user_idx =?';
            let updateImgRes = await db.queryParam_Arr(updateImg, [user_img, user_idx]);

            if(!updateImgRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }else{
            res.status(201).send({
                message : "Successfully user Updated",
                data : {
                    user_idx : user_idx,
                    user_img : user_img
                }
            });
        }
        }

        if(user_height){
            let updateHeight = 'UPDATE user SET user_height = ? WHERE user_idx =?';
            let updateHeightRes = await db.queryParam_Arr(updateHeight, [user_height, user_idx]);

            if(!updateHeightRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }else{
            res.status(201).send({
                message : "Successfully user Updated",
                data : {
                    user_idx : user_idx,
                    user_height : user_height
                }
            });
        }
        }

        if(user_weight){
            let updateWeight = 'UPDATE user SET user_weight = ? WHERE user_idx =?';
            let updateWeightRes = await db.queryParam_Arr(updateWeight, [user_weight, user_idx]);

            if(!updateWeightRes){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }else{
            res.status(201).send({
                message : "Successfully user Updated",
                data : {
                    user_idx : user_idx,
                    user_weight : user_weight
                }
            });
        }
    }
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
            if(!updateStyleResult){
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }else{
            res.status(201).send({
                message : "Successfully user Updated",
                data : {
                    user_idx : user_idx,
                    user_stylelist : user_stylelist
                }
            });
        }
        }
    }
});





module.exports = router;