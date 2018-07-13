var express = require('express');
var router = express.Router();

router.use('/an', require('./filteran.js'));
router.use('/latest', require('./latest.js'));
router.use('/popular', require('./popular.js')); 
router.use('/filter', require('./filter.js'));
router.use('/latest', require('./latest.js'));

module.exports = router; 