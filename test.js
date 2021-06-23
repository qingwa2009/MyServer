'use strict';
const fs = require("fs");
const Path = require("path");
const Http = require('http');
const Events = require('events');
const Url = require("url");
const { promisify } = require("util");
const { MyHttpRequest, MySocket } = require('./MyHttp');
const MyUtil = require("./MyUtil");
const { MyFileManager } = MyUtil;
const Database = require('better-sqlite3');
const querystring = require('querystring');

MyUtil.LOG("-----------------test-----------------");

// testPath();
function testPath() {
    let p = Path.win32.join("c:/", "/abc/");
    console.log(p);
    p = Path.win32.join("c:/def", "../abc");
    console.log(p);
}

// testGetFileState();
function testGetFileState() {
    let p = "./test0.js";
    fs.stat(p, (err, stat) => {
        console.log(err);
        console.log(stat);
    })

}

// testQueryString();
function testQueryString() {
    let url = "/%E5%AF%BC%E5%87%BAx_t?A=123&a=456&b=5&c=/%E5%AF%BC%E5%87%BA&d="

    let ret = querystring.parse(url);
    console.log(ret);

    let p = MyHttpRequest.parseReqPath(url);
    console.log(p);

    ret = querystring.parse(p.query);
    console.log(ret);

    console.log(Object.keys(ret));

}

// testBuffer();
function testBuffer() {
    //Buffer是Uint8Array的子类
    //填充全1的Uint8Array数组
    let buf = Buffer.alloc(3, 1);
    console.log(buf);//<Buffer 01 01 01>

    buf = Buffer.allocUnsafe(3);
    console.log(buf);

    buf = Buffer.from([1, 2, 3, 256, 257, -1]);
    console.log(buf);//<Buffer 01 02 03 00 01 ff>

    buf = Buffer.from("abc啦啦", "utf8");
    console.log(buf);//<Buffer 61 62 63 e5 95 a6 e5 95 a6>

    buf = Buffer.from("12af0g12", "hex");
    console.log(buf);//<Buffer 12 af> 以2位提取16进制

    buf = Buffer.from([1, 2, 3, 4]);
    let u32 = new Uint32Array(buf);//复制
    buf[0] = 2;
    console.log(buf, u32);//<Buffer 02 02 03 04> Uint32Array [ 1, 2, 3, 4 ]

    u32 = new Uint32Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint32Array.BYTES_PER_ELEMENT);
    let u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);//指向同一内存空间
    buf[0] = 3;
    console.log(buf, u8, u32);//<Buffer 03 02 03 04> Uint8Array [ 3, 2, 3, 4 ] Uint32Array [ 67305987 ]

    let arr = new Uint16Array(2);
    arr[0] = 5000;
    arr[1] = 4000;
    buf = Buffer.from(arr);//复制，按元素复制，而不是复制整个偏内存空间
    let buf2 = Buffer.from(arr.buffer);//指向同一内存空间    
    console.log(arr, buf, buf2);//Uint16Array [ 5000, 4000 ] <Buffer 88 a0> <Buffer 88 13 a0 0f>
    arr[0] = 4000;
    console.log(arr, buf, buf2);//Uint16Array [ 4000, 4000 ] <Buffer 88 a0> <Buffer a0 0f a0 0f>

    for (const b of buf) {
        console.log(b);
    }

    arr = new ArrayBuffer(16);
    buf = Buffer.from(arr);
    console.log(buf.buffer === arr);//true
}

// testModule();
function testModule() {
    // let m0 = require("./ModuleTest");
    // let m1 = require("./ModuleTest");
    // console.log(m0.A, m1.A);//1, 1
    // m0.A = 10;
    // console.log(m0.A, m1.A);//10, 10

    // let { EventEmitter, once } = require("events");
    // console.log(EventEmitter, once);

    // class MyEvent extends EventEmitter { }

    // let e = new MyEvent();
    // e.on("event", (...args) => {
    //     console.log(args);
    //     // throw new Error("lala");
    // });
    // e.on("error", (...args) => {
    //     console.log("handle Error: ");
    //     console.error(...args);
    // });
    // e.emit("event", '1', '2');
    const m = require('./ModuleTest');
    m.on('ready', () => { console.log('ready lala') });

}


// testFS();
function testFS() {
    const wf = fs.createWriteStream('test/Write.txt');

    wf.addListener("open", (fd) => {
        console.log(`wf open ${fd}`);
    })
    wf.addListener("close", () => {
        console.log(`wf closed ${wf.path}`);
    })
    wf.addListener("drain", (...args) => {
        console.log(`wf drain ${args}`);
    });
    wf.addListener('error', (...args) => {
        console.log(`wf error ${args}`);
    });
    wf.addListener('finish', (...args) => {
        console.log(`wf finish ${args}`);
    });
    wf.addListener('pipe', (...args) => {
        console.log(`wf pipe ${args}`);
    });
    wf.addListener('unpipe', (...args) => {
        console.log(`wf unpipe ${args}`);
    });



    wf.writableHighWaterMark = 1;
    const buf = Buffer.alloc(65536, 64);
    function write(stream, buf, cb) {
        if (!stream.write(buf)) {
            stream.once("drain", cb);
        } else {
            // process.nextTick(cb);
        }
    }
    let i = 0;
    function callback(...args) {
        console.log(args);
        i++;
        if (i < 10) {
            write(wf, buf, callback);
        } else {
            wf.end();
        }
    }
    write(wf, buf, callback);

    wf.once('finish', () => {
        //默认手动流
        const rf = fs.createReadStream('test/Write.txt');
        const wf1 = fs.createWriteStream('test/PipeWrite.txt');
        wf1.addListener('drain', () => console.log("wf1 drain!"));
        wf1.addListener('finish', () => console.log('wf1 finish!'));
        wf1.addListener('close', () => console.log("wf1 closed!"));
        //变自动流
        rf.pipe(wf1);
        rf.addListener('open', fd => {
            console.log(`rf open ${fd}`);
        })
        // 添加了这个事件会变成可手动流
        // rf.addListener('readable', (...args) => {
        //     console.log(`rf readable ${args}`);
        // })

        //变自动流，不要混用pipe、ondata 、onreadable
        rf.addListener('data', (...args) => {
            //这里的数据不一定与pipe同步
            const buf = args[0];
            for (let index = 0; index < buf.length; index++) {
                buf[index] += 1;
            }
            // console.log(`rf data ${args}`);
        });
        rf.addListener('close', () => {
            console.log(`rf closed ${rf.path}`);
        });
        //数据完全消费掉后触发
        rf.addListener('end', (...args) => {
            wf1.end();
            console.log(`rf end ${args}`);
        })
        rf.addListener('error', (...args) => {
            console.log(`rf error ${args}`);
        });
        rf.addListener('pause', () => {
            console.log(`rf pause`);
        });
        rf.addListener('resume', () => {
            console.log(`rf resume`);
        });

    })
    // rf.pipe(wf);

    process.nextTick(() => {
        // wf.end();
        // rf.close();
    });
}

