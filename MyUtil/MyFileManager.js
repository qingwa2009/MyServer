'use strict';
const FS = require('fs');
const Path = require('path');
const Assert = require('assert');
const Stream = require('stream');

const { MyPromise } = require('./MyUtil');
const { LOG, WARN, ERROR } = require('./MyUtil');

//==========MyFileManager==========
class MyFileManager {
    /**@type {Map<string, Promise<MyFileManager.MyFileHandle>>}*/
    _readingfds = new Map();
    // _closingfds = new Map();
    /**@type {Map<string, Promise<MyFileManager.MyFileWriteStream>>}*/
    _writingStreams = new Map();

    /**
     * @param {string} path  转全大写
     */
    static ignoreCasePath(path) {
        return path.toUpperCase();
    }

    /**      
     * @param {string} path 
     * @returns {Promise<MyFileManager.MyFileHandle>}
     */
    open(path) {
        const uPath = MyFileManager.ignoreCasePath(path);
        if (this._writingStreams.has(uPath)) {
            ERROR(`file open ${uPath} failed: file is writing!`);
            return Promise.reject(new Error('file is writing!'));
        }

        // if (this._closingfds.has(uPath)) {
        //     ERROR(`file open ${uPath} failed: file is closing!`);
        //     return Promise.reject(new Error('file is closing!'));
        // }

        if (!this._readingfds.has(uPath)) {
            const p = new Promise((res, rej) => {
                FS.open(uPath, FS.constants.O_RDONLY, (err, fd) => {
                    if (err) {
                        ERROR('file open failed: ', err.stack);
                        this._readingfds.delete(uPath);
                        rej(err);
                    } else {
                        WARN('file opened: ', uPath);
                        const fh = new MyFileManager.MyFileHandle(fd)
                        fh.onceClose(() => { this._readingfds.delete(uPath) });
                        res(fh);
                    }
                });
            });
            this._readingfds.set(uPath, p);
        }
        return this._readingfds.get(uPath);
    }

    /**     
     * @param {string} path 
     * @returns {Promise<MyFileManager.MyFileWriteStream>} 
     */
    create(path) {
        const uPath = MyFileManager.ignoreCasePath(path);
        if (this._writingStreams.has(uPath)) {
            ERROR(`file create ${path} failed: file is already writing!`);
            return Promise.reject(new Error('file is already writing!'));
        }

        const p =
            this.closeFileReading(uPath, false).then(
                () => {
                    //建文件夹
                    const dirname = Path.dirname(path);
                    return new Promise((res, rej) => {
                        FS.mkdir(dirname, err => ((err && err.code) !== 'EEXIST') ? rej(err) : res());
                    });
                }
            ).then(
                () => {
                    return new Promise((res, rej) => {
                        //建文件
                        FS.open(path, FS.constants.O_WRONLY | FS.constants.O_CREAT | FS.constants.O_TRUNC, (err, fd) => {
                            if (err) {
                                ERROR('file create failed: ', err.stack);
                                //某些时候文件确确实实已经创建了，但还是报错，所有不管三七二十一直接删掉吧
                                FS.unlink(path, err => {
                                    if (err)
                                        WARN('file create failed and try to delete failed: ', err.stack);
                                    else
                                        WARN('file create failed and try to delete successed: ', path);
                                })
                                rej(err);
                                return;
                            }
                            WARN('file create: ', path);
                            //建文件写入流
                            let ws = FS.createWriteStream('', { fd });
                            ws.path = path;
                            MyFileManager.MyFileWriteStream.decorate(ws);
                            ws.once('close', () => {
                                this._writingStreams.delete(uPath)
                            });
                            ws.once('error', (err) => {
                                this._writingStreams.delete(uPath);
                            });
                            res(ws);
                        });
                    });
                }
            ).catch(
                error => {
                    this._writingStreams.delete(uPath);
                    throw error;
                }
            );
        this._writingStreams.set(uPath, p);
        return p;
    }

    /**     
     * @param {string} path 
     * @param {boolean} forceClose default false; false时如果被占用就引发错误，true就强行关闭不引发错误
     */
    async closeFileReading(path, forceClose = false) {
        const uPath = MyFileManager.ignoreCasePath(path);
        if (!this._readingfds.has(uPath)) return Promise.resolve();

        try {
            const fh = await this._readingfds.get(uPath);
            return fh.close(forceClose);
        } catch (error) {
            return Promise.resolve();
        }
    }


