'use strict';

var util = require('util');
global.d = function() {
  var args = Array.prototype.slice.call(arguments);
  var time = new Date().toISOString();
  console.log(time + ' - ' + util.inspect.call(null, args.length === 1 ? args[0] : args, false, 10, true));
};

var _ = require('lodash');

var bundleLoaders = require('./bundleLoaders');
var ModuleTrace = require('./ModuleTrace');


function Bundler(loader) {
  this.loader = loader;
}

Bundler.prototype.config = function(config) {
  var cfg = _.omit(config, 'bundles');
  this.loader.config(cfg);
  this.loader.pluginLoader.config(cfg);
};

Bundler.prototype.trace = function(moduleName) {
  var bundler = this;
  return this.loader.import(moduleName)
    .then(function() { return bundler.loader.normalize(moduleName); })
    .then(function(moduleName) {
      return ModuleTrace.fromModule(
        moduleName,
        bundler.loader.loads,
        bundler.loader
      );
    })
    .catch(function(e) { throw e; });
};

Bundler.trace = function(moduleName, config) {
  var b = new Bundler(bundleLoaders.default);

  if (config) {
    b.config(config);
  }

  return b.trace(moduleName);
};


module.exports = Bundler;