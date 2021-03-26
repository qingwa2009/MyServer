'use strict';
const FS = require('fs');


let ENABLE_LOG = false;
let ENABLE_WARN = true;
let ENABLE_ERROR = true;
Object.defineProperties(exports, {
    ENABLE_LOG: { get: () => ENABLE_LOG, set: val => ENABLE_LOG = val },
    ENABLE_WARN: { get: () => ENABLE_WARN, set: val => ENABLE_WARN = val },
    ENABLE_ERROR: { get: () => ENABLE_ERROR, set: val => ENABLE_ERROR = val },
});

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
    if (ENABLE_LOG)
        console.log(`${now()}\tinfo ${message}`, ...params);
}
exports.WARN = WARN;
function WARN(message, ...params) {
    if (ENABLE_WARN)
        console.warn(`${now()}\twarn ${message}`, ...params);
}
exports.ERROR = ERROR;
function ERROR(message, ...params) {
    if (ENABLE_ERROR)
        console.error(`${now()}\terror ${message}`, ...params);
}

exports.MyPromise = MyPromise;
function MyPromise(fn, ...args) {
    return new Promise((res, rej) => {
        fn(...args, (...params) => {
            params[0] instanceof Error ? rej(params[0]) : res(params[1]);
        });
    });
}
