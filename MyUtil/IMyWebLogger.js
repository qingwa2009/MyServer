const Assert = require('assert');
module.exports = class IMyWebLogger {
    send(msg) {
        Assert(false, '必须重载该函数');
    }
}