// testFD();
function testFD() {
    let ws0 = fs.createWriteStream("test/00.txt");
    for (let i = 0; i < 655360; i++) {
        ws0.write(`${i}\r\n`);
    }
    ws0.end("655360");

    ws0.addListener('close', () => {
        let rs, rs2;
        let ws, ws2;
        ws = fs.createWriteStream('test/01.txt');
        ws2 = fs.createWriteStream('test/02.txt');
        fs.open('test/00.txt', fs.constants.O_RDONLY, (err, fd) => {
            if (err) throw err;
            const rs = fs.createReadStream('', { fd, start: 0, autoClose: false });
            rs.addListener("end", () => console.log("rs end"));
            rs.pipe(ws);
            const rs2 = fs.createReadStream('', { fd, start: 0, autoClose: false });
            rs2.addListener("end", () => console.log("rs2 end"));
            rs2.pipe(ws2);
        });

        // fs.close();
        ws.addListener("close", () => {
            fs.readFile('test/01.txt', { encoding: 'utf8' }, (err, data) => {
                const ds = data.split('\r\n');
                for (let i = 0; i < ds.length; i++) {
                    if (ds[i] != i) console.log(i);
                    console.assert(ds[i] == i);
                }
                fs.unlink('test/01.txt', err => {
                    console.log(err);
                });
            });
        });
        ws2.addListener("close", () => {
            fs.readFile('test/02.txt', { encoding: 'utf8' }, (err, data) => {
                const ds = data.split('\r\n');
                for (let i = 0; i < ds.length; i++) {
                    if (ds[i] != i) console.log(i);
                    console.assert(ds[i] == i);
                }
                fs.unlink('test/02.txt', err => {
                    console.log(err);
                });

                fs.unlink('test/00.txt', err => console.log(err));
            });
        });


    });
}


// testMyFileManager();
async function testMyFileManager() {
    const fm = new MyFileManager();
    var ws = null;
    try {
        ws = await fm.create('test/?.txt');
        console.assert(false);
    } catch (err) {
        // console.log(error);
    }
    console.assert(fm._writingStreams.size === 0);

    ws = await fm.create('test/lala.txt');

    var ws2 = null;
    try {
        ws2 = await fm.create('test/lala.txt');
        console.assert(false);
    } catch (err) {
        // console.log(error);
    }
    console.assert(fm._writingStreams.size === 1);

    let fh = null;
    try {
        await fm.open('test/lala.txt');
        console.assert(false);
    } catch (err) {
        // console.log(error);
    }
    console.assert(fm._readingfds.size === 0);

    ws.write("abc");
    ws.write("def");



    fh = fs.openSync('test/lala.txt', fs.constants.O_RDWR | fs.constants.O_CREAT)
    fs.writeSync(fh, 'lala');

    ws.end("123");

    await MyUtil.MyPromise(ws.on.bind(ws), 'close');
    console.assert(ws.writable === false);

    console.assert(fm._writingStreams.size === 0);

    fs.closeSync(fh);
    fs.unlinkSync('test/lala.txt');

    try {
        fh = await fm.open('test/?.txt');
        fh.pipe(ws);
        console.assert(false);
    } catch (error) {
        // console.log(error);
    }

    try {
        fh = await fm.open('test/js');
        fh.pipe(ws);
        console.assert(false);
    } catch (error) {
        // console.log(error);
    }

    ws = await fm.create('test/lala.txt');
    let ws1 = await fm.create('test/kaka.txt');

    try {
        await Promise.all([(await fm.open('test.js')).pipe(ws), (await fm.open('test.js')).pipe(ws1)]);
    } catch (error) {
        console.assert(false, error);
    }

    // try {
    //     await MyUtil.MyPromise(ws.onceWriteFinish.bind(ws));
    //     await MyUtil.MyPromise(ws1.onceWriteFinish.bind(ws1));
    // } catch (error) {
    //     console.assert(false, error);
    // }


    let st0 = await MyUtil.MyPromise(fs.stat, 'test.js');
    let st1 = await MyUtil.MyPromise(fs.stat, 'test/lala.txt');
    let st2 = await MyUtil.MyPromise(fs.stat, 'test/kaka.txt');

    console.assert(st0.size === st1.size && st0.size === st2.size);

    process.nextTick(() => {
        fs.unlinkSync('test/lala.txt');
        fs.unlinkSync('test/kaka.txt');
        console.log("testMyFileManager finished");
    });
};

// testPromise();
async function testPromise() {
    const map = new Map();
    const mapping = new Map();
    function f(key) {
        if (!map.has(key)) {
            const p = new Promise((res, rej) => {
                setTimeout(() => {
                    const v = Math.random();
                    map.set(key, v);
                    res(v);
                }, 10);
            });
            map.set(key, p);
        }
        return map.get(key);;
    }

    for (let i = 0; i < 10; i++) {
        f('lala').then(v => console.log(v));
        // console.log(await f('lala'));
    }

    let ress = null;
    let rejs = null;
    let p = new Promise((res, rej) => {
        ress = res;
        rejs = rej;
    });

    p.then(() => console.log('then 1'), err => console.log('err 1')).then(() => console.log('then 11')).finally(() => console.log('finally 1'));
    p.then(() => console.log('then 2'), err => console.log('err 2')).then(() => console.log('then 22')).finally(() => console.log('finally 2'));
    setTimeout(() => {
        ress();
    }, 10);


}

