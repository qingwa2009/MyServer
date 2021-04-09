'use strict';
const FS = require('fs');
const IMyWebLogger = require('./IMyWebLogger');

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
