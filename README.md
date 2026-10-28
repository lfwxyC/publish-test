# package-publish-lab

个人 Python / Node 发包练习项目。两个包都只有一个 `hello()` 函数，无运行时第三方依赖，不包含公司 demo 代码。

| 目录 | 安装名 | 导入方式 | 默认版本 |
| --- | --- | --- | --- |
| `python/` | `emma-package-publish-lab` | `from emma_package_publish_lab import hello` | `0.1.0` |
| `node/` | `emma-package-publish-lab` | `require('emma-package-publish-lab')` | `0.1.0` |

这两个安装名分别属于 PyPI 和 npm，不会互相冲突；它们只是测试名称，发布前需要确认可用，必要时添加自己的唯一后缀。Python 改安装名时只需改 `pyproject.toml` 的 `name`，导入目录可以不变；Node 改名后还需重新生成 lock 文件。

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

## Node：先验证打包，再接 npm 发布

npm 工作流的手动发布目标是正式 npm，勾选前应先完成以下设置。初次可只运行构建，验证 `.tgz`。

1. 注册 npm 账号并确认包名可用。改名后，在 `node/` 执行 `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` 更新锁文件。
2. 为新包完成首次本地发布。在 `node/` 填写实际仓库地址，然后登录 npm、执行发布（这是实际发布操作，准备好再执行）：

   ```shell
   npm pkg set 'repository.type=git' 'repository.url=git+https://github.com/YOUR_GITHUB_USERNAME/package-publish-lab.git' 'repository.directory=node'
   npm login
   npm publish --access public
   ```

3. 在 npm 包的 Settings → Trusted publishing 中添加 GitHub Actions：owner 和 repository 填实际值，workflow filename 为 `node-ci.yml`，environment 为 `npm`。允许此发布者执行 `npm publish`（direct publishing）。
4. 在 GitHub 仓库创建 `npm` 环境。
5. 将 `node/package.json` 的版本改为 `0.1.1`，同步更新 lock 文件，提交并推送。首次本地发布已使用 `0.1.0`，CI 要发布新版本。
6. 在 GitHub `Actions → Node CI → Run workflow` 选择默认分支，勾选发布选项。

CI 会自动填写当前 GitHub 仓库的 package 元信息，发布本次测试生成的 tarball。使用 OIDC，无需配置 `NPM_TOKEN`；当前 npm 要求新的 trusted publisher 配置在创建后 2 天内完成首次成功发布，超时需重新配置。

## 版本和发布行为

- Python 版本在 `python/pyproject.toml`，Node 版本在 `node/package.json` 和 `node/package-lock.json`。
- 每次发布使用新的版本号；已使用的发布文件或版本不能当作新文件覆盖上传。
- 手动发布限定默认分支。选择其他分支时仍会构建，但发布任务会跳过。
- 所有运行都先构建和测试；只有手动勾选发布才会上传远端。
- `.env`、`.npmrc`、`.pypirc` 已忽略，不要将账号凭证放入源码。

参考：[PyPI 可信发布](https://docs.pypi.org/trusted-publishers/using-a-publisher/)、[npm 可信发布](https://docs.npmjs.com/trusted-publishers/)。
