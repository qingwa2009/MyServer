'use strict';
const Http = require('http');
const Https = require("https");
const TLS = require('tls');
const Assert = require('assert');
const { EventEmitter } = require('events');
const IMyServerSetting = require('./IMyServerSetting');
const MySocket = require('./MySocket');
const { MyFileManager } = require('../MyUtil');

module.exports = class IMyServer extends EventEmitter {
    websiteSetting = new IMyServerSetting();
    /**@type {MyFileManager} */
    fm = null;
    /**@type {Http.Server | Https.Server} */
    server = null;
    isHttps = false;
    socketCount = 0;
    _isStatusChange = false;


    port = 0;
    ip = '0.0.0.0';
    /**
     * @param {MyFileManager} fm 
     * @param {{key:Buffer, cert:Buffer}} httpsOptions 
     */
    constructor(fm, httpsOptions = undefined) {
        super();
        this.fm = fm;
        if (httpsOptions) {
            this.server = Https.createServer(httpsOptions);
            this.isHttps = true;
            this.server.on("secureConnection", this._OnSecureConnection.bind(this));
        } else {
            this.server = Http.createServer();
        }
        this.server.on('request', this._OnRequest.bind(this));
        this.server.on("listening", this._OnListening.bind(this));
        this.server.on("connection", this._OnConnection.bind(this));
        this.server.on("upgrade", this._OnUpgarde.bind(this));
        this.server.on("clientError", this._OnClientError.bind(this));
        this.server.on("error", this._OnError.bind(this));
        this.server.on("close", this._OnClose.bind(this));
    }

    notifyStatusChange() {
        if (this._isStatusChange) return;
        this._isStatusChange = true;
        process.nextTick(() => {
            this.emit('status');
            this._isStatusChange = false;
        });
    }

    onStatusChange(cb) {
        this.on('status', cb);
    }

    start() {
        Assert(false, '必须重载该函数');
    }
    /**@returns {Promise<void>} */
    stop() {
        Assert(false, '必须重载该函数');
    }
    /**@returns {Promise<string>} */
    status() {
        Assert(false, '必须重载该函数');
    }

    _OnListening() {
        Assert(false, '必须重载该函数');
    }

    _OnClose() {
        Assert(false, '必须重载该函数');
    }
    /**
     * @param {Net.Socket} sock 
     */
    _OnConnection(sock) {
        MySocket.decorate(sock, this);
        // Assert(false, '必须重载该函数');
    }
    /**
     * @param {TLS.TLSSocket} sock 
     */
    _OnSecureConnection(sock) {
        MySocket.decorate(sock, this);
        // Assert(false, '必须重载该函数');
    }
    /**
     * @param {Error} err 
     * @param {Net.Socket} sock 
     */
    _OnClientError(err, sock) {
        Assert(false, '必须重载该函数');
    }

    _OnError(err) {
        Assert(false, '必须重载该函数');
    }

    /**
     * @param {Http.IncomingMessage} req 
     * @param {Net.Socket} sock 
     * @param {Buffer} head 
     */
    _OnUpgarde(req, sock, head) {
        Assert(false, '必须重载该函数');
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {MyHttpResponse} resp 
     */
    _OnRequest(req, resp) {
        Assert(false, '必须重载该函数');
    }

    toString() {
        return `Server ${this.ip}:${this.port}`;
    }
}

