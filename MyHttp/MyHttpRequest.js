'use strict';
const Http = require('http');
const Assert = require('assert');
const QueryString = require('querystring');
const MySocket = require('./MySocket');
const { LOG, WARN, ERROR, ENABLE_LOG } = require('../MyUtil');

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

        if (ENABLE_LOG) {
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
    /**
     * @returns {QueryString.ParsedUrlQuery} { [key: string]: string | string[]; }
     */
    get querys() {
        return this._querys || (this._querys = QueryString.parse(this.query));
    }

    toString() {
        return this.socket.toString();
    }

    _onClientError() {
        // this.destroy(new Error('Client Error'));
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