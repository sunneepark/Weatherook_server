var express = require('express');
var router = express.Router();

router.use('/', require('./weather.js'))

module.exports = router;