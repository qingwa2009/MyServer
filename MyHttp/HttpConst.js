'use strict';
exports.HEAD = {
    "101Switching-Protocols": "HTTP/1.1 101 Switching Protocols\r\n",
    "UpgradeWebSocket": "Upgrade: websocket\r\n",
    "ConnectionUpgrade": "Connection: Upgrade\r\n",
}


exports.HEADER = {
    "Content-Type": "content-type",
    "Content-Length": "content-length",
    "Location": "location",
    "Host": "host",
    "Origin": "origin",
    "Cache-Control": "cache-Control",
    "no-cache": "no-cache",
    "Last-Modified": "last-modified",
    "If-modified-since": "if-modified-since",
    "Range":"range",//请求的文件字节范围
    "Accept-Ranges":"accept-ranges",//值bytes或者none
    "Content-Range": "content-range",//响应这个206 partial content时需要带上
    "If-Range":"if-range",//满足If-Range时 Range才有效
    "Set-Cookie": "set-cookie",
    "Cookie": "cookie",
    "Referer": "referer",
    "Upgrade": "upgrade",
    "Connection": "connection",
    "Sec-WebSocket-Key": "sec-websocket-key",
    "Sec-WebSocket-Accept": "sec-websocket-accept",
    "Sec-WebSocket-Protocol": "sec-websocket-protocol",
    "Sec-WebSocket-Version": "sec-webSocket-version",
    "Server-Time": "server-time",
    /**跨域资源预请求时，请求头包含的headers */
    "Access-Control-Request-Headers": "access-control-request-headers",
    /**跨域资源预请求时，请求的方法 */
    "Access-Control-Request-Method": "access-control-request-method",
    /**跨域资源预请求时，可以接受来自哪个域的请求 */
    "Access-Control-Allow-Origin": "Access-Control-Allow-Origin",
    /**跨域资源预请求时，可以接受的请求方法*/
    "Access-Control-Allow-Methods": "Access-Control-Allow-Methods",
    /**跨域资源预请求时，可以接受来包含的headers */
    "Access-Control-Allow-Headers": "Access-Control-Allow-Headers",
    /**跨域资源预请求时，是否允许带上本域的cookie之类的 */
    "Access-Control-Allow-Credentials": "access-control-allow-credentials",
    /**跨域资源预请求时，有效期 */
    "Access-Control-Max-Age": "access-control-max-age",
};

exports.CONTENT_TYPE = {
    "UTF8": "text/plain;charset=utf-8",
    "GBK": "text/plain;charset=GBK",

}

exports.METHOD = {
    "Get": "GET",
    "Post": "POST",
    "Options": "OPTIONS",
}

exports.DOC_CONT_TYPE = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    ".webmanifest": "application/manifest+json",
};