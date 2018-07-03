var express = require('express');
var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

router.use('/auth', require('./auth/index.js'))
router.use('/user', require('./user/index.js'))

module.exports = router;
