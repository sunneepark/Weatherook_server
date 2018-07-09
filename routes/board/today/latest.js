var express = require('express');
var router = express.Router();

router.get('/', async function(res, res){
    console.log("hi");
})

module.exports = router; 