// testMyFileManagerOpenFile();
function testMyFileManagerOpenFile() {
    const fm = new MyUtil.MyFileManager();
    const ps = [];
    for (let i = 0; i < 10; i++) {
        ps.push(fm.open('test.js').then(fh => console.log(fh)));
        fm.closeFileReading('test.js').then(() => console.log(i));
    }

    for (let i = 0; i < 10; i++) {
        // fm.closeFileReading('test.js');
    }
}


// testMyFileManagerCreateFile();
async function testMyFileManagerCreateFile() {
    const fm = new MyUtil.MyFileManager();
    const fh = await fm.open('test/PipeWrite.txt');
    for (let i = 0; i < 8199; i++) {
        fm.create(`test/${i}.txt`).then(ws => {
            ws.onceWriteFinish((err, path) => {
                if (err) return;
                fs.unlink(path, err => {
                    console.log('delete', path, err);
                });
            });
            fh.pipe(ws).then(
                () => {
                    ws.end();
                },
                error => {
                    ws.end();
                    console.log("pipe failed", error);
                }
            );
        }).catch(
            err =>
                console.assert("create failed", err)
        );
    }

    setInterval(() => {
        // console.log(process.memoryUsage());
        console.log(`open:${fm._createdWCount}, writting:${fm._writingStreams.size}, error:${fm._errorWCount}, closed:${fm._closeWCount}`);
    }, 1000);

}

// testVM();
function testVM() {
    const VM = require('vm');
    const a = "lala";
    global.globalA = "kaka";
    VM.runInThisContext(
        `
        try{
            console.log(a);        
        }catch(err){
            console.log(err);
        }        
        console.log(globalA);
    `, );
}

// testV8();
function testV8() {

}

// testEvent();
function testEvent() {
    // class MyEvent extends Events.EventEmitter { }
    // var e = new MyEvent();
    // process.nextTick(() => {
    //     e.emit('lala');
    // })

    // e.once('lala', () => { console.log('lala', this) });
    class MyEvent extends Events.EventEmitter { }
    var e = new MyEvent();
    e.on('e', v => console.log(v));
    e.emit('e', 1);
    e.emit('e', 2);

    class MyEvent2 extends Events.EventEmitter {

        _isEmitted = false;
        _i = 0;
        constructor() {
            super();
        }
        notify() {
            if (this._isEmitted) return;
            this._isEmitted = true;
            process.nextTick(() => {
                this.emit('e', 1);
                this._isEmitted = false;
            });
        }
        onChange(cb) {
            this.on('e', cb);
        }
    }
    var e2 = new MyEvent2();
    e2.onChange(v => console.log(v));
    e2.notify();
    e2.notify();
    e2.notify();
    e2.notify();

}

// testUpload();
function testUpload() {
    const reqs = [];
    for (let i = 0; i < 20; i++) {
        const j = Math.round(Math.random() * 10);
        const req = Http.request('http://localhost:80', {
            method: 'post',
            path: '/upload',
            headers: {
                'Content-Length': j,
                'file-name': encodeURI(`我${j}.txt`),
                'Type-Encoding': 'chunk',
            },
        }, resp => {
            console.log(`${resp.statusCode} ${resp.statusMessage}`);
            console.log(`${JSON.stringify(resp.headers)}`);
            resp.setEncoding('utf8');
            resp.on('data', s => console.log(s));
            resp.on('error', err => console.log('response error: ', err));
            resp.on('end', () => console.log('resp end'));
        });
        req.on('error', err => console.log('request error: ', err))
        req.write('123GET /', err => {
            // req.destroy();
        });
        req.end(() => {
            console.log('req end');
        });
        setTimeout(() => {
            // req.destroy();
        }, j * 20);
        reqs.push(req);
    }
}

// testMyFileManagerGetFilesStats();
function testMyFileManagerGetFilesStats() {
    var fm = new MyFileManager();
    fs.readdir('./', (err, files) => {
        if (err) return;
        const its = fm.getFilesStats("./", files);
        for (const p of its) {
            p.then(stat => console.log(stat), err => console.log(err));
        }
    });

}
// testMyFileManagerGetFileList();
function testMyFileManagerGetFileList() {
    var fm = new MyFileManager();
    fm.getFileList('./').then(
        stats => console.log(stats),
        err => console.log(err)
    )
}
// testMyUtilExtractUrlFolderPart();
function testMyUtilExtractUrlFolderPart() {
    console.assert(MyUtil.extractUrlFolderPart('/abc') === '/abc');
    console.assert(MyUtil.extractUrlFolderPart('/abc/def') === '/abc/def');
    console.assert(MyUtil.extractUrlFolderPart('/abc/def/') === '/abc/def');
    console.assert(MyUtil.extractUrlFolderPart('/abc.txt') === '/');
    console.assert(MyUtil.extractUrlFolderPart('/abc/def/gh.txt') === '/abc/def');
}

// testIterator();
function testIterator() {
    function Pro() {
        return new Promise((res, rej) => {
            setTimeout(() => {
                res(gen());
            }, 10);
        });
    }

    function* gen() {
        for (let i = 0; i < 10; i++) {
            yield new Promise((res, rej) => {
                setTimeout(() => {
                    res(i);
                }, 500);
            });
        }
    }

    var p = Pro();
    const vs = [];
    p.then(g => {
        let ress = null;
        const pp = new Promise((res, rej) => {
            ress = res;
        })

        function r(it) {
            it.value.then(v => {
                vs.push(v);
                console.log(v);
            }).finally(() => {
                it = g.next();
                if (it.done) ress(vs);
                else r(it);
            });
        }
        let it = g.next();
        if (it.done) ress(vs);
        else r(it);
        return pp;
        // for (const it of g) {
        //     it.then(v => console.log(v));
        // }
    }).then(vv => {
        console.log(vv);
    })

    // for (var i = 0; i < 10; i++) {
    //     setTimeout(() => {
    //         console.log(i)//10,10,10,10,10...
    //     }, 1);
    // }
}


// testOpendir();
function testOpendir() {
    fs.readdir('C:/Users/linjunbin/Desktop/', (err, files) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(files);
    });
}

