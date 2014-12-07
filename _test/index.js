'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var Bundler = require('../_lib/bundler');
var ModuleTrace = require('../_lib/ModuleTrace');

var expect = require('chai').expect;

function delay(fn, done) {
  return function () {
    var args = arguments;
    setImmediate(function () {
      fn.apply(null, Array.prototype.slice.apply(args));
      done();
    })
  };
}

var config = {
  baseURL: '_test',

  paths: {
    'vendor:*': 'vendor/*.js'
  },

  map: {
    'foo': 'vendor:foo',
    'css': 'vendor:systemjs/plugin-css/css'
  }
};

describe('Bundler', function () {

  describe('trace', function () {
    it('should generate a tree with a file', function (done) {
      Bundler.trace('src/a', config)
        .then(delay(test, done), done)
      ;
      function test(trace) {
        expect(trace).to.be.an.instanceOf(ModuleTrace);
        expect(trace.moduleName,
          'Expect "moduleName" to be equal the traced module name'
        ).to.equal('src/a');
      }
    });
  });

});


describe('ModuleTrace', function () {

  describe('#filter', function () {
    it('should return only "vendoer:" modules', function (done) {
      Bundler.trace('src/a', config)
        .then(delay(test, done), done)
      ;
      function test(trace) {
        var filteredTrace = trace.filter(function (branch) {
          return branch.name.indexOf('vendor:') === 0;
        });
        expect(filteredTrace).to.be.an.instanceOf(ModuleTrace);
        expect(filteredTrace.tree).to.include.keys(
          'vendor:foo',
          'vendor:systemjs/plugin-css/css'
        );
      }
    });
  });

  describe('#filterExtension', function () {
    it('should return only the "js" modules', function (done) {
      Bundler.trace('src/a', config)
        .then(delay(test, done), done)
      ;
      function test(trace) {
        var filteredTrace = trace.filterExtension('js');
        expect(filteredTrace).to.be.an.instanceOf(ModuleTrace);
        expect(filteredTrace.tree).to.not.be.empty();
        expect(filteredTrace.tree).to.not.include.keys(
          'bar.css!vendor:systemjs/plugin-css/css'
        );
        expect(
          filteredTrace.tree['vendor:foo'].deps,
          'expected vendor:foo deps to be empty'
        ).to.be.empty();
        expect(
          filteredTrace.tree['vendor:foo'].depMap,
          'expected vendor:foo depMap to be empty'
        ).to.be.empty();
      }
    });
  });


  describe('#concat', function () {
    it('should return the concatenated file tree', function (done) {
      Bundler.trace('src/a', config)
        .then(function (trace) {
          return trace.filterExtension('js');
        })
        .then(function (trace) {
          return trace.concat();
        })
        .then(delay(test, done))
        .catch(done)
      ;
      function test(concatenatedTree) {
        expect(concatenatedTree).to.have.keys('sources', 'sourceMapsWithOffsets');
        var expectedConcat = fs.readFileSync(path.resolve(config.baseURL + '/dist/bundleA.js'));
        expect(concatenatedTree.sources).to.equal(expectedConcat.toString());
      }
    });
  });


  describe('#pluckAdresses', function () {
    it('should return the address of each branch', function (done) {
      Bundler.trace('src/a', config)
        .then(function (trace) {
          return trace.filterExtension('css');
        })
        .then(function (trace) {
          return trace.pluckAdresses();
        })
        .then(delay(test, done))
        .catch(done)
      ;
      function test(addresses) {
        expect(addresses).to.be.instanceof(Array);
        expect(addresses).to.deep.equals([path.resolve('_test/bar.css')]);
      }
    });
  });
});