    releaseAllFileReading() {
        for (const pfh of this._readingfds.values()) {
            pfh.then(fh => {
                fh.close(true);
            }, err => { });
        }
        this._readingfds.clear();
    }

    /**     
     * @param {string} path 
     * @returns {Promise<void>}
     */
    deleteFile(path) {
        const uPath = MyFileManager.ignoreCasePath(path);
        if (this._writingStreams.has(uPath)) {
            WARN(`can not delete writing file ${path}`);
            return Promise.reject(new Error('Can not delete writing file!'));
        }
        return this.closeFileReading(path, false).then(
            () => {
                return new Promise((res, rej) => {
                    FS.unlink(path, err => {
                        if (err) rej(err);
                        else res();
                    })
                })
            }
        );
    }

    /**     
     * @param {string} path 
     * @returns {Promise<MyFileWriteStream>} MyFileWriteStream
     */
    getFileWriting(path) {
        const uPath = MyFileManager.ignoreCasePath(path);
        return this._writingStreams.has(uPath) ? this._writingStreams.get(uPath) : Promise.reject();
    }

    /**
     * 获取目录下的所有文件和文件夹stats
     * @param {string} folder 
     * @returns {Promise<FS.Stats[]>}  FS.Stats包含fileName和filePath
     */
    getFileList(folder) {
        return new Promise((res, rej) => {
            FS.readdir(folder, (err, files) => {
                if (err) {
                    rej(err);
                    return;
                }
                const ss = [];
                const ps = [];
                const its = this.getFilesStats(folder, files);
                for (const t of its) {
                    ps.push(
                        t.then(
                            stat => ss.push(stat),
                            e => { }
                        )
                    );
                }
                Promise.all(ps).finally(() => res(ss));
            });
        });
    }

    /**
     * 返回迭代的files stats
     * @param {string} folder 
     * @param {string} files 
     * @returns {IterableIterator<Promise<FS.Stats>>} FS.Stats包含fileName和filePath
     */
    *getFilesStats(folder, files) {
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const path = Path.join(folder, fileName);
            yield new Promise((res, rej) => {
                FS.stat(path, (err, stat) => {
                    if (err) rej(err);
                    else {
                        stat.fileName = fileName;
                        stat.filePath = path;
                        res(stat);
                    }
                });
            });
        }
    }
}

//==========MyFileWriteStream==========
MyFileManager.MyFileWriteStream = class MyFileWriteStream extends FS.WriteStream {
    static LISTENER_WRITE_FINISHED = 'writeCompleted';
    // static TEMP_FILE_SUFFIX = '.tmp';


    constructor() {
        Assert(false, "please use decorate!");
    }

    static _decorate() {
        Assert(!(this instanceof MyFileWriteStream), "can not new or re decorate!");
        Assert((this instanceof FS.WriteStream), "'this' is not instanceof FS.WriteStream!");

        Object.setPrototypeOf(this, MyFileWriteStream.prototype);


        this.once('open', this._onWriteOpen);
        this.once('error', this._onWriteError);
        this.once('close', this._onWriteClose);
    }

    _onWriteOpen(fd) {
        WARN('Write Stream created: fd=', fd);
    }

    _onWriteClose() {
        if (this._deleted) return;
        WARN('file write completed: ', this.path);
        this.emit(MyFileWriteStream.LISTENER_WRITE_FINISHED, null, this.path);
    }

    /**
     * @param {Error} err 
     */
    _onWriteError(err) {
        ERROR('file writing error: ', err.stack);
        this.close();
        //出错就删除文件
        if (err.code !== 'ENOENT') {
            this._deleteFile();
        }
        this.emit(MyFileWriteStream.LISTENER_WRITE_FINISHED, err, '');
    }

    _deleteFile() {
        if (this._deleted) return;
        if (!this.path) return;
        FS.unlink(this.path, err => {
            if (err)
                ERROR('file writing delete failed: ', err.stack);
            else
                WARN('file writing deleted: ', this.path);
        });
        this._deleted = true;
    }

    /**
     * @param {(err: Error, path : string) => {}} callback 文件写入结束时调用，仅调用一次，如果错误会自动删除文件
     */
    onceWriteFinish(callback) {
        this.once(MyFileWriteStream.LISTENER_WRITE_FINISHED, callback);
    }

    giveup() {
        this.destroy(new Error(`file writting give up: ${this.path}`));
        // this.emit('error', new Error('file writting give up!'));
    }

    /**
     * @param {FS.WriteStream} stream
     */
    static decorate(stream) {
        MyFileWriteStream._decorate.call(stream);
    }
}