// testUploadDownload();
function testUploadDownload() {
    const reqs = [];
    for (let i = 0; i < 1000; i++) {
        const j = Math.round(Math.random() * 10);
        const req = Http.request('http://localhost:80', {
            method: 'get',
            path: '/uploaddownload?file=01.txt',
            headers: {
                'Content-Length': j,
            },
        }, resp => {
            console.log(`${resp.statusCode} ${resp.statusMessage}`);
            console.log(`${JSON.stringify(resp.headers)}`);
            resp.setEncoding('utf8');
            resp.on('data', s => console.log(s));
            resp.on('error', err => console.log('response error: ', err));
            resp.on('end', () => console.log('resp end'));
        });
        req.on('error', err => console.log('request error: ', err))
        req.end(() => {
            console.log('req end');
        });
        setTimeout(() => {
            // req.destroy();
        }, j * 20);
        reqs.push(req);
    }
}

// testStringDecoder();
function testStringDecoder() {
    const { StringDecoder } = require('string_decoder');
    const dec = new StringDecoder('utf8');
    console.log(dec.write(Buffer.from([255, 255, 220, 120, 97, 98, 99])));
    console.log(dec.end());
    console.log(dec.write(Buffer.from([255, 255, 220, 120, 97, 98, 99])));
    console.log(dec.end());

}

// testJSON();
function testJSON() {
    try {
        const s = JSON.parse("{");
        console.log(s);
    } catch (error) {

    }

    const querys = querystring.parse('a=1&a=2');
    console.log(typeof querys['b']);
    console.log(Array.isArray(querys['a']));

    const datas = [];
    datas.push(Buffer.from('["abc'));
    datas.push(Buffer.from('def"]'));

    console.log(JSON.parse(datas));

    console.log(datas.join(''));

    console.log(JSON.parse(['{', '"a":', '1,', '"b":2}'].join("")));

}

// testIterator2();
function testIterator2() {
    function* it() {
        for (let i = 0; i < 10; i++) {
            yield i;
        }
    }

    for (const i of it()) {
        for (const j of it()) {
            console.log(i, j)
        }
    }
}

// testBufferAsKey()
function testBufferAsKey() {
    const buf = new Uint8Array([223, 224, 225]);
    const buf2 = new Uint8Array([223, 224, 225]);
    console.log(buf, buf2);
    console.log(buf == buf2);
    const dic = {}
    dic[buf] = 1;
    console.log(dic[buf2]);
    console.log(dic);
}

// testHttps();
function testHttps() {
    var https = require('https');
    const k = fs.readFileSync("./SSL/server.key");
    const c = fs.readFileSync("./SSL/server.pem");
    const server = https.createServer({ key: k, cert: c });
    const Net = require('net');
    const TLS = require('tls');
    Object.setPrototypeOf(TLS.TLSSocket.prototype, MySocket.prototype);

    const sessions = {};

    server.listen(443);
    server.on("newSession", (sessionId, sessionData, cb) => {
        console.log("-------------newSession");
        console.log(sessionId, sessionData, cb);

        sessions[sessionId.toString("hex")] = sessionData;
        cb();
    })
    server.on("OCSPRequest", (cert, issuer, cb) => {
        console.log("-------------OCSPRequest");
        console.log(cert, issuer, cb);
        cb(null, null);
    })
    server.on("resumeSession", (sessionId, cb) => {
        console.log("-------------resumeSession");
        console.log(sessionId, cb);
        const session = sessions[sessionId.toString("hex")];
        if (session) {
            cb(null, session);
        } else {
            cb();
        }
    })
    server.on("secureConnection", (tlsSocket) => {
        console.log("-------------secureConnection");
        console.log(tlsSocket.authorized, tlsSocket.authorizationError, tlsSocket.servername);
        console.log(tlsSocket);
        console.log(tlsSocket instanceof TLS.TLSSocket);
        console.log(tlsSocket instanceof MySocket);
        console.log(tlsSocket instanceof Net.Socket);

    })
    // server.on("tlsClientError", (err, tlsSocket) => {
    //     console.log("-------------tlsClientError");
    //     console.log(err, tlsSocket);
    // })


    server.on("request", (req, resp) => {
        console.log(sessions);
        console.log("-------------request");
        console.log(req, resp);
        resp.end("abc");
    });


}

// testOS()
function testOS() {
    const os = require('os');
    console.log(`hostname: ${os.hostname()}`);
    console.log(os.networkInterfaces());
    console.log(MyUtil.getLocalIP4());
    // const s0 = Http.createServer(
    //     (req, resp) => {
    //         resp.statusCode = 200;
    //         resp.end("127.0.0.1");
    //     }
    // ).listen(80, "localhost");
    // const s1 = Http.createServer(
    //     (req, resp) => {
    //         resp.statusCode = 200;
    //         resp.end("192.168.6.25");
    //     }
    // ).listen(80, "192.168.6.25");

}

// testBat();
async function testBat() {
    const child_process = require('child_process');
    const out = fs.openSync("./test/out.log", 'w');
    const cp = child_process.fork(`serverRestarter.js`, [], { encoding: 'GBK', cwd: __dirname, detached: true, stdio: ['ignore', out, out, 'ipc'] });
    // console.log(cp);
    // const cp = child_process.spawn(`node ${__dirname}/serverRestarter.js`, [], { detached: true, stdio: 'inherit', shell: true });
    cp.unref();
    // cp.on("exit", (code, signal) => {
    process.exit(0);
    // })


}

// testBuffer2();
async function testBuffer2() {
    const buf = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 255]);
    const buf2 = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    const buf4 = Buffer.from(buf.buffer, buf.byteOffset - 6, buf.byteLength + 6 + 16);
    const buf3 = Buffer.from(buf, 5, 5);
    buf3.writeBigUInt64BE(BigInt(10));

    console.log(buf.buffer === buf3.buffer);
    console.log(buf, buf2, buf3, buf4);
    console.log(buf.byteOffset, buf2.byteOffset, buf3.byteOffset);

    const n = 4611686018427387904;//Number(BigInt(4611686018427387904));
    console.log(Number.MAX_SAFE_INTEGER);

    const bb = Buffer.allocUnsafe(3);
    buf.copy(bb, 0, 3);
    console.log(bb);


    const WEBSOCKET_HANDLER_LIST = require('./MyWebSocketHandlers');
    console.log(WEBSOCKET_HANDLER_LIST);
    const props = Object.getOwnPropertyNames(WEBSOCKET_HANDLER_LIST);
    console.log(props);
    console.log(typeof WEBSOCKET_HANDLER_LIST.get(props[0]));
    console.log(JSON.stringify(WEBSOCKET_HANDLER_LIST.status()));
}



