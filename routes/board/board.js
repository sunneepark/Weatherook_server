const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const upload = require('../../config/multer.js'); 
const moment = require('moment');
const jwt = require('../../module/jwt.js');


//게시글 등록하기
router.post('/',upload.single('board_img'), async function(req, res){
    
    let token = req.headers.token;
    let board_desc = req.body.board_desc;
    let board_weather=req.body.board_weather;
    let board_temp_min = req.body.board_temp_min;
    let board_temp_max = req.body.board_temp_max;
    let board_auth = req.body.board_auth;

    let style_type = JSON.parse(req.body.style_type);
    let board_hashtag = JSON.parse(req.body.board_hashtag);
    board_img = req.file.location; 

    // board_img 가 없을 때 
    if(!req.file || !board_desc || !board_weather || !board_temp_max || !board_temp_min || !board_auth || !style_type || !board_hashtag){
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
        //정상 수행 시
        else{
           let user_idx = decoded.user_idx;
            //user 정보 확인
            let checkBoardQuery = 'SELECT * FROM user WHERE user_idx = ?'; 
            let checkBoardResult = await db.queryParam_Arr(checkBoardQuery, [user_idx]);

            if(!checkBoardResult){ // 쿼리 에러
                res.status(400).send({
                    message : "wrong user"
                }); 
            }
            //user정보가 존재시에
            else {
                let board_date = moment().format('YYYY-MM-DD HH:mm:ss'); 

                //board 테이블에 게시글 정보 삽입
                let insertBoardQuery = 'INSERT INTO board (board_img, board_desc, board_temp_min, board_temp_max, board_weather, board_auth, board_date) VALUES (?, ?, ?, ?, ?, ?, ?)'; 
                let insertBoardResult = await db.queryParam_Arr(insertBoardQuery, [board_img, board_desc, board_temp_min, board_temp_max, board_weather, board_auth, board_date]); 
                
                let board_insert_index=insertBoardResult.insertId;
                //user_board 테이블에 게시글 유저 정보 삽입
                let insertUserQuery ='INSERT INTO user_board (board_idx, user_idx) VALUES (?,?)';
                let insertUserResult = await db.queryParam_Arr(insertUserQuery, [board_insert_index,user_idx]);

                if(!insertBoardResult || !insertUserResult ){ //쿼리 에러
                    res.status(500).send({
                        message : "Internal Server Error"
                    }); 
                }
                else{
                //style 테이블에 게시글 스타일 정보 삽입
                for(var i=0;i<style_type.length;i++){ //유저와 스타일 등록
                    let signupStyleQuery="SELECT style_idx FROM style WHERE style_type= ?";
                    
                    let signupStyleResult = await db.queryParam_Arr(signupStyleQuery,style_type[i]);
                    let styleindex=parseInt(signupStyleResult[0].style_idx,10);
                  
                    let putStyleQuery="INSERT INTO board_style (board_idx , style_idx) VALUES (?, ?)";
                    let putStyleResult=await db.queryParam_Arr(putStyleQuery, [board_insert_index ,styleindex]);
                    if(!signupStyleResult || !putStyleResult){ //쿼리 에러 
                        res.status(500).send({
                            message : "Internal Server Error, failed to insert style"
                        }); 
                    }  
                }

                //hashtag 테이블에 게시글 해시태그 정보 삽입
                for(var i=0;i<board_hashtag.length;i++){ //게시글과 해시태그 등록
                    let searchhashtag="SELECT * FROM hashtag WHERE hashtag_desc=?";//기존에 해시태그 있는지
                    let searchhashtagresult=await db.queryParam_Arr(searchhashtag,board_hashtag[i]);
                    let hashtag_index;
                    if(!searchhashtagresult){
                        let insertQuery="INSERT INTO hashtag (hashtag_desc) VALUES (?)";
                        let insertResult = await db.queryParam_Arr(insertQuery,board_hashtag[i]);
                        hashtag_index=insertResult.insertId;
                    }
                    else
                        hashtag_index=searchhashtagresult[0].hashtag_idx;
                    
                    putStyleQuery="INSERT INTO board_hashtag (board_idx , hashtag_idx) VALUES (?, ?)";
                    putStyleResult=await db.queryParam_Arr(putStyleQuery, [board_insert_index , hashtag_index]);
                    if(!putStyleResult){ //쿼리 에러 
                        res.status(500).send({
                            message : "Internal Server Error, failed to insert hashtag"
                        }); 
                    }  
                }
               
                res.status(201).send({
                    message : "Successfully register",
                    board_idx : board_insert_index
                }); 
            }
            }
        }
    }
}); 


