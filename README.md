# package-publish-lab

个人 Python / Node 发包练习项目。两个包都只有一个 `hello()` 函数，无运行时第三方依赖，不包含公司 demo 代码。

| 目录 | 安装名 | 导入方式 | 默认版本 |
| --- | --- | --- | --- |
| `python/` | `emma-package-publish-lab` | `from emma_package_publish_lab import hello` | `0.1.0` |
| `node/` | `emma-package-publish-lab-local` | `require('emma-package-publish-lab-local')` | `0.1.0` |

Python 和 Node 的安装名分别由 PyPI 和 npm 独立管理；它们只是测试名称，发布前需要确认可用，必要时添加自己的唯一后缀。Python 改安装名时只需改 `pyproject.toml` 的 `name`，导入目录可以不变；Node 改名后还需重新生成 lock 文件。

## 先测试 Python

在本项目根目录执行（需要 Python 3.11+；macOS 的 `python3` 可能仍指向旧版本）：

```shell
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip build twine
python -m build python
python -m twine check --strict python/dist/*
python -m pip install python/dist/*.whl
python -m unittest discover -s python/tests -v
python -c 'from emma_package_publish_lab import hello; print(hello("Emma"))'
```

以后再次构建前清理 `python/dist/` 的旧产物。期望产物为一个 `.whl` 和一个 `.tar.gz`。测试使用实际安装的 wheel，不需要修改 `PYTHONPATH`。

## 再测试 Node

需要 Node 22.14+，CI 使用 Node 24：

```shell
cd node
npm ci --ignore-scripts --no-audit --no-fund
mkdir -p dist
npm pack --pack-destination dist
node -e 'const { hello } = require("."); console.log(hello("Emma"))'
```

`npm pack` 会通过 `prepack` 自动执行语法检查和 3 个测试，然后生成 `node/dist/*.tgz`。Node 使用可直接运行的 CommonJS，无需额外编译。

## 推到个人 GitHub

这个目录是独立 Git 仓库。先在个人 GitHub 创建空仓库（例如 `package-publish-lab`，不用预先添加 README），然后在本项目根目录执行：

```shell
git add .
git commit -m "Add Python and Node publishing playground"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/package-publish-lab.git
git push -u origin main
```

把 `YOUR_GITHUB_USERNAME` 和仓库名替换成实际值。推送后 GitHub Actions 会自动构建发生变更的语言包，安装包保存在该次运行的 Artifacts 中，保留 7 天。两个工作流都不依赖 tag。

## Python：手动发布到 TestPyPI

1. 注册并验证 [TestPyPI](https://test.pypi.org/) 账号，完成账号要求的安全设置。
2. 在 TestPyPI 的 [Publishing 页面](https://test.pypi.org/manage/account/publishing/) 新增 pending trusted publisher，填写：
   - PyPI 项目名：`emma-package-publish-lab`，须与 `python/pyproject.toml` 的 `name` 一致。
   - GitHub owner：个人 GitHub 用户名。
   - Repository：实际仓库名。
   - Workflow filename：`python-ci.yml`，只填文件名。
   - Environment：`testpypi`。
3. 在 GitHub 仓库 `Settings → Environments` 创建名为 `testpypi` 的环境。
4. 在 GitHub `Actions → Python CI → Run workflow` 选择默认分支，勾选发布选项后运行。

首次发布会创建 TestPyPI 项目；使用 OIDC，不需要设置 `PYPI_TOKEN`。普通 push / PR 和未勾选发布的手动运行只构建。

验证远程安装时，在另一个虚拟环境中执行：

```shell
python -m pip install --index-url https://test.pypi.org/simple/ --no-deps emma-package-publish-lab==0.1.0
python -c 'from emma_package_publish_lab import hello; print(hello("TestPyPI"))'
```

这个测试包没有第三方运行时依赖，因此可以使用 `--no-deps`。准备切到正式 PyPI 时，需要在正式 PyPI 单独配置可信发布者，并调整工作流的上传地址及 environment；TestPyPI 配置不会自动继承。

## Node：本地首发，再接 GitHub CI

当前 Node 包名为 `emma-package-publish-lab-local`，用于从零体验本地首发。之前通过 CI 发布的 `emma-package-publish-lab@0.1.0` 保留在 npm。卸载或下架已发布包不能释放原来的包名与版本号组合。

工作流从开始就使用 OIDC，无需给新包配置 `NPM_TOKEN`。普通 push / PR 只构建；默认分支手动勾选发布后才会上传，不需要 tag。

### 本地发布首版

1. 注册 npm 账号，验证邮箱，并开启账号 2FA。
2. 在本项目的 `node/` 目录执行登录，并按提示在浏览器完成身份验证：

   ```shell
   npm login --registry=https://registry.npmjs.org/
   npm whoami --registry=https://registry.npmjs.org/
   ```

3. 预览打包内容；此命令会先执行语法检查和测试，不上传包：

   ```shell
   npm pack --dry-run
   ```

4. 确认后执行实际发布，并按提示完成身份验证：

   ```shell
   npm publish --access public --registry=https://registry.npmjs.org/
   ```

   发布目标为正式 npm，首版是 `emma-package-publish-lab-local@0.1.0`。

### 绑定可信发布者并验证 CI

1. 在新包的 Settings → Trusted publishing 中添加 GitHub Actions：owner 为 `lfwxyC`，repository 为 `publish-test`，workflow filename 为 `node-ci.yml`，environment 为 `npm`。允许此发布者执行 `npm publish`（direct publishing）。旧包的绑定不会自动应用到新包。
2. 在 GitHub 仓库创建或复用 `npm` 环境。
3. 在 `node/` 执行 `npm version 0.1.1 --no-git-tag-version`，同步更新 package.json 和 lock 文件，将代码和 OIDC 工作流一起提交并推送。
4. 在 `Actions → Node CI → Run workflow` 选择默认分支，勾选发布选项，验证 OIDC 成功发布 `0.1.1`。

CI 自动填写当前仓库的元信息，发布本次测试生成的 tarball；没有读取 `NPM_TOKEN` 的步骤。之前练习创建的临时 Token 和 GitHub Secret 可以清理。

安装验证请在另一个空目录执行：

```shell
npm init -y
npm install emma-package-publish-lab-local@0.1.0 --registry=https://registry.npmjs.org/
node -e 'const { hello } = require("emma-package-publish-lab-local"); console.log(hello("npm"))'
```

npm 要求包已存在才能绑定可信发布者；新的可信发布者配置需在创建后 2 天内完成首次成功发布，超时需重新配置。后续发布只需更新版本并运行 CI。

## 版本和发布行为

- Python 版本在 `python/pyproject.toml`，Node 版本在 `node/package.json` 和 `node/package-lock.json`。
- 每次发布使用新的版本号；已使用的发布文件或版本不能当作新文件覆盖上传。
- 手动发布限定默认分支。选择其他分支时仍会构建，但发布任务会跳过。
- 所有运行都先构建和测试；只有手动勾选发布才会上传远端。
- `.env`、`.npmrc`、`.pypirc` 已忽略，不要将账号凭证放入源码。

参考：[PyPI 可信发布](https://docs.pypi.org/trusted-publishers/using-a-publisher/)、[npm 可信发布](https://docs.npmjs.com/trusted-publishers/)。
