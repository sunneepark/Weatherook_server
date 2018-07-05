var express = require('express');
var router = express.Router();

router.use('/', require('./board.js'));
router.use('/commend', require('./commend.js'));
//router.use('/today', require('./today.js'));


module.exports = router; 