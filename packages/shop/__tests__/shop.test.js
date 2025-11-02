'use strict';

const shop = require('..');
const assert = require('assert').strict;

assert.strictEqual(shop(), 'Hello from shop');
console.info('shop tests passed');