MyFileManager.MyFileHandle = class MyFileHandle {
    static ERROR_INVALID_HANDLE = new Error('file handle is invalid!');
    static ERROR_CLOSE_FAILED = new Error('file close failed, file is using!');
    static ERROR_PIPE_FAILED_WSCLOSED = new Error('file pipe failed: destination is closed before pipe finished!');

    /**@type {number} */
    fd = null;
    _refCount = 0;
    /**@type {Promise<void>} */
    _closePromise = null;
    /**@type {Promise<FS.Stats>} */
    _statPromise = null;

    /**@param{number} fd*/
    constructor(fd) {
        this.fd = fd
    }

    get isClosed() {
        return this.fd === null;
    }

    /**
     * @param {Stream.Writable} destination 
     * @returns {Promise<void>}
     * 传输接受时请手动关闭destination
     * 如果传输期间出现：source.error、destination.close、destination.error的事件，就会引发错误
     */
    pipe(destination, start = 0, end = Infinity) {
        if (this.isClosed) return Promise.reject(MyFileHandle.ERROR_INVALID_HANDLE);
        const rs = FS.createReadStream('', { fd: this.fd, autoClose: false, start, end });
        rs.pipe(destination, { end: false });
        this.ref();

        return new Promise((res, rej) => {
            let isUnRefed = false;
            rs.once('end', () => {
                if (isUnRefed) return;
                this.unref();
                isUnRefed = true;
                res();
            });
            rs.once('error', err => {
                if (isUnRefed) return;
                this.unref();
                isUnRefed = true;
                rej(err);
            });
            destination.once('error', err => {
                if (isUnRefed) return;
                this.unref();
                isUnRefed = true;
                rej(err);
            })
            destination.once('close', () => {
                if (isUnRefed) return;
                this.unref();
                isUnRefed = true;
                rej(MyFileHandle.ERROR_PIPE_FAILED_WSCLOSED);
            })
        });
    }

    /**
     * @param {boolean} forceClose default false; false时如果被占用就引发错误，true就强行关闭不引发错误
     * @returns {Promise<void>}
     */
    close(forceClose = false) {
        if (this._closePromise)
            return this._closePromise;

        if (!forceClose && this._refCount > 0)
            return Promise.reject(MyFileHandle.ERROR_CLOSE_FAILED);

        this._closePromise = new Promise((res, rej) => {
            FS.close(this.fd, err => {
                this.fd = null;
                this._refCount = 0;
                res();//不管是否出错都返回成功   

                const n = this._closeListeners.length;
                for (let i = 0; i < n; i++) {
                    this._closeListeners[i]();
                }
                this._closeListeners = [];
            })
        })
        return this._closePromise;
    }

    _closeListeners = [];
    /**
     * @param {()=>{}} cb close触发promise resolve后调用，直接调用，并非使用事件队列
     */
    onceClose(cb) {
        this._closeListeners.push(cb);
    }

    /**
     * @returns {Promise<FS.Stats>}
     * @throws {NodeJS.ErrnoException} 
     */
    getStats() {
        if (this._statPromise)
            return this._statPromise;
        if (this.isClosed)
            return Promise.reject(MyFileHandle.ERROR_INVALID_HANDLE);
        this._statPromise = new Promise((res, rej) => {
            FS.fstat(this.fd, (err, stats) => {
                if (err) rej(err);
                else res(stats);
            });
        });
        return this._statPromise;
    }

    ref() {
        this._refCount++;
    }

    unref() {
        if (this._refCount < 1) return;
        this._refCount--;
    }

}

module.exports = MyFileManager;