# emma-package-publish-lab — Python

用于练习 Python 构建、安装及 TestPyPI 发布的最小包，需要 Python 3.11+。

```python
from emma_package_publish_lab import hello

print(hello())        # Hello, world!
print(hello("Emma"))  # Hello, Emma!
```

`hello()` 接收字符串；传入其他类型会抛出 `TypeError`。

构建、测试和 GitHub 发布步骤见仓库根目录 README。此包没有运行时第三方依赖。
