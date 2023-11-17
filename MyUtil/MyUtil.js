'use strict';
const FS = require('fs');
const os = require('os');
const Path = require("path");
const IMyWebLogger = require('./IMyWebLogger');
const ExceptionPathNoInFolder = require("./ExceptionPathNoInFolder");

let ENABLE_LOG = false;
let ENABLE_WARN = true;
let ENABLE_ERROR = true;
let ENABLE_WEBLOG = true;
/**@type {IMyWebLogger} */
let WEB_LOGGER = undefined;

exports.setEnableLog = function (b) {
    ENABLE_LOG = b;
}
exports.setEnableWarn = function (b) {
    ENABLE_WARN = b;
}
exports.setEnableError = function (b) {
    ENABLE_ERROR = b;
}
exports.setEnableWeblog = function (b) {
    ENABLE_WEBLOG = b;
}

exports.getEnableLog = function () {
    return ENABLE_LOG;
}
exports.getEnableWarn = function () {
    return ENABLE_WARN;
}
exports.getEnableError = function () {
    return ENABLE_ERROR;
}
exports.getEnableWeblog = function () {
    return ENABLE_WEBLOG;
}



exports.setWebLogger = function (/**@type {IMyWebLogger} */wg) {
    WEB_LOGGER = wg;
}

exports.now = now;
function now() {
    var d = new Date();
    return `${d.getFullYear()}${('0' + (d.getMonth() + 1)).slice(-2)}${('0' + d.getDate()).slice(-2)} ${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}:${('0' + d.getSeconds()).slice(-2)}.${('0' + d.getMilliseconds()).slice(-3)}`;
}


exports.formatDate =
    /**
     * @param {Date} d 
     */
    function (d) {
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}:${('0' + d.getSeconds()).slice(-2)}.${('0' + d.getMilliseconds()).slice(-3)}`;
    };

exports.extractUrlFolderPart =
    /**  
     * 仅提取url的目录部分   
     * '/abc'=>'/abc'; '/abc/def'=>'/abc/def'; '/abc/def/'=>'/abc/def';
     * '/abc.txt'=>'/'; '/abc/def/gh.txt'=>'/abc/def'
     * @param {string} url 
     */
    function (url) {
        const li = url.lastIndexOf('/');
        const lj = url.indexOf('.', li);
        if (li === 0 && lj !== -1) return '/';
        return lj !== -1 || li === url.length - 1 ? url.substr(0, li) : url;
    };


exports.LOG = LOG;
function LOG(message, ...params) {
    if (ENABLE_LOG) {
        const s = `${now()}\tinfo\t${message}`;
        console.log(s, ...params);
        if (ENABLE_WEBLOG && WEB_LOGGER) {
            params.unshift(s);
            WEB_LOGGER.send(params.join('\t'));
        }
    }

}
exports.WARN = WARN;
function WARN(message, ...params) {
    if (ENABLE_WARN) {
        const s = `${now()}\twarn\t${message}`;
        console.log(s, ...params);
        if (ENABLE_WEBLOG && WEB_LOGGER) {
            params.unshift(s);
            WEB_LOGGER.send(params.join('\t'));
        }
    }
}
exports.ERROR = ERROR;
function ERROR(message, ...params) {
    if (ENABLE_ERROR) {
        const s = `${now()}\terror\t${message}`;
        console.log(s, ...params);
        if (ENABLE_WEBLOG && WEB_LOGGER) {
            params.unshift(s);
            WEB_LOGGER.send(params.join('\t'));
        }
    }
}

exports.MyPromise = MyPromise;
function MyPromise(fn, ...args) {
    return new Promise((res, rej) => {
        fn(...args, (...params) => {
            params[0] instanceof Error ? rej(params[0]) : res(params[1]);
        });
    });
}

exports.getLocalIP4 = getLocalIP4;

function getLocalIP4() {
    const ips = [];
    var dic = os.networkInterfaces();
    var vs = Object.values(dic);
    for (let i = 0; i < vs.length; i++) {
        const v = vs[i];
        for (let j = 0; j < v.length; j++) {
            const vv = v[j];
            if (vv.family === 'IPv4') {
                ips.push(vv.address);
            }
        }
    }
    return ips;
}

exports.isPathInFolder = isPathInFolder;
function isPathInFolder(path, folder) {
    var p0 = Path.resolve(path) + Path.sep;
    var p1 = Path.resolve(folder) + Path.sep;

    return p0.startsWith(p1);
}

exports.joinPath = joinPath;
/**
 * @param {string} folder 
 * @param {string} filename 
 * @param {boolean} mustInFolder 
 * keepInFolder为true：如果Path.join文件并不在该目录则throw ExceptionPathNoInFolder，默认true
 * @throws {ExceptionPathNoInFolder}
 */
function joinPath(folder, filename, mustInFolder = true) {
    let path = Path.resolve(Path.join(folder, filename));
    if (mustInFolder && !isPathInFolder(path, folder)) {
        throw new ExceptionPathNoInFolder(`'${path}' not in '${folder}'`);
    }
    return path;
}

exports.uuidv4=uuidv4;
function uuidv4(){
    //抄的
    let d=new Date().getTime();
    let uuid="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c=>{
        let r= (d + Math.random()*16)%16 | 0;
        d=Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}