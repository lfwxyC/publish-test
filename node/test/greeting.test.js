'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { hello } = require('..');

// 通过包入口验证对外行为，与用户的调用方式一致。
test('没有传入名字时返回默认问候语', () => {
    assert.equal(hello(), 'Hello, world!');
});

test('支持中文名字', () => {
    assert.equal(hello('小明'), 'Hello, 小明!');
});

test('传入非字符串时抛出类型错误', () => {
    assert.throws(() => hello(123), TypeError);
});
