const EventEmitter = require('events');

// function require(...) {
//     const module = { exports: {} };
//     ((module, exports) => {        
//         /** 
//          *写的东西在这里 
//          */
//     })(module, module.exports);
//     return module.exports;
// }

module.exports = new EventEmitter();
setTimeout(() => {
    module.exports.emit('ready');
}, 1000);
