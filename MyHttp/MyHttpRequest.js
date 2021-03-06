'use strict';
const Http = require('http');
const Assert = require('assert');
const QueryString = require('querystring');
const MySocket = require('./MySocket');
const MySession = require("./MySession");
const MyUtil = require('../MyUtil');
const { LOG, WARN, ERROR } = MyUtil;

//==========MyHttpRequest==========
class MyHttpRequest extends Http.IncomingMessage {
    constructor() {
        Assert(false, "please use decorate!");
    }
    /**原始的url，未解码 */
    uri = '';
    /**仅保留路径部分的url*/
    url = '';
    /**提取url里面的未解码的query*/
    query = '';

    static _decorate() {
        Assert(!(this instanceof MyHttpRequest), "can not new or re decorate!");
        Assert((this instanceof Http.IncomingMessage), "'this' is not instanceof http.IncomingMessage!");

        Object.setPrototypeOf(this, MyHttpRequest.prototype);
        const pq = MyHttpRequest.parseReqPath(this.url);
        this.uri = this.url;
        this.url = pq.path;
        this.query = pq.query;

        if (MyUtil.getEnableLog()) {
            const h = [];
            for (let i = 0; i < this.rawHeaders.length; i += 2) {
                h.push(this.rawHeaders[i]);
                h.push(": ");
                h.push(this.rawHeaders[i + 1]);
                h.push("\r\n");
            }
            LOG(this.toString(), `${this.method} ${this.uri} HTTP/${this.httpVersion}\r\n${h.join('')}`);
        }
        WARN(this.toString(), this.method, this.url, this.query);
    }

    get querys() {
        return this._querys || (this._querys = new URLSearchParams(this.query));
    }


    get Session() {
        return this._session;
    }

    /**
     * @param {MySession} session
     */
    set Session(session) {
        this._session = session;
    }

    toString() {
        return this.socket.toString();
    }

    _onClientError() {
        // this.destroy(new Error('Client Error'));
    }

    /**
     * @param {(datas : Buffer[])=>{}} cb 
     */
    onceReqBodyRecvComplete(cb) {
        const datas = [];
        this.on('data', chunk => datas.push(chunk));
        this.on('end', () => cb(datas));
    }

    /**
     * @param {Http.IncomingMessage} req
     */
    static decorate(req) {
        MyHttpRequest._decorate.call(req);
    }

    /**
     * @param {string} url 从req获取的url
     * @returns 返回{path已转码, query未解码}
     */
    static parseReqPath(url) {
        let i = url.indexOf("?");
        let path, query;
        if (i === -1) {
            path = decodeURIComponent(url);
            query = "";
        } else {
            path = decodeURIComponent(url.substr(0, i));
            query = url.substr(i + 1);
        }
        return { path, query };
    }
}
module.exports = MyHttpRequest;