'use strict';

const Assert = require('assert');
const MyUtil = require('./MyUtil');
const MyServer = require('./MyServer');

const websiteSetting = {
    "root": "C:/Users/linjunbin/Desktop/htmlTest/MyWebsite",
    "upload_folder": "C:/Users/linjunbin/Desktop/htmlTest/上传下载",
    "main_page": "welcome.html",
    "port": 80,
    "ip": "localhost",
    "enable_web_log": true,
    "debug_log": false,
    "debug_warn": true,
    "debug_error": true
};

const server = new MyServer(websiteSetting);
server.start();
