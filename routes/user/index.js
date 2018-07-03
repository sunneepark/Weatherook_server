var express = require('express');
var router = express.Router();

router.use('/setting', require('./setting.js'))


module.exports = router;