'use strict';
const Path = require('path');
const FS = require('fs');
const Net = require('net');
const Http = require('http');
const Assert = require('assert');


const MyUtil = require('./MyUtil');
const { LOG, WARN, ERROR } = MyUtil;
const Application = require('./Application');
const { MyFileManager } = MyUtil;

const { MySession, IMyServer, IMyServerSetting, HttpConst, MyHttpRequest, MyHttpResponse, MySocket, MyWebSocket, IMyWebSocketHandler } = require('./MyHttp');
const RESP_CLASS_LIST = require('./MyResponses');
const WEBSOCKET_HANDLER_LIST = require('./MyWebSocketHandlers');

module.exports = class MyServer extends IMyServer {

    /**
     * @param {IMyServerSetting} websiteSetting 
     * @param {{key:string, cert:string}} httpsOptions 
     */

    constructor(websiteSetting, httpsOptions = undefined) {
        super(httpsOptions);
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
        Application.releaseAllResources();

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
        st['fileManager'] = await Application.fm.status();
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
     * 还没写
     * @param {MyHttpRequest} req 
     */
    createSession(req) {
        //just for sameple test
        const session = MySession.Guest;
        return session;
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {MyHttpResponse} resp 
     */
    _OnRequest(req, resp) {
        MyHttpRequest.decorate(req);
        MyHttpResponse.decorate(resp);

        req.Session = this.createSession(req);

        if (this.websiteSetting.allowCORS) {
            //允许普通的跨域资源共享请求
            resp.setHeader(HttpConst.HEADER["Access-Control-Allow-Origin"], "*");
        }

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
        } else if (method === HttpConst.METHOD.Options) {
            if (this.websiteSetting.allowCORS) {
                this._OnCORSPreflightRequest(req, resp);
            } else {
                resp.respError(req, 500, "server not allow CORS!");
            }
            return;
        }
        this.RespOther(req, resp);
    }

    /**跨域资源共享预请求\
     * 注：普通的跨域请求满足以下所有条件的不会触发浏览器发送预请求
     * 1. method = GET | HEAD | POST
     * 2. header里的Accept, Accept-Language, Content-Language, Content-Type是浏览器自动设置的
     * 3. Content-Type是application/x-www-form-urlencoded | multipart/form-data | text/plain
     * 4. 如果是xhr请求，但是没有监听upload事件
     * 5. 没有使用ReadableStream
     * @param {MyHttpRequest} req 
     * @param {MyHttpResponse} resp 
     */
    _OnCORSPreflightRequest(req, resp) {
        const corsMethod = req.headers[HttpConst.HEADER["Access-Control-Request-Method"]];
        if (corsMethod) {
            //**检查跨域资源预请求时，请求的方法 */
            WARN(req.toString(), `CORS method: ${corsMethod}`);
        }
        const corsHeaders = req.headers[HttpConst.HEADER['Access-Control-Request-Headers']];
        if (corsHeaders) {
            //**检查跨域资源预请求时，请求头包含的headers */
            WARN(req.toString(), `CORS headers: ${corsHeaders}`);
        }

        resp.setHeader(HttpConst.HEADER['Access-Control-Allow-Methods'], corsMethod);
        resp.setHeader(HttpConst.HEADER['Access-Control-Allow-Headers'], corsHeaders);
        resp.setHeader(HttpConst.HEADER["Access-Control-Allow-Origin"], req.headers[HttpConst.HEADER.Origin]);
        resp.setHeader(HttpConst.HEADER["Access-Control-Max-Age"], 24 * 3600);
        resp.setHeader(HttpConst.HEADER["Access-Control-Allow-Credentials"], true);//客户端跨域请求是否允许带上cookie之类的
        resp.respString(req, 200);
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
                resp.respFile_(req, fPath, stat);
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

        MyUtil.WARN(sock.toString(), "upgrading to websocket...");

        MyWebSocket.handshake(req, sock, head, wshandler).then(success => {
            if (success) this.notifyStatusChange()
        });
    }
}


/**
 * @param {String} root 根目录
 * @param {String} url 文件路径
 */
function getResourcePath(root, url) {
    return Path.join(root, url);
}






