const express = require('express');
const router = express.Router();
const db = require('../../module/pool.js'); 
const upload = require('../../config/multer.js');
const jwt = require('../../module/jwt.js');

//게시글 등록하기
router.post('/',upload.single('board_img'), async function(req, res){
    
    let token = req.headers.token;
    let board_desc = req.body.board_desc;
    
    //let board_weather=req.body.board_weather;
    let board_temp_min=req.body.board_weather_min;
    let board_temp_max=req.body.board_temp_max;
    let board_auth = req.body.board_auth;
    let style_type = req.body.board_stylelist;
    let board_date=req.body.board_date; //글 등록시간
    //let board_hashtag = JSON.parse(req.body.board_hashtag);
    board_img = req.file.location; 

    // board_img 가 없을 때 
    if(!req.file || !board_desc  || !board_auth || !style_type || !token ){
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
                let user_id=checkBoardResult[0].user_id;
                //let board_date = moment().format('YYYY-MM-DD HH:mm:ss'); 
                
                //board 테이블에 게시글 정보 삽입
                let insertBoardQuery = 'INSERT INTO board (board_img, board_desc, board_temp_min, board_temp_max, board_weather, board_auth, board_date, writer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'; 
                let insertBoardResult = await db.queryParam_Arr(insertBoardQuery, [board_img, board_desc, board_temp_min, board_temp_max, board_weather, board_auth, board_date,user_id]); 
               
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

                /*//hashtag 테이블에 게시글 해시태그 정보 삽입
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
                }*/
               
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
    
    //let hashtag_desc; 
    let comment_idx;
    let comment_arr = []; 
    let user_id;
    let user_img;
    var flag; //댓글이 2개 이상인지 확인하는 flag
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
    
        //like_cnt를 가져오기 위한 board_like와 like 테이블 접근
        let selectLikesCnt = 'SELECT count(*) as count FROM board_like WHERE board_idx = ?';
        let selectLikesCntResult = await db.queryParam_Arr(selectLikesCnt, [board_idx]);

        //comment를 가져오기 위한 board_comment와 comment 테이블 접근
        let checkCommentInBoard = 'SELECT * FROM board_comment WHERE board_idx = ?'; 
        let checkCommentInBoardRes = await db.queryParam_Arr(checkCommentInBoard, [board_idx]); 

        if(!checkCommentInBoardRes || !selectOneBoardResult || !selectWriterOneBoardResult || !selectLikesCntResult){
            res.status(500).send({
                message : "Internal Server Error"
            }); 
        }
        else {
            let getUserId = 'SELECT * FROM user WHERE user_idx = ?'; 
            let getUserIdRes = await db.queryParam_Arr(getUserId, [selectWriterOneBoardResult[0].user_idx]);
            
            let getUserImg = 'SELECT user_img FROM user WHERE user_id = ?';
            let getUserImgRes;
            if(!getUserIdRes){
                res.status(500).send({
                    message : "Internal Server Error1"
                });
                return;
            }
            user_id = getUserIdRes[0].user_id;
            user_img = getUserIdRes[0].user_img; 
            
            //let getCommentInfo = 'SELECT * FROM comment c, (SELECT user_img FROM user u, board b WHERE u.user_id = b.writer_id) u WHERE comment_idx = ?'; 
            //let getCommentInfoRes;
            let getCommentInfo = 'SELECT * FROM comment WHERE comment_idx = ?'; 
            let getCommentInfoRes;
            
            var len_cmt; 
            if(checkCommentInBoardRes.length > 2){
                flag = 1; //댓글 수가 2개 이상일 때 flag = 1
                len_cmt = 2 //board에서 뿌려줄 comment 수는 2개
            }
            else {
                flag = 0; //댓글 수가 2개보다 적을 때는 flag = 0
                len_cmt = checkCommentInBoardRes.length //board에서 뿌려줄 comment 수는 원래 코멘트 수와 같다. 
            }
            
            for (var i=0; i<len_cmt; i++){
                comment_idx = checkCommentInBoardRes[i].comment_idx; 
                getCommentInfoRes = await db.queryParam_Arr(getCommentInfo, [comment_idx]); 
                if(!getCommentInfoRes){
                    res.status(500).send({
                        mesasge : "Internal Server Error2"
                    }); 
                }
                else {
                    comment_arr = comment_arr.concat(getCommentInfoRes[0]);
                }
            }
        }
        let data_res = {
            user_img : user_img,
            user_id : user_id, 
            board_img : selectOneBoardResult[0].board_img,
            board_desc : selectOneBoardResult[0].board_desc, 
            //hashtag_desc : hashtag_desc, 
            like_cnt : selectLikesCntResult[0].count, 
            board_temp_min : selectOneBoardResult[0].board_temp_min, 
            board_temp_max : selectOneBoardResult[0].board_temp_max,
            board_weather : selectOneBoardResult[0].board_weather,
            board_date : moment(selectOneBoardResult[0].board_date).format('MM-DD'),
            comment_list : comment_arr,
            comment_cnt : checkCommentInBoardRes.length,
            flag : flag
        }
        res.status(201).send({
            message : "Successfully get One board", 
            data : data_res
        }); 
    
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