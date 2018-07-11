const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const db = require('../../module/pool.js');
const jwt = require('../../module/jwt.js');
const moment = require('moment');

router.get('/', async function(req, res, next) {
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

                let boardQuery='select board_img from board where board_idx=?';
                let boardResult = await db.queryParam_Arr(boardQuery, [newsResult[i].board_idx]);

                if(commentResult){
                
                    for(var j=0;j<commentResult.length;j++){
                        
                        let commentwriteQuery ='select user_img from user where user_id = ?';
                        let commentwriteResult=await db.queryParam_Arr(commentwriteQuery, [commentResult[j].comment_id]);
                        var comment={
                            flag : 0,
                            comment_str : "님이 댓글을 남겼습니다",
                            board_img:boardResult[0].board_img,
                            board_idx:newsResult[i].board_idx,
                            comment_idx:commentResult[j].comment_idx,
                            comment_img:commentwriteResult[0].user_img,
                            comment_desc:commentResult[j].comment_desc,
                            comment_id:commentResult[j].comment_id,
                            date:moment(commentResult[j].comment_date).format('YYYY-MM-DD HH:MM'),
                            date_modify:moment(commentResult[j].comment_date).format('MM-DD HH:MM')
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
                let followQuery='select * from user where user_idx =?';
                let followResult=await db.queryParam_Arr(followQuery, [newsResult[i].user_idx]);
                if(followResult){
                    var follow={
                            flag:1,
                            follow_str:"님이 회원님을 팔로우 했습니다.",
                            follow:followResult[0].user_id,
                            follow_img : followResult[0].user_img,
                            date:newsResult[i].follow_date,
                            date_modify:moment(newsResult[i].follow_date).format('MM-DD HH:MM')
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
                    if(moment(news_arr[j].date,"MM-DD").diff(moment(news_arr[j+1].date,"MM-DD"))<0){
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