'use strict';
const Http = require('http');
const FS = require('fs');
const Assert = require('assert');
const Path = require('path');
const HttpConst = require('./HttpConst');
const Application = require("../Application");
const MyHttpRequest = require('./MyHttpRequest');
const IMyServer = require('./IMyServer');
const { LOG, WARN, ERROR, MyFileManager } = require('../MyUtil');
const { MyDbCriteria } = require('../MySqlite');

//==========MyHttpResponse==========
class MyHttpResponse extends Http.ServerResponse {

    constructor() {
        Assert(false, "please use decorate!");
    }

    toString() {
        return this.socket.toString();
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        Assert(false, '必须重载该函数');
    }
    /**
     * @param {MyHttpRequest} req 
     * @param {Number} statusCode 
     * @param {String} str 
     */
    respString(req, statusCode, str = '') {
        this.statusCode = statusCode;
        this.statusMessage = Http.STATUS_CODES[statusCode];

        if (str) {
            const buf = Buffer.from(str);
            this.setHeader(HttpConst.HEADER["Content-Type"], HttpConst.CONTENT_TYPE.UTF8);
            this.setHeader(HttpConst.HEADER["Content-Length"], buf.length);
            this.write(buf);
        }
        this.end();
        WARN(req.toString(), `resp ${this.statusCode} ${this.statusMessage}\t${str.substr(0, 123)}...`);
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {Number} statusCode 
     * @param {String} errstr 
     */
    respError(req, statusCode, errstr) {
        this.respString(req, statusCode, errstr);
    }


    /**
     * 暂停接收流并响应错误
     * @param {MyHttpRequest} req 
     * @param {Number} statusCode 
     * @param {String} errstr client收不到这条消息，估计client不是全双工-_-!!!
     */
    respErrorAndPauseRecvStream(req, statusCode, errstr) {
        req.on('readable', () => req.pause());      //停止接收
        this.respError(req, statusCode, errstr);    //client收不到这条消息，估计client不是全双工-_-!!!
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {String} location 
     */
    respRedirect(req, location) {
        this.statusCode = 302
        this.statusMessage = Http.STATUS_CODES[302];
        this.setHeader(HttpConst.HEADER.Location, location);
        this.end();
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {string} path
     * @param {string} customContentType 自定义content-type 对于普通文件请设置为\*\/*防止被浏览器作为可执行文件运行;
     */
    respFile(req, path, customContentType = undefined) {
        FS.stat(path, (err, stat) => {
            if (err) {
                if (err.code === 'ENOENT')
                    this.respError(req, 404, err.message);
                else
                    this.respError(req, 500, err.message);
                return;
            }
            if (!stat.isFile()) {
                this.respError(req, 400, `the request file is not a file!`);
                return;
            }
            this.respFile_(req, path, stat, customContentType);
        });
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {string} path
     * @param {FS.Stats} stat path对应的fs.stats，必须确保stat.isFile()为true才行
     * @param {string} customContentType 自定义content-type 对于普通文件请设置为\*\/*防止被浏览器作为可执行文件运行;
     */
    async respFile_(req, path, stat, customContentType = undefined) {
        Assert(stat.isFile(), 'resp file is not a file: ' + path);
        const t = customContentType || (HttpConst.DOC_CONT_TYPE[Path.extname(path).toLocaleLowerCase()] || '*/*');

        let fh = null;
        try {
            fh = await Application.fm.open(path);
        } catch (error) {
            this.respError(req, 500, error.message);
            return;
        }

        this.setHeader(HttpConst.HEADER["Content-Type"], t);
        this.setHeader(HttpConst.HEADER["Content-Length"], stat.size);
        WARN(this.toString(), `piping file ${path}, total length: ${stat.size}bytes`);
        fh.pipe(this).then(
            () => {
                this.end();
                // req.socket.destroy();
                WARN(this.toString(), `success pipe file ${path}!`);
            },
            error => {
                WARN(this.toString(), `failed pipe file ${path} : `, error.message);
                this.destroy(error);
                req.destroy(error);
            }
        )
    }

    /**
     * 检查是否对应的请求方法，不匹配将自动回复405错误，并返回true
     * @param {MyHttpRequest} req
     * @param {HttpConst.METHOD} method 
     */
    respIfMethodIsNot(req, method) {
        if (req.method !== method) {
            this.respError(req, 405);
            return true;
        }
        return false;
    }

    /**
     * 检查请求体长度，如果小于minLen，自动回复400，如果大于maxLen，自动回复413，并返回true
     * @param {MyHttpRequest} req 
     * @param {number} minLen 默认值1
     * @param {number} maxLen 默认值1095216660480
     * @returns {boolean}
     */
    respIfContLenNotInRange(req, minLen = 1, maxLen = 1095216660480) {
        const _bodyLen = parseInt(req.headers[HttpConst.HEADER["Content-Length"]]);


        if (_bodyLen < minLen) {
            this.respError(req, 400, `content-length is too small`);
            return true;
        }

        if (maxLen && _bodyLen > maxLen) {
            this.respError(req, 413);
            return true;
        }
        req.headers[HttpConst.HEADER["Content-Length"]] = _bodyLen;

        return false;
    }

    /**
     * 检查query是否string，不匹配将自动回复400错误，并返回true
     * @param {MyHttpRequest} req
     * @param {string|string[]} query
     * @param {string} queryname 用于响应时提示client那个query类型错误     
     * @param {boolean} orEmpty 空字符串是否也报错，默认false
     * @returns {boolean} 
     */
    respIfQueryIsNotStr(req, query, queryname, orEmpty = false) {
        if (typeof query !== 'string') {
            this.respError(req, 400, `query type error：'${queryname}' must be string`);
            return true;
        }
        if (orEmpty && query === "") {
            this.respError(req, 400, `query type error：'${queryname}' must not be empty string`);
            return true;
        }
        return false;
    }

    /**
     * 检查query是否array，不匹配将自动回复400错误，并返回true
     * @param {MyHttpRequest} req
     * @param {string[]} query
     * @param {string} queryname 用于响应时提示client那个query类型错误     
     * @returns {boolean} 
     */
    respIfQueryIsNotArray(req, query, queryname) {
        if (!Array.isArray(query)) {
            this.respError(req, 400, `query type error：'${queryname}' must be array`);
            return true;
        }
        return false;
    }



    /**
     * 自动处理上传文件的请求
     * @param {MyHttpRequest} req 
     * @param {string} path 
     */
    handleUpload(req, path) {
        /**@type {MyFileManager.MyFileWriteStream} */
        let _ws = null;
        Application.fm.create(path).then(
            ws => {
                if (req.aborted) {
                    ws.giveup();
                    return;
                }
                _ws = ws;
                req.pipe(ws);
                ws.onceWriteFinish((err, path) => {
                    if (err) {
                        if (req.aborted) {
                            this.end();
                        } else {
                            this.respError(req, 500, err.toString());
                        }
                        return;
                    }
                    this.respString(req, 200);
                });
            },
            err => {
                // if (_ws)
                //     req.unpipe(_ws);
                // req.pause();                             //没效果过，辣鸡                                
                this.respErrorAndPauseRecvStream(req, 500, err.toString());
                this.once('finish', () =>
                    req.destroy()
                );
            }
        );

        req.once('aborted', () => {
            WARN(this.toString(), 'request aborted');
            if (_ws) _ws.giveup();
        });
        // req.once('error', err => {
        //     WARN(this.toString(), 'request error: ', err);
        //     this.respError(req, 400, err.toString());
        // });
        // req.once('end', () => {
        //     WARN(this.toString(), 'request end');
        // });
        // req.once('close', () => {
        //     //底层链接已关闭，socket已经设为null了
        // });
    }

    /**
     * 处理POST过来的JSON数据，如果解析失败自动响应400
     * @param {MyHttpRequest} req 
     * @param {(json:Object)=>{}} callback 
     * 如果解析成功，调用callback()；失败则自动响应400
     */
    handleJSON(req, callback) {
        req.onceReqBodyRecvComplete(bufs => {
            try {
                const obj = JSON.parse(bufs.join(""));
                callback(obj);
            } catch (error) {
                this.respError(req, 400, error.toString());
            }
        });
    }

    /**
     * 处理POST过来的MyDbCriteria数据，如果解析失败自动响应400
     * @param {MyHttpRequest} req 
     * @param {(criteria:MyDbCriteria)=>{}} callback 
     * 如果解析成功，调用callback()；失败则自动响应400
     */
    handleDbCriteria(req, callback) {
        this.handleJSON(req, (obj) => {
            try {
                MyDbCriteria.decorate(obj)
                callback(obj);
            } catch (error) {
                this.respError(req, 400, error.toString());
            }
        })
    }


    static _decorate() {
        Assert(!(this instanceof MyHttpResponse), "can not new or re decorate!");
        Assert((this instanceof Http.ServerResponse), "'this' is not instanceof Http.ServerResponse!");

        Object.setPrototypeOf(this, MyHttpResponse.prototype);
        this.hasErr = false;
    }

    /**
     * @param {Http.ServerResponse} resp
     */
    static decorate(resp) {
        MyHttpResponse._decorate.call(resp);
    }

    /**
     * @param {Http.ServerResponse} resp
     */
    static create(RespClass, resp) {
        Object.setPrototypeOf(resp, RespClass.prototype);
        return resp;
    }
}
module.exports = MyHttpResponse;
