const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const jwt = require('../../module/jwt.js');

//좋아요 누를 때
router.post('/', async function(req, res){
    let token = req.headers.token;
    let board_idx = req.body.board_idx; 
    /*
    if (!board_idx){
        res.status(400).send({
            message : "Null Values"
        }); 
        return; 
    }
    */

    let decoded = jwt.verify(token);
    if(decoded == -1){
        res.status(400).send({
            message : "Token Error"
        }); 
    }
    else {
        let user_idx = decoded.user_idx; 
        let checkDupLikeInBoard = 'SELECT * FROM board_like WHERE board_idx =?'
        let checkDupLikeInBoardRes = await db.queryParam_Arr(checkDupLikeInBoard, [board_idx]);
        if (!checkDupLikeInBoardRes){
            res.status(500).send({
                message : "Internal Server Error"
            }); 
            return; 
        }

        let checkDupLike = 'SELECT * FROM weatherook.like WHERE like_idx = ?'
        for (var i=0; i<checkDupLikeInBoardRes.length; i++){
            let checkDupLikeRes = await db.queryParam_Arr(checkDupLike, checkDupLikeInBoardRes[i].like_idx)
            

            if(!checkDupLikeRes){
                res.status(500).send({
                    message : "Internal Server Error"
                });
                return; 
            }
            else if(checkDupLikeRes != []){
                let checkLikeUser = 'SELECT * FROM weatherook.like WHERE user_idx = ?';
                let checkLikeUserRes = await db.queryParam_Arr(checkLikeUser, [checkDupLikeRes[i].user_idx]);

                if(!checkLikeUserRes){
                    res.status(500).send({
                        message : "Internal Server Error"
                    }); 
                }
                else if(checkLikeUserRes != []){
                    res.status(400).send({
                        message : "Already Exist Like"
                    });
                    return;
                }
            }
        }

        let insertLikeInfo = 'INSERT INTO weatherook.like (user_idx) VALUES (?)';
        let insertLikeInfoRes = await db.queryParam_Arr(insertLikeInfo, [user_idx]);
        if(!insertLikeInfoRes){
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        else {
            let find = 'SELECT like_idx FROM weatherook.like ORDER BY like_idx DESC;'
            let findRes = await db.queryParam_Arr(find);
            let insertLikeInBoard = 'INSERT INTO board_like (board_idx, like_idx) VALUES (?,?)'; 
            let insertLikeInBoardRes = await db.queryParam_Arr(insertLikeInBoard, [board_idx, findRes[0].like_idx]);
            console.log(insertLikeInBoardRes);
            if(!insertLikeInBoardRes){
                console.log("dddd");
                res.status(500).send({
                    message : "Internal Server Error"
                });
            }
            else{
                res.status(201).send({
                    message : "Successfully update like"
                }); 
            }
        }
    }
});

router.delete('/', async function(req, res){
    let token = req.headers.token;
    let board_idx = req.body.board_idx; 
    if(!board_idx){
        res.status(400).send({
            message : "Null Value"
        }); 
        return; 
    }

    let decoded = jwt.verify(token);
    if(decoded == -1){
        res.status(500).send({
            message : "Token Error"
        }); 
    }
    else {
        let user_idx = decoded.user_idx; 

        let checkUserLike = 'SELECT * FROM weatherook.like WHERE user_idx = ?';
        let checkUserLikeRes = await db.queryParam_Arr(checkUserLike, [user_idx]); 

        if(!checkUserLikeRes){
            res.status(500).send({
                message : "Internal Server Error"
            });
        }
        else {
            let checkforDelLikeRes;
            for(var j = 0; j < checkUserLikeRes.length; j++){
                let checkforDelLike = 'SELECT * FROM board_like WHERE board_idx = ? AND like_idx = ?'; 
                checkforDelLikeRes = await db.queryParam_Arr(checkforDelLike, [board_idx, checkUserLikeRes[0].like_idx])
                if(!checkforDelLikeRes){
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                }
            }
            if(checkforDelLikeRes.length == 0){
                res.status(200).send({
                    message : "No Like Data"
                });
            }else{
                let deleteLike = 'DELETE FROM weatherook.like WHERE like_idx=?';
                let deleteLikeRes = await db.queryParam_Arr(deleteLike, [checkforDelLikeRes[0].like_idx]);
                if(!deleteLikeRes){
                    res.status(500).send({
                        message : "Internal Server Error"
                    }); 
                }
                else{
                    res.status(201).send({
                        message : "Successfully delete like"
                    });
                }

            }
        }
    }
})
module.exports = router; 