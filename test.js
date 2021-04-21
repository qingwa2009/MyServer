'use strict';
const fs = require("fs");
const Path = require("path");
const Http = require('http');
const Events = require('events');
const Url = require("url");
const { promisify } = require("util");
const { MyHttpRequest, MySocket } = require('./MyHttp');
const MyUtil = require("./MyUtil");
const { MyFileManager } = require("./MyUtil");

const querystring = require('querystring');

MyUtil.LOG("-----------------test-----------------");

// testPath();
function testPath() {
    let p = Path.win32.join("c:/", "/abc/");
    console.log(p);
    p = Path.win32.join("c:/", "/abc");
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
    let url = "/%E5%AF%BC%E5%87%BAx_t?a=123&a=456&b=5&c=/%E5%AF%BC%E5%87%BA&d="

    let ret = querystring.parse(url);
    console.log(ret);

    let p = MyHttpRequest.parseReqPath(url);
    console.log(p);

    ret = querystring.parse(p.query);
    console.log(ret);
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
    console.log(Array.isArray(querys['a']));

    const datas = [];
    datas.push(Buffer.from('["abc'));
    datas.push(Buffer.from('def"]'));

    console.log(JSON.parse(datas));

    console.log(datas.join(''));

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

// testHttps();
function testHttps() {
    var https = require('https');
    const k = fs.readFileSync("./SSL/server.key");
    const c = fs.readFileSync("./SSL/server.pem");
    const server = https.createServer({ key: k, cert: c });
    const Net = require('net');
    const TLS = require('tls');
    Object.setPrototypeOf(TLS.TLSSocket.prototype, MySocket.prototype);

    server.listen(443);
    // server.on("OCSPRequest", (cert, issuer, cb) => {
    //     console.log("-------------OCSPRequest");
    //     console.log(cert, issuer, cb);
    // })
    // server.on("newSession", (sessionId, sessionData, cb) => {
    //     console.log("-------------newSession");
    //     console.log(sessionId, sessionData, cb);
    // })
    // server.on("resumeSession", (sessionId, cb) => {
    //     console.log("-------------resumeSession");
    //     console.log(sessionId, cb);
    // })
    server.on("secureConnection", (tlsSocket) => {
        console.log("-------------secureConnection");
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

        console.log("-------------request");
        console.log(req, resp);
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
    // const cb = (err, stdout, stderr) => {
    //     if (err) {
    //         console.error(err);
    //         // console.log(`退出码：${err.code}`);
    //     }
    //     console.log(stdout);
    //     console.error(stderr);
    // }
    // child_process.execSync("chcp 65001");
    // child_process.exec("123", cb);

    // child_process.execFile(Path.join(__dirname, "test/lala.bat"), { encoding: "utf8", }, cb);
    //node ${__dirname}/app.js



    const cp = child_process.spawn(`node ${__dirname}/serverRestarter.js`, [], { detached: true, stdio: 'inherit', shell: true });
    cp.unref();
    cp.on("exit", (code, signal) => {
        process.exit(0);
    })

    // setTimeout(() => {
    //     process.exit(0);
    // }, 1000);
    // child_process.exec("calc");
}


// lala();
async function lala() {
    // const MyUtil = require('./MyUtil');
    // console.log(MyUtil.ENABLE_LOG);
    // MyUtil.LOG("lala");
    // MyUtil.ENABLE_LOG = true;
    // console.log(MyUtil.ENABLE_LOG);
    // MyUtil.LOG("lala");

    // const resp = require('./MyResponses');
    // console.log(resp.get('/Upload'));

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
