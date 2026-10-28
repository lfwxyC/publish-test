# emma-package-publish-lab-local — Node

用于练习 npm 打包和发布的最小包，需要 Node 22.14+，没有第三方依赖。

```javascript
const { hello } = require('emma-package-publish-lab-local');

console.log(hello());       // Hello, world!
console.log(hello('Emma')); // Hello, Emma!
```

`hello()` 接收字符串；传入其他类型会抛出 `TypeError`。

本地执行 `npm pack` 会先运行检查和测试，再生成 tarball。账号设置和 GitHub 发布步骤见仓库根目录 README。
