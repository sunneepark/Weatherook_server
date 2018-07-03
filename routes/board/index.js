var express = require('express');
var router = express.Router();

router.use('/', require('./board.js'));

module.exports = router; 