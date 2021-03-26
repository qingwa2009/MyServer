'use strict';
const Http = require('http');
const Assert = require('assert');
const IMyServerSetting = require('./IMyServerSetting');
const { MyFileManager } = require('../MyUtil');

module.exports = class IMyServer {
    websiteSetting = new IMyServerSetting();
    fm = new MyFileManager();
    server = Http.createServer();

    constructor() {
        this.server.on('request', this._OnRequest.bind(this));
        this.server.on("listening", this._OnListening.bind(this));
        this.server.on("connection", this._OnConnection.bind(this));
        this.server.on("upgrade", this._OnUpgarde.bind(this));
        this.server.on("clientError", this._OnClientError.bind(this));
        this.server.on("error", this._OnError.bind(this));
        this.server.on("close", this._OnClose.bind(this));
    }

    start() {
        Assert(false, '必须重载该函数');
    }
    stop() {
        Assert(false, '必须重载该函数');
    }
    /**@returns {string} */
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
        Assert(false, '必须重载该函数');
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
        const addr = this.server.address();
        return `Server ${addr.address}:${addr.port}`;
    }
}