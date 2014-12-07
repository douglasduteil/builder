'use strict';

module.exports = [
  'es6',
  'register',
  'amd',
  'cjs',
  'global'
].reduce(function(memo, format) {
    memo[format] = require('./' + format);
    return memo;
  }, {});
