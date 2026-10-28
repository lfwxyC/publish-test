'use strict';

/** 生成问候语，用于验证用户安装后的统一入口。 */
function hello(name = 'world') {
    if (typeof name !== 'string') {
        throw new TypeError('name 必须是字符串');
    }
    return `Hello, ${name}!`;
}

module.exports = { hello };
