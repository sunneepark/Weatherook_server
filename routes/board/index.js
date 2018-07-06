var express = require('express');
var router = express.Router();

router.use('/', require('./board.js'));
router.use('/commend', require('./commend.js'));
router.use('/follow', require('./follow.js'));
router.use('/like', require('./like.js'));


module.exports = router; 