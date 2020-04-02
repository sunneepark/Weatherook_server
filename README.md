# Weatherook_server
☀Weatherook / 날씨 중심 사용자 맞춤 코디 추천 어플 for BackEnd

<img src="https://user-images.githubusercontent.com/37530599/77816137-99f48180-7103-11ea-8986-56685ca41005.png" width="80%"></img>


## Setting
**config/ 폴더**

1. dbPool.js
```node.js
var mysql = require('promise-mysql')

const dbConfig = {
    host : '',
    port : '',
    user : '',
    password : '',
    database : '',
    connectionLimit : 20
 };

module.exports = mysql.createPool(dbConfig);
```

2. awsConfig.json
```node.js
{
	"accessKeyId": "",
	"secretAccessKey" : "",
	"region" : "ap-northeast-2"
}
```

3. multer.js
```node.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/awsConfig.json');
 aws.config.region = 'ap-northeast-2'; //Seoul
     aws.config.update({
       accessKeyId: "",
       secretAccessKey: ""
     });
const s3 = new aws.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: '',
        acl: 'public-read',
        key: function(req, file, cb) {
            cb(null, Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});

module.exports = upload;
```

4. secretKey.js
```node.js
module.exports = {
    secret : "(Anykey you want)"
}
```
## Build
'''
git clone https://github.com/Weatherook/server
cd server
npm config package-lock false //package-lock 생성 못하게 필요시에
npm start
'''

*integrity checksum failed 오류가 나는 경우 npm cache clean --force 실행*
