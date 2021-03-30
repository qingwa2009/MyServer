'use strict';
const Path = require('path');
const FS = require('fs');
const Net = require('net');
const Http = require('http');
const Assert = require('assert');

const MyUtil = require('./MyUtil');
const MyFileManager = MyUtil.MyFileManager;

const { IMyServer, IMyServerSetting, HttpConst, MyHttpRequest, MyHttpResponse, MySocket, MyWebSocket } = require('./MyHttp');
const RESP_CLASS_LIST = require('./MyResponses');
const WEBSOCKET_HANDLER_LIST = require('./MyWebSocketHandlers');

module.exports = class MyServer extends IMyServer {

    /**
     * 
     * @param {IMyServerSetting} websiteSetting 
     */
    constructor(websiteSetting) {
        super();
        this.websiteSetting = websiteSetting;
        MyUtil.ENABLE_LOG = this.websiteSetting.debug_log;
        MyUtil.ENABLE_WARN = this.websiteSetting.debug_warn;
        MyUtil.ENABLE_ERROR = this.websiteSetting.debug_error;
        if (this.websiteSetting.enable_web_log)
            MyUtil.setWebLogger(WEBSOCKET_HANDLER_LIST.get('/weblog'));
    }


    start() {
        this.server.listen(this.websiteSetting.port, this.websiteSetting.ip);
    }

    stop() {
        this.server.close(err => {
            if (err) ERROR(this.toString(), err.stack);
            this.fm.releaseAllFileReading();
        });
    }

    async status() {
        return await this.fm.toString();
    }


    _OnListening() {
        console.log(this);
        MyUtil.WARN(`${this.toString()} is listening...`);
    }

    _OnClose() {
        MyUtil.WARN(`${this.toString()} closed!`);
    }
    /**
     * @param {Net.Socket} sock 
     */
    _OnConnection(sock) {
        MySocket.decorate(sock);
    }
    /**
     * @param {Error} err 
     * @param {Net.Socket} sock 
     */
    _OnClientError(err, sock) {
        MyUtil.WARN(sock.toString(), `clientError: ${err.message}`);
        if (err.code === 'ECONNRESET' || !sock.writable) return;
        sock.end(`HTTP/1.1 400 clientError ${err}\r\n\r\n`);
    }

    _OnError(err) {
        MyUtil.ERROR(err);
    }



    /**
     * @param {MyHttpRequest} req 
     * @param {MyHttpResponse} resp 
     */
    _OnRequest(req, resp) {
        MyHttpRequest.decorate(req);
        MyHttpResponse.decorate(resp);

        const { method, url } = req;

        if (method === HttpConst.METHOD.Get) {
            switch (url) {
                case "/":
                    resp.respRedirect(req, this.websiteSetting.main_page);
                    break;
                default:
                    let fPath = getResourcePath(this.websiteSetting.root, url);
                    this.RespStaticRes(req, resp, fPath).catch((err) => this.RespOther(req, resp));
                    break;
            }
            return;
        }
        this.RespOther(req, resp);
    }


    /**如果找不到静态资源就rej(err)
     * @param {MyHttpRequest} req 
     * @param {MyHttpResponse} resp 
     * @param {String} fPath 
    */
    RespStaticRes(req, resp, fPath) {
        return new Promise((res, rej) => {
            FS.stat(fPath, (err, stat) => {
                if (err) {
                    rej(err);
                    return;
                }
                if (!stat.isFile()) {
                    rej(err);
                    return;
                }

                const ifmodsince = req.headers[HttpConst.HEADER["If-modified-since"]];
                const lmt = stat.mtime;
                if (ifmodsince) {
                    if (parseInt(lmt.getTime() / 1000) * 1000 === new Date(ifmodsince).getTime()) {
                        resp.respString(req, 304, '');
                        res();
                        return;
                    }
                }

                //客户端不缓存文件
                resp.setHeader(HttpConst.HEADER["Cache-Control"], HttpConst.HEADER["no-cache"]);
                resp.setHeader(HttpConst.HEADER["Last-Modified"], `${lmt.getFullYear()}/${lmt.getMonth() + 1}/${lmt.getDate()} ${lmt.getHours()}:${lmt.getMinutes()}:${lmt.getSeconds()}`);
                resp.respFile(req, fPath, stat, this);
                res();
            })
        });
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {MyHttpResponse} resp 
     */
    RespOther(req, resp) {
        //仅提取url的目录部分
        const url = MyUtil.extractUrlFolderPart(req.url);

        const RespClass = RESP_CLASS_LIST.get(url);
        if (!RespClass) {
            resp.respError(req, 404);
            return;
        }
        MyHttpResponse.create(RespClass, resp).response(req, this);
        // console.log(resp);
    }

    /**
     * @param {Http.IncomingMessage} req 
     * @param {Net.Socket} sock 
     * @param {Buffer} head 
     */
    _OnUpgarde(req, sock, head) {
        MyHttpRequest.decorate(req);

        const wshandler = WEBSOCKET_HANDLER_LIST.get(req.url);
        if (!wshandler) {
            sock.end();
            return;
        }

        MyUtil.LOG(sock.toString(), "upgrading to websocket...");
        const ws = MyWebSocket.handshake(req, sock, head);
        if (ws) wshandler.add(ws);
    }
}


/**
 * @param {String} root 根目录
 * @param {String} url 文件路径
 */
function getResourcePath(root, url) {
    return Path.join(root, url);
}






