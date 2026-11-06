# Claude Desktop 中文

在 **Windows** 上为 Claude Desktop 的第三方 Gateway 模式加载简体或繁体中文界面。

这个包面向当前 Claude Desktop 的 `ion-dist.asar` 布局；旧的 `magpie-claude-zh@0.1.1`
只支持已经不再使用的展开式 `ion-dist` 目录。旧 npm 包由另一账号维护，无法在本仓库
发布新版本，因此这里使用新的官方社区包名并提供可安装的替代版本。

> 非官方项目。不会绕过 Claude 登录，不修改 Claude 的 `app`、`app.asar` 或
> `ion-dist.asar` 文件，也不代替 Anthropic 提供 Claude 服务。

## 安装

要求：

- Windows 10 或 Windows 11
- Claude Desktop，且已在 magpie 中配置为第三方 Gateway 模式
- magpie `0.1.1340` 或更新版本
- Node.js 22 或更新版本

在 magpie 的「插件 → 发现」中安装 **Claude Desktop 中文**，或运行：

```sh
magpie plugin add @magpie-community/page-claude-zh
```

如果仍安装着旧的 `magpie-claude-zh`，请先移除旧条目，避免两个插件同时接管语言加载。
插件设置中的默认值为简体中文，并开启「启动时加载中文」。

## 使用

1. 保持 magpie 运行，并确认插件已启用。
2. 如果 Claude 正在运行，使用 **File → Exit（文件 → 退出）** 完全退出。仅关闭窗口
   可能只是最小化到托盘。
3. 等待 magpie 显示「中文已准备好」，然后从原来的 Claude 入口启动。
4. 加载过程中 Claude 可能短暂打开 DevTools 和一个原生文件选择框；完成后自动收起。

语言选择和自动加载开关在插件页面保存，从下一次启动 Claude 时生效。当前已经打开的
窗口不会立即改变。

## 实现方式

- 从 Claude 的 `ion-dist.asar` 读取与当前版本匹配的英文词典和前端代码，并缓存一份
  只读的前端副本到 `%LOCALAPPDATA%\claude-desktop-3p-zh\original\frontends\`。
- 建立一个与当前前端版本绑定的中文补丁包，包含 MIT 许可的简体中文词典。
- Claude 启动后，通过 Windows UI Automation 打开本窗口的 DevTools，在页面内存中
  声明 `zh-Hans` 词典并切换语言；随后核对成功标记并关闭本次打开的工具窗口。
- 首次准备可能把 Claude 的 `developer_settings.json` 中 `allowDevTools` 设为 `true`。
  修改前会备份到插件自己的状态目录，写入使用哈希和进程退出检查；不会改动 Claude
  的可执行文件或打包资源。
- 已处理 `ion-dist.asar` 缓存、当前 Claude 版本和旧版展开目录，并在写入前校验哈希、
  管理员进程归属和插件仍处于启用状态。

## 兼容性与限制

- 目前已在实际 Windows 环境中验证 Claude Desktop `4.23118.0.0` 与 magpie
  `0.1.3149`。Claude 更新后如果内部语言运行时或 DOM 结构变化，插件会拒绝应用并
  保留原界面，而不会在版本不匹配时继续写入。
- 仅支持 Windows。其他平台不会启动语言注入。
- 中文词典覆盖约 91.6% 的当前基础词条和 96.1% 的动态词条；少量硬编码或尚未翻译
  的文字仍显示英文。
- 插件不会修改 Claude 的安装目录，因此 Claude 升级不会留下半汉化文件；插件会在
  下次启动时重新检查当前版本。
- 加载依赖 Windows 的 DevTools 和文件选择框。请保持 Claude 在前台，并让插件使用
  当前桌面会话；远程桌面断开、企业策略或辅助功能工具可能中断加载。
- 插件不会读取 magpie 的模型密钥或对话内容，页面声明的 magpie 数据权限为空。

## 旧版本与词典来源

这个包基于 [`polang233/claude-desktop-zh`](https://github.com/polang233/claude-desktop-zh)
的 MIT 许可代码，并修复了当前 Claude 版本中 `ion-dist.asar`、语言锚点和 DevTools
控制台定位的问题。

简体中文词典来自 [`javaht/claude-desktop-zh-cn`](https://github.com/javaht/claude-desktop-zh-cn)
的 MIT 许可资源，具体文件、提交和 SHA-256 见 `.catalogs/` 中的 `.meta.json` 文件。
Claude Desktop 及其官方资源归 Anthropic 所有；本项目不包含 Claude 可执行文件。

完整授权和第三方声明见 [LICENSE](LICENSE)、[NOTICE](NOTICE) 与 `LICENSES/`。

## 开发

```sh
npm install
npm test
npm run check
npm pack --dry-run
```

测试覆盖词典缓存、`ion-dist.asar` 检查、运行时代码生成、控制台选择、权限边界、
安装包内容与插件宿主的启用状态绑定。开发环境为 Node.js 22+；Windows 上的额外测试
需要 PowerShell 5.1+。

## English summary

This package adds Simplified and Traditional Chinese to Claude Desktop's
third-party Gateway mode on Windows. It supports current Claude builds that
ship `ion-dist.asar`, extracts a version-keyed frontend cache without touching
the installed app, and applies a hash-pinned Chinese catalog in the running
frontend. It requires Node.js 22+, does not bypass sign-in, and is Windows-only.

The implementation is derived from the MIT-licensed
`polang233/claude-desktop-zh` project. The bundled Chinese messages are from
the MIT-licensed `javaht/claude-desktop-zh-cn` project; provenance and hashes
are recorded beside the catalogs. This project is not affiliated with
Anthropic or magpie.
