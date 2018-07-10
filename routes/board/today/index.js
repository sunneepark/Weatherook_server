var express = require('express');
var router = express.Router();

router.use('/latest', require('./latest.js'));
router.use('/popular', require('./popular.js')); 

module.exports = router; 