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
const { MyDbCriteria, MyTableData } = require('../MySqlite');

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
     * 根据websiteSetting添加额外的响应头信息
     * @param {MyHttpRequest} req       
     */
    _addExtraRespHeaders(req) {
        if (!Application.websiteSetting.extra_resp_headers) return;

        const url = req.url.toLowerCase();
        const headers = Application.websiteSetting.extra_resp_headers[url];
        if (!headers) return;

        const keys = Object.keys(headers);
        for (const key of keys) {
            this.setHeader(key, headers[key]);
        }
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {Number} statusCode 
     * @param {String} str 
     */
    respString(req, statusCode, str = '') {
        this.statusCode = statusCode;
        this.statusMessage = Http.STATUS_CODES[statusCode];
        this._addExtraRespHeaders(req);
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
        this._addExtraRespHeaders(req);
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

        this._addExtraRespHeaders(req);
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
                WARN(this.toString(), `failed pipe file ${path} : `, error.stack || error.message);
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
     * 检查query是否符合给定的条件类型，不符合将自动回复400错误，并返回true
     * @param {MyHttpRequest} req 
     * @param {Object<string, string|null|[]> } qFields 检查的条件string|null|[]\
     * 取值string表示该字段必须有值，否则自动回复400错误，并返回true\
     * 取值null表示该字段可选，可以为string也可以为null\
     * 取值[]表示该字段有0-多个值\
     * 取得的值将全部覆盖qFields对应字段并返回false；
     */
    respIfQueryIsInvalid(req, qFields) {
        const ks = Object.keys(qFields);
        const n = ks.length
        const querys = req.querys;
        for (let i = 0; i < n; i++) {
            const k = ks[i];
            const v = qFields[k];
            if (v === null) {
                qFields[k] = querys.get(k);
            } else if (v instanceof Array) {
                qFields[k] = querys.getAll(k);
            } else {
                qFields[k] = querys.get(k);
                if (qFields[k] === null) {
                    this.respError(req, 400, `query type error：'${k}' must be string`);
                    return true;
                }
            }
        }
        return false;
    }


    /**
     * 自动处理上传文件的请求
     * @param {MyHttpRequest} req 
     * @param {string} path 
     * @param {()=>Promise<void>} callback 写入完成时调用，需要返回Promise，
     * Promise的状态将影响响应的是200还是500
     */
    handleUpload(req, path, callback = undefined) {
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
                    if (callback) {
                        callback().then(() => {
                            this.respString(req, 200);
                        }, err => {
                            this.respError(req, 500, err.toString());
                        });
                    } else {
                        this.respString(req, 200);
                    }
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
     * 如果解析成功，调用callback()；失败则自动响应400，callback抛出的错误也会自动响应400
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
     * 处理POST过来的MyTableData数据，如果解析失败自动响应400
     * @param {MyHttpRequest} req 
     * @param {(mtd:MyTableData)=>{}} callback 
     * 如果解析成功，调用callback()；失败则自动响应400，callback抛出的错误也会自动响应400
     */
    handleMyTableData(req, callback) {
        this.handleJSON(req, (obj) => {
            try {
                MyTableData.decorate(obj);
                callback(obj);
            } catch (error) {
                this.respError(req, 400, error.toString());
            }
        })
    }

    /**
     * 处理POST过来的MyDbCriteria数据，如果解析失败自动响应400
     * @param {MyHttpRequest} req 
     * @param {(criteria:MyDbCriteria)=>{}} callback 
     * 如果解析成功，调用callback()；失败则自动响应400，callback抛出的错误也会自动响应400
     */
    handleDbCriteria(req, callback) {
        this.handleJSON(req, (obj) => {
            try {
                MyDbCriteria.decorate(obj);
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
