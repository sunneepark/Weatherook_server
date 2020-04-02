# Weatherook_server
☀Weatherook / 날씨 중심 사용자 맞춤 코디 추천 어플 for BackEnd

<img src="https://user-images.githubusercontent.com/37530599/77816137-99f48180-7103-11ea-8986-56685ca41005.png" width="80%"></img>

## Using
* Node.js
* express.js
* AWS infra(RDS, EC2, SSL, S3)
* RestFul API ```JSON 형식으로 End Point에 뿌려줌.``` (Swagger API)

* 웹페이지와 연동 시에만 , ```var cors = require('cors'); app.use(cors());``` 로 cors 설정
</br></br>
## Screen Shot
<img src="https://user-images.githubusercontent.com/37530599/77816596-19378480-7107-11ea-98dd-e225b777feee.gif" width="70%"></img>
<img src="https://user-images.githubusercontent.com/37530599/77816790-0f168580-7109-11ea-9c18-4c75cbf091fc.gif" width="70%"></img>
<img src="https://user-images.githubusercontent.com/37530599/77816339-6155a780-7105-11ea-84aa-f4cb8139ffdf.png" width="70%"></img>

## Setting
**config/ 폴더 생성 후, 아래의 4개 파일**

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

</br></br>
## Build
```
git clone https://github.com/Weatherook/server
cd server
npm config package-lock false //package-lock 생성 못하게 필요시에
npm start
```

*integrity checksum failed 오류가 나는 경우* **npm cache clean --force 실행**

</br></br>
## Nginx 설정
**웹서버 접속 후, 진행**
1. sudo apt update -y && sudo apt-get install nginx -y
</br>
2. sudo systemctl status nginx
</br>
3. sudo systemctl start nginx , sudo systemctl enable nginx
</br>
4. Nginx 설정파일 수정 ```sudo vi /etc/nginx/sites-available/defalut```

```javascript
server{
	listen 8080;
	sever_name ip;
	location /{
	 proxy_pass http://ip:포트번호;
	 proxy_http_version 1.1;
	 proxy_set_header Upgrade $http_upgrade;
	 proxy_set_header Connection 'upgrade';
	 proxy_set_header Host $host;
	 proxy_cache_bypass $http_upgrade;
	}
	location /public{
	 root /usr/loca/var/www;
	}
     } 
server {
      listen 80;

      server_name ip;

      ## redirect http to https ##
      rewrite (path 정규식 표현으로);

}
```
</br>
5. sudo service nginx restart

