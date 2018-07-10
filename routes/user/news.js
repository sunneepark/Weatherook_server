const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');
const jwt = require('../../module/jwt.js');
const moment = require('moment');

router.post('/', async function(req, res, next) {
    let token = req.headers.token;
    if(!token){
        res.status(400).send({
            message : "Null Value"
        }); 
    }else {
        //토큰을 decoding
       let decoded = jwt.verify(token);
        //decoding 실패시
        if(decoded == -1){
            res.status(500).send({
                message : "Token Error"
            });
        }
        else{
            let user_idx = decoded.user_idx;
            let news_arr=[];

            let newsQuery = 'select board_idx from user_board where user_idx=?';
            let newsResult = await db.queryParam_Arr(newsQuery, [user_idx]);
            
            for(var i=0;i<newsResult.length;i++){
                let commentQuery='select * from weatherook.comment where comment_idx in (select comment_idx from board_comment where board_idx =?) order by comment_date desc';
                let commentResult=await db.queryParam_Arr(commentQuery, [newsResult[i].board_idx]);
                
                if(commentResult){
                    for(var j=0;j<commentResult.length;j++){
                        var comment={
                            board_idx:newsResult[i].board_idx,
                            comment_idx:commentResult[j].comment_idx,
                            comment_desc:commentResult[j].comment_desc,
                            comment_id:commentResult[j].comment_id,
                            date:commentResult[j].comment_date
                        } 
                        news_arr.push(comment);
                    }  
                }
                else if(!commentResult){ //쿼리 에러 
                    res.status(500).send({
                        message : "querry error"
                    }); 
                }
            }

            newsQuery ='SELECT * FROM follow where follower_idx = ? order by follow_date desc';
            newsResult=await db.queryParam_Arr(newsQuery, [user_idx]);
             
            for(var i=0;i<newsResult.length;i++){
                let followQuery='select user_id from user where user_idx =?';
                let followResult=await db.queryParam_Arr(followQuery, [newsResult[i].user_idx]);
                if(followResult){
                    var follow={
                            follow:followResult[0].user_id,
                            date:newsResult[i].follow_date
                    } 
                    news_arr.push(follow);
                }
                else if(!followResult){ //쿼리 에러 
                    res.status(500).send({
                        message : "querry error"
                    }); 
                }
            }
            for(var i=0;i<news_arr.length;i++){
                for(var j=1;j<news_arr.length-1;j++){
                    if(moment(news_arr[j].date,"YYYY-MM-DDTHH:mm.000Z").diff(moment(news_arr[j+1].date,"YYYY-MM-DDTHH:mm.000Z"))<0){
                        var temp=news_arr[j];
                        news_arr[j]=news_arr[j+1];
                        news_arr[j+1]=temp;
                    }
                }
            }
            res.status(201).send({
                message : "success my news",
                data : news_arr
            });
        }
    }
});

module.exports = router;