// testBetterSqlite3();
async function testBetterSqlite3() {

    var db = new Database(":memory:", { verbose: console.log });
    db.pragma("foreign_keys=true");
    db.pragma("journal_mode=wal");
    db.exec("create table if not exists tb (a, b, c)");

    //prepare statement
    const insertIntoTb = db.prepare("insert into tb values (@a, @b, @c)");
    //transaction
    const transaction = db.transaction((values) => {
        for (const v of values) insertIntoTb.run(v);
    })
    const values = [
        { a: 1, b: 1, c: 1 },
        { a: 2, b: 2, c: 2 },
        { a: 3, b: 3, c: 3 },
    ]
    //begin immediate
    transaction.immediate(values);
    //嵌套transaction成为savepoint
    const t2 = db.transaction((values) => {
        insertIntoTb.run({ a: "-", b: "-", c: "-" });
        //savepoint xx
        transaction(values);
        //release xx
    })
    t2.immediate(values);

    try {
        transaction.immediate([
            { a: 1, b: 2, c: 3 },
            { a: 1, b: 2 },//错误时自动回滚
            { a: 1, b: 2, c: 3 },
        ]);
    } catch (error) {
        console.log(error.message);
    }

    //备份
    let pause = false;
    db.backup("./test/backup.db", {
        progress({ totalPages: t, remainingPages: r }) {
            console.log(`backup progress:${((t - r) / t * 100).toFixed(1)}%`);
            return pause ? 0 : 200;
        }
    }).then(() => {
        console.log("backup complete!");
    }).catch(err => {
        console.log("backup failed:", err.message);
    });

    //序列化到内存
    // const buffer = db.serialize();
    // db.close();
    //再以memory的方式创建新的数据库
    // db = new Database(buffer);

    //user defined function;
    //可以定义相同名字但参数个数不同的函数
    db.function("add2", (a, b) => a + b);
    //pluck开启仅返回第一行第一列的一个值
    console.log(db.prepare("select add2(?,?)").pluck().get("1", 2));
    try {
        db.prepare("select add2(?,?,?)").pluck().get(1, 2, 3);
    } catch (error) {
        console.log(error.message);
    }
    db.function("void", {
        deterministic: true,//确定性算法，不知啥意思，说某些条件下能提高性能
        safeIntegers: true,//?
        varargs: true//不定参数个数
    }, () => { })
    console.log(db.prepare("select void()").pluck().get());
    console.log(db.prepare("select void(?,?)").pluck().get(1, 2));

    //聚合函数
    db.aggregate('addAll', {
        start: 0,//起始值
        step: (total, nextValue) => total + nextValue,
    })
    console.log(
        db.prepare('select addAll(a) from tb').pluck().get()
    );

    //virtual table
    db.table("filesystem_directory", {
        columns: ["filename", "data"],
        rows: function* () {
            for (const filename of fs.readdirSync(process.cwd())) {
                try {
                    const data = fs.readFileSync(filename);
                    yield { filename, data };
                } catch (error) { }
            }
        }
    });
    console.log(db.prepare("select * from filesystem_directory").all());
    db.table("regex", {
        columns: ["match", "capture"],
        rows: function* (pattern, text) {
            const regex = new RegExp(pattern, "g");
            let match;
            while (match = regex.exec(text)) {
                yield [match[0], match[1]];
            }
        }
    });
    let stmt = db.prepare("select * from regex('\\$(\\d+)', ?)");
    console.log(stmt.all("Desks cost $500 and chairs cost $27"));
    db.table("sequence", {
        columns: ["value"],
        parameters: ["length", "start"],
        rows: function* (length, start = 0) {
            if (length === undefined)
                throw new TypeError("missing required parametter 'length'");
            const end = start + length;
            for (let n = start; n < end; ++n) {
                yield { value: n };
            }
        }
    });
    console.log(db.prepare("select * from sequence(10)").pluck().all());

    console.log(db.prepare("select * from tb").run());
    console.log(db.prepare("select * from tb").get());
    console.log(db.prepare("select * from tb").all());
    const it = db.prepare("select * from tb").iterate();
    for (const row of it) {
        console.log(row);
    }
    console.log(db.prepare("select * from tb").expand().all());
    console.log(db.prepare("select * from tb").raw().all());
    console.log(db.prepare("select * from tb").columns());
    stmt = db.prepare("select * from tb where a=@a and b=@b");
    stmt.bind({ a: 1, b: 1 });//永久绑定
    // stmt.bind({ a: 2, b: 2 });//报错
    // console.log(stmt.all({ a: 2, b: 2 }));//报错
    console.log(stmt.all());
    console.log(stmt.reader);

    stmt = db.prepare('INSERT INTO tb VALUES (@name, @name, ?)');
    console.log(stmt.run(45, { name: 'Henry' }));


    const MySqlite = require("./MySqlite/MySqlite");
    // console.log(MySqlite.getMyTableData(db.prepare("select c, b, a from tb where a=?"), 1));
    MySqlite.decorate(db);
    let mtd = db.getMyTableData("select c, b, a from tb where a=?", 1);
    console.log(mtd);

}

// testDbSetting();
function testDbSetting() {
    // MyUtil.setEnableLog(true);
    const DbSetting = require('./sample/DbSetting');
    const dbsetting = new DbSetting();
    const values = [
        { col: "a", width: 60 },
        { col: "b", width: 70 },
        { col: "c", width: 80 },
        { col: "d", width: 90 },
        { col: "e", width: 0 },
        { col: "f", width: 100 },
        { col: "g", width: 0 },
    ];
    try {
        dbsetting.saveUserSetting(null, '', values);
    } catch (error) {
        console.log("saveUserSetting error:", error);
    }
    dbsetting.saveUserSetting('guest', 'list0', values);
    dbsetting.saveUserSetting('guest', 'list1', values);

    console.log("deleteUserSetting", dbsetting.deleteUserSetting('guest'));
    console.log("deleteUserSetting", dbsetting.deleteUserSetting('guest', 'list1'));

    console.log(dbsetting.selectUserSettings('guest'));
    console.log(dbsetting.selectUserSettings('guest', 'list0'));
    console.log(dbsetting.selectUserSettings('guest', 'list1'));

}

