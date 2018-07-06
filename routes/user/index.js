var express = require('express');
var router = express.Router();

router.use('/setting', require('./setting.js'))
router.use('/follow', require('./follow.js'))

module.exports = router;