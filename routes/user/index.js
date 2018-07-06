var express = require('express');
var router = express.Router();


router.use('/setting', require('./setting.js'));
router.use('/follow', require('./follow.js'));
router.use('/show', require('./show.js'));
router.use('/follower', require('./follower.js'));
router.use('/following', require('./following.js'));

module.exports = router;