// testDbSettingPool();
function testDbSettingPool() {
    MyUtil.setEnableLog(true);
    const DbSetting = require('./sample/DbSetting');
    const dbsetting = new DbSetting(true);
    const values = [
        { col: "a", width: 60 },
        { col: "b", width: 70 },
        { col: "c", width: 80 },
        { col: "d", width: 90 },
        { col: "e", width: 0 },
        { col: "f", width: 100 },
        { col: "g", width: 0 },
    ];
    dbsetting.saveUserSetting(null, '', values).catch(error => {
        // console.error("saveUserSetting error:", error);
    });

    dbsetting.saveUserSetting('guest', 'list0', values).catch(error => {

    });
    dbsetting.saveUserSetting('guest', 'list1', values).catch(error => {

    });

    dbsetting.deleteUserSetting('guest').then(b => {
        console.log("deleteUserSetting", b);
    }).catch(error => {
        console.error("deleteUserSetting", error);
    });

    dbsetting.deleteUserSetting('guest', 'list1').then(b => {
        console.log("deleteUserSetting", b);
    }).catch(error => {
        console.error("deleteUserSetting", error);
    });

    dbsetting.selectUserSettings('guest').then(mtd => {
        console.log(mtd);
    });
    dbsetting.selectUserSettings('guest', 'list0').then(mtd => {
        console.log(mtd);
    });
    dbsetting.selectUserSettings('guest', 'list1').then(mtd => {
        console.log(mtd);
    });

}

// testBetterSqlite3Injection();
function testBetterSqlite3Injection() {
    const db = new Database(":memory:", { verbose: console.log });
    db.prepare("create table tb (a, b, c)").run();
    db.prepare("insert into tb values (1, 2, 3)");
    let ret = db.prepare("select * from tb where a=? and b=?").all("1'--+", "")
    console.log(ret);
}

// testResp();
async function testResp() {
    [
        '/upload',
        '/uploaddownload',
        '/exportxb/filelist',
        '/exportxb/upload',
        '/exportxb/delete',
        '/exportxb/download',
        // '/restart',
        // '/updatewebsite',
        // '/updateserver',
        '/usersetting',
        '/myplm/item/search',
    ].forEach(url => {

        const options = {
            host: "localhost",
            method: "get",
            path: url,
        };
        let req = null;
        /**get连接后立即关闭 */
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end(() => req.destroy());
        req.once("error", err => console.log(err.message));

        /**get不添加query*/
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end();
        req.once("error", err => console.log(err.message));

        /**get添加乱七八糟query*/
        options.path = url + "?asdf=asdf&asdfa&qwoei";
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end();
        req.once("error", err => console.log(err.message));

        /**get不添加query*/
        options.path = url;
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end("abc");
        req.once("error", err => console.log(err.message));

        /**get添加乱七八糟query*/
        options.path = url + "?asdf=asdf&asdfa&qwoei";
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end("abc");
        req.once("error", err => console.log(err.message));

        options.method = "post";
        /**post连接后立即关闭 */
        options.path = url;
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end(() => req.destroy());
        req.once("error", err => console.log(err.message));

        /**post不添加query*/
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end();
        req.once("error", err => console.log(err.message));

        /**post添加乱七八糟query*/
        options.path = url + "?asdf=asdf&asdfa&qwoei";
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end();
        req.once("error", err => console.log(err.message));

        /**post不添加query*/
        options.path = url;
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end("abc");
        req.once("error", err => console.log(err.message));

        /**post添加乱七八糟query*/
        options.path = url + "?asdf=asdf&asdfa&qwoei";
        req = Http.request(options, resp => {
            resp.once("error", err => console.log(err));
        });
        req.end("abc");
        req.once("error", err => console.log(err.message));

    })





}