router.get('/:board_idx', async function(req, res){
    let board_idx = req.params.board_idx; 
    
    let hashtag_desc; 
    //board_idx 게시글이 존재하는지 확인
    //board_idx 입력 오류 
    if(!board_idx){
        res.status(400).send({
            message : "Null Value"
        }); 
    }
    else {
        let selectOneBoardQuery = 'SELECT * FROM board WHERE board_idx = ?'; 
        let selectOneBoardResult = await db.queryParam_Arr(selectOneBoardQuery, [board_idx]); 
    
        //user_idx를 가져오기 위한 user_board 테이블에 접근
        let selectWriterOneBoardQuery = 'SELECT * FROM user_board WHERE board_idx = ?'; 
        let selectWriterOneBoardResult = await db.queryParam_Arr(selectWriterOneBoardQuery, [board_idx]);

        //hashtag_desc를 가져오기 위한 hashtag 테이블과 board_hashtag 테이블에 접근
        let checkHashtagInBoard = 'SELECT * FROM board_hashtag WHERE board_idx = ?'; 
        let checkHashtagInBoardRes = await db.queryParam_Arr(checkHashtagInBoard, [board_idx]);
        if(!checkHashtagInBoardRes){
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        else {
            //hashtag가 존재하지 않을 때, 
            if(checkHashtagInBoardRes[0] == null)
            {
                hashtag_desc = null; 
            }
            else {
                let getHashtagDesc = 'SELECT * FROM hashtag WHERE board_idx = ?'; 
                let getHashtagDescRes = await db.queryParam_Arr(getHashtagDesc, [board_idx]);

                if(!getHashtagDescRes){
                    res.status(500).send({
                        message : "Internal Server Error"
                    }); 
                    return; 
                }

                else {
                    hashtag_desc = getHashtagDescRes[0].hashtag_desc; 
                }
            }
        }



        //like_cnt를 가져오기 위한 board_like와 like 테이블 접근
        let selectLikesCnt = 'SELECT count(*) as count FROM board_like WHERE board_idx = ?';
        let selectLikesCntResult = await db.queryParam_Arr(selectLikesCnt, [board_idx]);

        //쿼리 에러
        if(!selectOneBoardResult) {
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        //정상 수행
        else {
            let data_res = {
                user_idx : selectWriterOneBoardResult[0].user_idx, 
                board_img : selectOneBoardResult[0].board_img,
                board_desc : selectOneBoardResult[0].board_desc, 
                hashtag_desc : hashtag_desc, 
                like_cnt : selectLikesCntResult[0].count, 
                board_temp_min : selectOneBoardResult[0].board_temp_min, 
                board_temp_max : selectOneBoardResult[0].board_temp_max,
                board_weather : selectOneBoardResult[0].board_weather
            }
            res.status(201).send({
                message : "Successfully get One board", 
                data : selectOneBoardResult
            }); 
        }
    }
});



router.delete('/', async function(req, res){
    let token = req.headers.token; 
    let decoded = jwt.verify(token);

    if (decoded == -1){
        res.status(500).send({
            message : "Token error"
        }); 
    }

    else {
        let board_idx = req.body.board_idx;
        if(!board_idx){
            res.status(400).send({
                message : "Null Value" 
            }); 
            return; 
        }
        let user_idx = decoded.user_idx; 

        //user_idx이 작성한 board 정보가 있는지 확인
        //user_board 에서 정보가 있는지 확인할 수 있다. 
        let checkUserInBoardQuery = 'SELECT * FROM user_table WHERE user_idx = ? ';
        let checkUserInBoardResult = await db.queryParam_Arr(checkUserInBoardQuery, [user_idx]); 

        if(!checkUserInBoardResult) {
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        else {
            //일치하면? 
            if(!checkUserInBoardResult[0].user_idx == decoded.user_idx){

                //board 테이블과 user_table 에서 한꺼번에 삭제하는 쿼리 
                let deleteBoardQuery = "DELETE FROM board INNER JOIN user_board WHERE board_idx = ?"; 
                let deleteBoardResult = await db.queryParam_Arr(deleteBoardQuery, [board_idx]); 

                if(!deleteBoardResult){
                    res.status(500).send({
                        message : "Internal server Error"
                    }); 
                }
                else {
                    res.status(201).send({
                        message : "Successfully delete board"
                    }); 
                }
            }
            else {
                res.status(200).send({
                    message : "Unauthorized"
                }); 
            }
        }
    }
});

module.exports = router;