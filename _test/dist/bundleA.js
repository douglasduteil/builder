"format register";

System.register("vendor:foo", [], false, function(__require, __exports, __module) {
  System.get("@@global-helpers").prepareGlobal(__module.id, []);
  (function() {


"deps ./bar.css!";

function foo(){
  return 'foo';
}

modules.exports = foo;
  }).call(System.global);  return System.get("@@global-helpers").retrieveGlobal(__module.id, false);
});

System.register("vendor:systemjs/plugin-css/css", [], true, function(require, exports, module) {
  var global = System.global;
  var __define = global.define;
  global.define = undefined;
  var __filename = "vendor/systemjs/plugin-css/css.js";
  var __dirname = "vendor/systemjs/plugin-css";
if (typeof window !== 'undefined') {
  var waitSeconds = 100;
  
  var head = document.getElementsByTagName('head')[0];
  
  // get all link tags in the page
  var links = document.getElementsByTagName('link');
  var linkHrefs = [];
  for (var i = 0; i < links.length; i++) {
    linkHrefs.push(links[i].href);
  }
  
  var isWebkit = !!window.navigator.userAgent.match(/AppleWebKit\/([^ ;]*)/);
  var webkitLoadCheck = function(link, callback) {
    setTimeout(function() {
      for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        if (sheet.href == link.href)
          return callback();
      }
      webkitLoadCheck(link, callback);
    }, 10);
  }
  
  var noop = function() {}
  
  var loadCSS = function(url) {
    return new Promise(function(resolve, reject) {
      var timeout = setTimeout(function() {
        reject('Unable to load CSS');
      }, waitSeconds * 1000);
      var _callback = function() {
        clearTimeout(timeout);
        link.onload = noop;
        setTimeout(function() {
          resolve('');
        }, 7);
      }
      var link = document.createElement('link')  ;
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
  
      if (!isWebkit)
        link.onload = _callback;
      else
        webkitLoadCheck(link, _callback);
  
      head.appendChild(link);
    });
  }
  
  exports.fetch = function(load) {
    // dont reload styles loaded in the head
    for (var i = 0; i < linkHrefs.length; i++)
      if (load.address == linkHrefs[i])
        return '';
    return loadCSS(load.address);
  }
}
else {
  exports.build = false;
}

  global.define = __define;
  return module.exports;
});

System.register("src/a", ["foo"], true, function(require, exports, module) {
  var global = System.global;
  var __define = global.define;
  global.define = undefined;
  var __filename = "src/a.js";
  var __dirname = "src";

var foo = require('foo');

//var b = require('./b').default;
//var c = require('./c').default;
  global.define = __define;
  return module.exports;
});
