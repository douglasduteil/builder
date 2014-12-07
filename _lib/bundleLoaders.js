'use strict';

var System = exports.System = require('systemjs');

var formatCompilers = require('./compilers');

module.exports = {
  get default() {

    var loader = new Loader(System);
    loader.baseURL = System.baseURL;
    loader.paths = { '*': '*.js' };
    loader.config = System.config;

    var pluginLoader = new Loader(System);
    pluginLoader.baseURL = System.baseURL;
    pluginLoader.paths = { '*': '*.js' };
    pluginLoader.config = System.config;

    loader.trace = true;
    loader.execute = false;
    loader.pluginLoader = pluginLoader;

    loader.set('@empty', loader.newModule({}));

    formatCompilers.amd.attach(loader);
    formatCompilers.amd.attach(pluginLoader);

    return loader;

  }
};
