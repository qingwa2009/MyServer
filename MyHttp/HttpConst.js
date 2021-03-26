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
};

exports.CONTENT_TYPE = {
    "UTF8": "text/plain;charset=utf-8",

}

exports.METHOD = {
    "Get": "GET",
    "Post": "POST",
}

exports.DOC_CONT_TYPE = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
};