// testOracle();
async function testOracle() {
    const oracledb = require("oracledb");
    const cnn = await oracledb.getConnection({
        connectString: "192.168.0.84:1521/plm.shianco.com.cn",
        password: "********",
        user: '********',
    });
    const MySqlite = require("./MySqlite/MySqlite.js")
    const db = new MySqlite('./test/myplm.db');


    // cnn.execute("select * from T_PDM_ITEM").then(res => {
    // const cols = [];
    // for (const col of res.metaData) {
    //     cols.push(col.name);
    // };
    // db.prepare(`create table if not exists T_PDM_ITEM (${cols.join(',')})`).run();

    // db.transaction((rs) => {
    //     db.prepare("delete from T_PDM_ITEM");
    //     const stmt = db.prepare(`insert into T_PDM_ITEM values (${new Array(res.metaData.length).fill("?").join(",")})`);
    //     for (const r of rs) {
    //         for (let i = 0; i < r.length; i++) {
    //             if (r[i] instanceof Date) r[i] = r[i].getTime();
    //         }
    //         stmt.run(r);
    //     }
    // }).immediate(res.rows)

    // console.log(res.rows);
    // });


    // cnn.execute("select * from T_PUB_CODE").then(res => {
    //     const cols = [];
    //     for (const col of res.metaData) {
    //         cols.push(col.name);
    //     };
    //     db.prepare(`create table if not exists T_PUB_CODE (${cols.join(',')})`).run();

    //     db.transaction((rs) => {
    //         db.prepare("delete from T_PUB_CODE");
    //         const stmt = db.prepare(`insert into T_PUB_CODE values (${new Array(res.metaData.length).fill("?").join(",")})`);
    //         for (const r of rs) {
    //             for (let i = 0; i < r.length; i++) {
    //                 if (r[i] instanceof Date) r[i] = r[i].getTime();
    //             }
    //             stmt.run(r);
    //         }
    //     }).immediate(res.rows)

    //     // console.log(res);
    // });

    // cnn.execute("select * from T_PDM_ITEMTYPE").then(res => {
    //     const cols = [];
    //     for (const col of res.metaData) {
    //         cols.push(col.name);
    //     };
    //     db.prepare(`create table if not exists T_PDM_ITEMTYPE (${cols.join(',')})`).run();

    //     db.transaction((rs) => {
    //         db.prepare("delete from T_PDM_ITEMTYPE");
    //         const stmt = db.prepare(`insert into T_PDM_ITEMTYPE values (${new Array(res.metaData.length).fill("?").join(",")})`);
    //         for (const r of rs) {
    //             for (let i = 0; i < r.length; i++) {
    //                 if (r[i] instanceof Date) r[i] = r[i].getTime();
    //             }
    //             stmt.run(r);
    //         }
    //     }).immediate(res.rows)

    //     // console.log(res);
    // });


    // cnn.execute("select * from T_PDM_ITEM_FORMULA").then(res => {
    //     const cols = [];
    //     for (const col of res.metaData) {
    //         cols.push(col.name);
    //     };
    //     db.prepare(`create table if not exists T_PDM_ITEM_FORMULA (${cols.join(',')})`).run();

    //     db.transaction((rs) => {
    //         db.prepare("delete from T_PDM_ITEM_FORMULA");
    //         const stmt = db.prepare(`insert into T_PDM_ITEM_FORMULA values (${new Array(res.metaData.length).fill("?").join(",")})`);
    //         for (const r of rs) {
    //             for (let i = 0; i < r.length; i++) {
    //                 if (r[i] instanceof Date) r[i] = r[i].getTime();
    //             }
    //             stmt.run(r);
    //         }
    //     }).immediate(res.rows)

    //     // console.log(res);
    // });


    // cnn.execute("select * from T_SYS_USER").then(res => {
    //     const cols = [];
    //     for (const col of res.metaData) {
    //         cols.push(col.name);
    //     };
    //     db.prepare(`create table if not exists T_SYS_USER (${cols.join(',')})`).run();

    //     db.transaction((rs) => {
    //         db.prepare("delete from T_SYS_USER");
    //         const stmt = db.prepare(`insert into T_SYS_USER values (${new Array(res.metaData.length).fill("?").join(",")})`);
    //         for (const r of rs) {
    //             for (let i = 0; i < r.length; i++) {
    //                 if (r[i] instanceof Date) r[i] = r[i].getTime();
    //             }
    //             stmt.run(r);
    //         }
    //     }).immediate(res.rows)

    //     // console.log(res);
    // });

    // cnn.execute(`SELECT * FROM T_PDM_ITEM_DOC`).then(res => {
    //     const cols = [];
    //     for (const col of res.metaData) {
    //         cols.push(col.name);
    //     };
    //     db.prepare(`create table if not exists T_PDM_ITEM_DOC (${cols.join(',')})`).run();

    //     db.transaction((rs) => {
    //         const stmt = db.prepare(`insert into T_PDM_ITEM_DOC values (${new Array(res.metaData.length).fill("?").join(",")})`);
    //         for (const r of rs) {
    //             for (let i = 0; i < r.length; i++) {
    //                 if (r[i] instanceof Date) r[i] = Math.round(r[i].getTime() / 1000);
    //             }
    //             stmt.run(r);
    //         }
    //     }).immediate(res.rows)

    // }).catch(error => {
    //     console.error(error);
    // })
}

// testMyDbCriteria();
function testMyDbCriteria() {
    const MyDbCriteria = require("./MySqlite/MyDbCriteria");
    let c = new MyDbCriteria();
    c.addWhere("field1", "=", "abc");
    c.addWhere("", "=", undefined);
    c.addWhere("t.field2", "like", "%d");
    c.addWhere("field3", "in", { func: "", param: ["a", "b", "c"] });
    c.addWhere("t.field4", "<>", false);
    c.addWhere("field5", "<>", 1);

    c.addOrderBy("field6", "asc");
    c.addOrderBy("t.field7", "desc");
    console.log(c.toCriteria());

    console.log(new MyDbCriteria().toCriteria());

    c = new MyDbCriteria();
    c.addWhere("abc", "=", "ac");
    console.log(c.toCriteria());
}


// testDbMyPLM();
function testDbMyPLM() {
    const DbMyPLM = require('./sample/DbMyPLM.js');
    const dbmyplm = new DbMyPLM();
    // const st = new Date().getTime();
    // for (let i = 0; i < 5; i++) {
    //     let mtd = dbmyplm.searchItems("where t.RD_NO like 'AT%'", "order by 研发编号 DESC", [], i * 1, 10);
    //     console.log(mtd.count, mtd.totalCount, mtd.data[0]);
    // }
    // console.log(`耗时:${new Date().getTime() - st}`);

    let mtd = dbmyplm.selectItemDoc("1111001013");
    console.log(mtd);

    dbmyplm.close();
}

// testMyPLMPool()
function testMyPLMPool() {
    const DbMyPLM = require("./sample/DbMyPLM");
    const pool = new DbMyPLM(true);
    const ps = [];
    const st = new Date().getTime();
    for (let i = 0; i < 5; i++) {
        ps.push(pool.searchItems("where rd_no like 'AT%'").then(mtd => {
            console.log(mtd.totalCount);
        }, err => {
            console.error(err);
        }))
    }

    Promise.all(ps).then(() => {
        console.log("耗时", new Date().getTime() - st);
        console.log("pool closing");
        pool.close().then(() => {
            console.log("pool closed!");
            setTimeout(() => {
                console.log(pool.pool.status());
            }, 10);
        });
    })
}

