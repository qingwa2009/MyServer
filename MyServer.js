'use strict';
const Path = require('path');
const FS = require('fs');
const Net = require('net');
const Http = require('http');
const Assert = require('assert');


const MyUtil = require('./MyUtil');
const { LOG, WARN, ERROR } = MyUtil;
const MyFileManager = MyUtil.MyFileManager;

const { IMyServer, IMyServerSetting, HttpConst, MyHttpRequest, MyHttpResponse, MySocket, MyWebSocket, IMyWebSocketHandler } = require('./MyHttp');
const RESP_CLASS_LIST = require('./MyResponses');
const WEBSOCKET_HANDLER_LIST = require('./MyWebSocketHandlers');

module.exports = class MyServer extends IMyServer {

    /**
     * @param {MyFileManager} fm 
     * @param {IMyServerSetting} websiteSetting 
     * @param {{key:string, cert:string}} httpsOptions 
     */

    constructor(fm, websiteSetting, httpsOptions = undefined) {
        super(fm, httpsOptions);
        this.websiteSetting = websiteSetting;
        MyUtil.setEnableLog(this.websiteSetting.debug_log);
        MyUtil.setEnableWarn(this.websiteSetting.debug_warn);
        MyUtil.setEnableError(this.websiteSetting.debug_error);
        MyUtil.setEnableWeblog(this.websiteSetting.enable_web_log);
        if (this.websiteSetting.enable_web_log)
            MyUtil.setWebLogger(WEBSOCKET_HANDLER_LIST.get('/weblog'));
    }

    start() {
        if (this.server.listening) {
            WARN(this.toString(), "Can not start! server is already listening!");
            return;
        }

        this.port = this.isHttps ? this.websiteSetting.https_port : this.websiteSetting.http_port;
        this.ip = this.websiteSetting.ip;
        if (!this.ip) {
            const ips = MyUtil.getLocalIP4();
            if (ips.length > 0) {
                this.ip = ips[0];
            } else {
                this.ip = "127.0.0.1";
            }
        }
        this.server.listen(this.port, this.ip);
    }

    /**所有连接都关闭时才会触发close事件 */
    stop() {
        this.fm.releaseAllFileReading();

        if (!this.server.listening) {
            WARN(this.toString(), "Can not stop! server is not listening!");
            return;
        }

        return new Promise((res, rej) => {
            this.server.close(err => {
                if (err) ERROR(this.toString(), err.stack);
                this.isListening = false;
                res();
            });
        });
    }

    async status() {
        const st = {};
        st['socketCount'] = this.socketCount;
        st['fileManager'] = await this.fm.status();
        st['webSocket'] = WEBSOCKET_HANDLER_LIST.status();
        st['debug'] = { log: MyUtil.getEnableLog(), warn: MyUtil.getEnableWarn(), error: MyUtil.getEnableError(), weblog: MyUtil.getEnableWeblog() };
        return JSON.stringify(st);
    }


    _OnListening() {

        const addr = this.server.address();
        this.ip = addr.address;
        this.port = addr.port;
        MyUtil.WARN(`${this.toString()} is listening...`);
    }

    _OnClose() {
        MyUtil.WARN(`server ${this.websiteSetting.ip} closed!`);
    }

    /**
     * @param {Net.Socket} sock 
     */
    // _OnConnection(sock) {
    //     MySocket.decorate(sock, this);
    // }

    /**
     * @param {TLS.TLSSocket} sock 
     */
    // _OnSecureConnection(sock) {
    //     MySocket.decorate(sock, this);
    // }

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
                resp.respFile_(req, fPath, stat, this);
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
        const ws = MyWebSocket.handshake(req, sock, head, wshandler);
        if (ws) {
            wshandler.add(ws);
            this.notifyStatusChange();
        }
    }
}


/**
 * @param {String} root 根目录
 * @param {String} url 文件路径
 */
function getResourcePath(root, url) {
    return Path.join(root, url);
}






