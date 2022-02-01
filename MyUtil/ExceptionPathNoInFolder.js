'use strict';

class ExceptionPathNoInFolder extends Error {
    constructor(msg) {
        super(msg);
        this.name = "ExceptionPathNoInFolder";
        this.message = msg;
    }
}

module.exports = ExceptionPathNoInFolder;