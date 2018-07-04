const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const upload = require('../../config/multer.js'); 
const moment = require('moment');
const jwt = require('../../module/jwt.js');


//게시글 등록하기
router.post('/', upload.single('board_img'), async function(req, res){
    token = req.headers.token; 
    // Identifier 'token' has already been declared 라는 에러 때문에 선언부 let을 뺌
    let user_idx = req.body.user_idx;
    let board_desc = req.body.board_desc;
    let board_temp_min = req.body.board_temp_min;
    let board_temp_max = req.body.board_temp_max;
    let board_auth = req.body.board_auth; 
    let style_type = req.body.style_type; 
    let token = req.headers.token;  

    board_img = req.file.location; 

    // board_img 가 없을 때 
    if(!req.file){
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
        //title 또는 content 의 잘못된 입력
        else if(!board_title || !board_content){
            res.status(400).send({
                message : "Null Value"
            });
        }
        //정상 수행 시
        else{
            //user 정보 확인
            let checkBoardQuery = 'SELECT * FROM user WHERE user_idx = ?'; 
            let checkBoardResult = await db.queryParam_Arr(checkBoardQuery, [user_idx]);

            if(!checkBoardResult){ // 쿼리 에러
                res.status(500).send({
                    message : "Internal Server Error"
                }); 
            }
            //user 정보가 존재할 시
            else {
                user_idx = decoded.user_idx; 
                
                let board_date = moment().format('YYYY-MM-DD HH:mm:ss'); 

                //board 테이블에 게시글 정보 삽입
                let insertBoardQuery = 'INSERT INTO board (board_img, board_desc, board_temp_min, board_temp_max, board_weather, board_auth, board_date) VALUES (?, ?, ?, ?, ?, ?, ?)'; 
                let insertBoardResult = await db.queryParam_Arr(insertBoardQuery, [board_img, board_desc, board_temp_min, board_temp_max, board_weather, board_auth, board_date]); 
                
                let last_board_idx_query = 'SELECT LAST_INSERT_ID()'; 
                let last_board_idx = await db.queryParam_None(last_board_idx_query); 

                //style 테이블에 키워드 정보 삽입
                let insertStyleQuery = 'INSERT INTO style (style_type) VALUES (?)'; 
                let insertStyleResult = await db.queryParam_Arr(insertStyleQuery, [style_type]);
                
                let last_style_idx_query = 'SELECT LAST_INSERT_ID()';
                let last_style_idx = await db.queryParam_None(last_style_idx_query); 

                //board_style 테이블에 게시글과 키워드 정보 삽입
                let insertBoardStyleQuery = 'INSERT INTO board_style (board_idx, style_idx) VALUES (?, ?)';
                let insertBoardStyleResult = await db.queryParam_Arr(insertBoardStyleQuery, [last_board_idx[0], last_style_idx[0]]); 


                if(!insertBoardResult || !insertStyleResult || !insertBoardStyleResult){ //쿼리 에러
                    res.status(500).send({
                        message : "Internal Server Error"
                    }); 
                }
                //정상 수행 시 
                else {
                    res.status(201).send({
                        message : "Successfully register",
                        board_idx : last_board_idx[0]
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
        if(!selectOneBoardResult || !selectWriterOneBoardResult || !selectLikesCntResult) {
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
                data : data_res
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
        console.log(user_idx);
        let checkUserInBoardQuery = 'SELECT * FROM user_board WHERE user_idx = ? AND board_idx = ?';
        let checkUserInBoardResult = await db.queryParam_Arr(checkUserInBoardQuery, [user_idx, board_idx]); 

        if(!checkUserInBoardResult) {
            res.status(500).send({
                message : "Internal Server Error1"
            }); 
        }
        else {
            //일치하면? 
            if(checkUserInBoardResult[0].user_idx == decoded.user_idx){

                //board 테이블과 user_table 에서 한꺼번에 삭제하는 쿼리 
                //let deleteUserBoardQuery = "DELETE FROM board INNER JOIN user_board WHERE board_idx = ?"; 
                //let deleteUserBoardResult = await db.queryParam_Arr(deleteUserBoardQuery, [user_board, board_idx]); 
                //는 실패해서 주석 처리 해버림 -_-ㅋ

                //board 테이블에서 삭제하는 쿼리
                let deleteBoardQuery = "DELETE FROM board WHERE board_idx = ?"; 
                let deleteBoardResult = await db.queryParam_Arr(deleteBoardQuery, [board_idx]);
                

                //user_board 테이블에서 삭제하는 쿼리
                let deleteUserInBoardQuery = "DELETE FROM user_board WHERE board_idx = ?";
                let deleteUserInBoardResult = await db.queryParam_Arr(deleteUserInBoardQuery, [board_idx])
                                 

                if(!deleteBoardResult || !deleteUserInBoardResult){
                    res.status(500).send({
                        message : "Internal server Error2"
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