// testMessagePort();
function testMessagePort() {
    const { MessagePort, MessageChannel } = require("worker_threads");
    let mc = new MessageChannel();
    mc.port1.on("message", msg => console.log("port1:", msg));
    mc.port1.on("close", () => console.log("port1 closed"));
    mc.port2.on("message", msg => {
        if (msg instanceof Uint8Array) {
            msg[0] = 111;
        }
        console.log("port2:", msg);
    });
    mc.port2.on("close", () => console.log("port2 closed"));


    const buf = Buffer.from("abc");
    const buf2 = Buffer.from("123");
    console.log("buf.buffer === buf2.buffer:", buf.buffer === buf2.buffer);

    mc.port1.postMessage("1 hi i am port1!");
    mc.port2.postMessage("2 hi i am port2 , lala");
    // mc.port1.postMessage(buf);//传递一个副本
    mc.port1.postMessage(buf, [buf.buffer]);//buf被移过去后就不能用了

    const sbuf = new Uint8Array(new SharedArrayBuffer(4));
    // mc.port1.postMessage(sbuf, [sbuf.buffer]);SharedArrayBuffer移不了
    mc.port1.postMessage(sbuf);
    sbuf[0] = 125;

    setTimeout(() => {
        console.log(buf, buf.byteOffset, buf.length);//buf被移过去后就不能用了
        console.log(buf2, buf2.byteOffset, buf2.length);//buf2也不能用了
        console.log(sbuf);
        mc.port1.close();
    }, 100);
}

// testWorker();
function testWorker() {
    const { isMainThread, parentPort, Worker } = require("worker_threads");
    if (isMainThread) {
        let buf = Buffer.from("abc");
        console.log(buf.byteOffset, buf.byteLength);
        let w = new Worker(__filename);
        w.postMessage("lala");
        w.on("error", err => console.error("error:", err));
        w.on("exit", exitCode => console.log("eixtcode:", exitCode));

        setTimeout(() => {
            // w.terminate().then(exitCode => {
            //     console.log(exitCode);
            // })
            w.unref();
        }, 100);
    } else {
        parentPort.on("message", msg => {
            console.log("worker: ", msg);
        })
        parentPort.on("close", (...args) => {
            console.log("worker: close ", args);
        })
        // process.exit(0);
        // throw new Error("i am error");
    }

}

// testURL();
function testURL() {
    const url = new URL("http://127.0.0.1/?我=啊啊&我=卡卡");
    console.log(url.searchParams.get("a"));
    console.log(url.searchParams.getAll("a"));
    console.log(url.searchParams.get("我"));
    console.log(url.searchParams.getAll("我"));
}

// testUDPReqDNS()
function testUDPReqDNS() {
    const dgram = require("dgram");

    function getReqDNSBuf(/**@type{string} */hostname) {
        const ss = hostname.split(".");
        const n = hostname.length;
        const buf = Buffer.allocUnsafe(hostname.length + 2 + 12 + 4);
        //会话标识
        buf[0] = 0x3e;
        buf[1] = 0x3A;
        //标志
        buf[2] = 1;
        buf[3] = 0;
        //查询报文数量
        buf[4] = 0;
        buf[5] = 1;
        //回答，授权和额外信息
        buf[6] = 0;
        buf[7] = 0;
        buf[8] = 0;
        buf[9] = 0;
        buf[10] = 0;
        buf[11] = 0;

        let offset = 12;

        for (const s of ss) {
            const j = s.length;
            buf[offset] = j;
            offset++;
            for (let k = 0; k < j; k++) {
                buf[offset] = s.charCodeAt(k);
                offset++;
            }
        }
        buf[offset] = 0;

        //类型
        buf[offset + 1] = 0;
        buf[offset + 2] = 1;
        //类型
        buf[offset + 3] = 0;
        buf[offset + 4] = 1;

        return buf;
    }
    const msg = getReqDNSBuf("3000128pc.shianco.com.cn");

    const req = dgram.createSocket("udp4");
    req.on("message", (msg, rinfo) => {
        // console.log("req recv: ", rinfo, msg);
        console.log("ip: ", `${msg[msg.byteLength - 4]}.${msg[msg.byteLength - 3]}.${msg[msg.byteLength - 2]}.${msg[msg.byteLength - 1]}`);
    }).on("close", () => {
        console.log("req closed!");
    }).on("error", (err) => {
        console.error("req error", err);
    }).on("listening", () => {
        console.log("req sending...");
    })

    req.send(msg, 53, "192.168.0.31");

}

testUDP();
function testUDP() {
    const dgram = require("dgram");

    const ports = [10000, 10001, 10002];
    const groupIP = "224.1.1.1";//224.0.0.1~239.255.255.254 组播地址前4位1110固定，后28位组播地址标识

    const p0 = dgram.createSocket("udp4");
    p0.bind(ports[0]);
    p0.on("listening", () => {
        console.log(`p0 start listening(${p0.address().address}:${p0.address().port})...`);
        p0.addMembership(groupIP);
        // p0.setBroadcast(true);
        // p0.setMulticastTTL(5)
    }).on("message", (msg, rinfo) => {
        console.log(`p0 recv from : ${rinfo.address}:${rinfo.port}`, msg.toString());
        p0.send("hi i am p0", rinfo.port, rinfo.address, () => {
            // p0.close();
        });
    }).on("error", (err) => {
        console.error(err);
    }).on("close", () => {
        console.log("p0 closed!");
    });




    const p1 = dgram.createSocket("udp4");
    p1.bind(ports[0], "192.168.6.30");
    p1.on("listening", () => {
        console.log(`p1 start listening(${p1.address().address}:${p1.address().port})...`);
        p1.addMembership(groupIP);
        // p1.setMulticastLoopback(false);
        // p0.setBroadcast(true);
        // p0.setMulticastTTL(5)
    }).on("message", (msg, rinfo) => {
        console.log(`p1 recv from : ${rinfo.address}:${rinfo.port}`, msg.toString());
        // p1.close();
    }).on("error", (err) => {
        console.error(err);
    }).on("close", () => {
        console.log("p1 closed!");
    });
    p1.send("hi i am p1, i am sending in group!", ports[0], groupIP);



    const p2 = dgram.createSocket("udp4");
    p2.bind(ports[2]);
    p2.on("listening", () => {
        console.log(`p2 start listening(${p2.address().address}:${p2.address().port})...`);
        // p2.setBroadcast(true);
    }).on("message", (msg, rinfo) => {
        console.log(`p2 recv from : ${rinfo.address}:${rinfo.port}`, msg.toString());
        // p2.close();
    }).on("error", (err) => {
        console.error(err);
    }).on("close", () => {
        console.log("p2 closed!");
    });
    p2.send(["hi ", "i am p2, i am not in group, but i can send to group!"], ports[0], groupIP);
    p2.send(["hi ", "i am p2 broadcast!"], ports[0], "192.168.6.255");

}