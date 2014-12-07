'use strict';

var _ = require('lodash');

var saucy = require('./sourcemaps');
var formatCompilers = require('./compilers');

function ModuleTrace(moduleName, tree, loader) {
  this.moduleName = moduleName;
  // branched
  this.tree = tree;
  this.loader = loader;

  this.filter = _.compose(function (tree) {
    this.tree = tree;
    return this;
  }.bind(this), _.partial(_.pick, this.tree));

  this.pluckAdresses = function () {
    return _(this.tree)
      .pluck('address')
      .map(
      function normalizeAbsolutePaths(address) {
          // remove the "file:" prefix
          return address.substr(5);
      })
      .value();
  };
}

ModuleTrace.fromModule = fromModule;

////

ModuleTrace.prototype.filterExtension = filterExtension;

ModuleTrace.prototype.concat = concat;

////

function compileLoad(load, opts, loader, compilers) {
  return Promise.resolve()
    .then(function () {

      compilers = compilers || {};

      if (load.metadata.build === false) {
        return {};
      }

      var format = load.metadata.format;
      if (format === 'defined') {
        return {source: ''};
      }

      var compiler = formatCompilers[format];
      if (!compiler) {
        throw "unknown format " + format;
      }

      compilers[format] = true;
      return compiler.compile(load, opts, loader);

    });
}

function countLines(str) {
  return str.split(/\r\n|\r|\n/).length;
}

// Process compiler outputs, gathering:
//
//   concatOutputs:         list of source strings to concatenate
//   sourceMapsWithOffsets: list of [absolute offset,
//                                   source map string] pairs
//
//  Takes lists as empty references and populates via push.
function processOutputs(outputs) {
  var offset = 0;

  return outputs.reduce(function (memo, output) {
    var source;
    if (typeof output == 'object') {
      source = output.source || '';
      var offset_ = output.sourceMapOffset || 0;
      var map = output.sourceMap;
      if (map) {
        memo.sourceMapsWithOffsets.push([offset + offset_, map]);
      }
    }
    else if (typeof output == 'string') {
      source = output;
    }
    else {
      throw "Unexpected output format: " + output.toString();
    }
    source = saucy.removeSourceMaps(source || '');
    offset += countLines(source);
    memo.sources.push(source);
    return memo;
  }, {
    sources: [],
    sourceMapsWithOffsets: []
  });
}

function concat(opts) {
  opts = opts || {};

  var moduleTrace = this;

  var outputs = ['"format register";\n'];
  var names = Object.keys(moduleTrace.tree);

  return Promise.all(names.map(function (name) {
    var load = moduleTrace.tree[name];

    return Promise.resolve(compileLoad(load, opts, moduleTrace.loader))
      .then(outputs.push.bind(outputs));
  }))
    .then(function () {
      return processOutputs(outputs);
    })
    .then(function (processedOutputs) {
      processedOutputs.sources = processedOutputs.sources.join('\n');
      return processedOutputs;
    });
}


function filterExtension(targetExtension) {
  var moduleTrace = this;

  return _.compose(
    function setTree(tree) {
      moduleTrace.tree = tree;
      return moduleTrace;
    },
    function filterDepsKeys(trace) {
      return _.mapValues(trace.tree, depsExtensionFilter);
    },
    function filterTreeKeys(trace) {
      return trace.filter(addressExtensionFilter)
    })
  (moduleTrace);

  ////

  function addressExtensionFilter(branch) {
    return hasExtension(branch.address, targetExtension);
  }

  function hasExtension(filename, extension) {
    // Obscure yet fast checking  http://jsperf.com/extract-file-extension
    var fileExtension = filename.substr((~-filename.lastIndexOf(".") >>> 0) + 2);
    return fileExtension === extension;
  }

  function depsExtensionFilter(branch) {
    _.reduce(branch.deps, function (memo, depModuleName) {
      // Find the branch
      var depFullModuleName = branch.depMap[depModuleName];
      var moduleBranch = moduleTrace.tree[depFullModuleName];

      // Check if it must be removed
      var isDepToRemove = !moduleBranch || !addressExtensionFilter(moduleBranch);

      if (isDepToRemove) {
        // Triple remove
        delete memo.depMap[depModuleName];
        _.pull(memo.deps, depModuleName);
        _.pull(memo.metadata.deps, depModuleName);
      }

      return memo;
    }, _.pick(branch, ['deps', 'depMap', 'metadata']));

    // Here "_.pick" use the same object ref of branch
    // to manipulate the depMap, deps, metadata, etc...
    return branch;
  }

}

function fromModule(moduleName, loadedModules, loader) {
  return explore(loadedModules, moduleName, new ModuleTrace(moduleName, {}, loader));
}

function explore(loadedModules, moduleName, moduleTrace, seen) {
  seen = seen || [];
  seen.push(moduleName);

  var load = loadedModules[moduleName] || {deps: []};

  var nextDependencyMap = load.deps
      .map(function (dep) {
        return load.depMap[dep];
      })
      .filter(function (dep) {
        return seen.indexOf(dep) < 0;
      })
    ;

  var dependencePromise = nextDependencyMap.map(function (dep) {
    return explore(loadedModules, dep, moduleTrace, seen);
  });

  return Promise.all(dependencePromise).then(function () {
    moduleTrace.tree[load.name] = load;
    return moduleTrace;
  });
}


module.exports = ModuleTrace;
