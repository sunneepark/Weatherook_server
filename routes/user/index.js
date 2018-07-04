var express = require('express');
var router = express.Router();

router.use('/setting', require('./setting.js'))
router.use('/show', require('./show.js'))


module.exports = router;