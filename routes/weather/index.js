var express = require('express');
var router = express.Router();

router.use('/', require('./weather.js'));
router.use('/show', require('./show.js'));

module.exports = router;