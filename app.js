'use strict';

const Assert = require('assert');
const FS = require('fs');
const MyUtil = require('./MyUtil');
const MyServer = require('./MyServer');

const websiteSetting = {
    "root": "C:/Users/linjunbin/Desktop/htmlTest/MyWebsite",
    "upload_folder": "C:/Users/linjunbin/Desktop/htmlTest/上传下载",
    "main_page": "welcome.html",
    "http_port": 80,
    "https_port": 443,
    "ip": "localhost",
    "enable_web_log": true,
    "debug_log": false,
    "debug_warn": true,
    "debug_error": true
};

const options = {
    key: FS.readFileSync("./SSL/server.key"),
    cert: FS.readFileSync("./SSL/server.pem")
};

// const httpsServer = new MyServer(websiteSetting, options);
// httpsServer.start();
const httpServer = new MyServer(websiteSetting);
httpServer.start();
