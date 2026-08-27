# Code Differ

一个基于 Vue 3 和 Vite 的浏览器端文本/代码差异查看器。支持拆分与统一视图、行内差异、语法高亮、忽略规则、长内容虚拟滚动、独立 HTML 导出，以及通过 GitHub Issue 分享。

## 本地运行

要求 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

常用命令：

```bash
npm test
npm run build
npm run preview
```

## 功能

- 拆分视图和统一视图
- 单词级或字符级行内差异
- 指定语言或自动检测的语法高亮
- 忽略空白、大小写和空行
- 去除行尾空白、合并空白字符
- 折叠未修改行、跳转至第一个差异
- 双击差异行就地编辑，并同步回底部输入编辑器
- 固定行高时使用虚拟滚动；自动换行时切换为可变行高完整渲染
- 识别“文件末尾没有换行”
- 导出可离线交互的单文件 HTML
- 将压缩后的对比内容保存为 GitHub Issue，并自动关闭 Issue

## 分享配置

在 `.env.local` 中配置：

```dotenv
VITE_GITHUB_TOKEN=your_token
VITE_SHARE_BASE_URL=https://your-domain.example/
```

Token 必须有在目标仓库创建及更新 Issue 的权限。分享数据使用 `lz-string` 压缩；读取逻辑同时兼容旧版未压缩 Issue。仓库地址当前在 `src/utils/github.js` 中配置。

> 注意：所有 `VITE_*` 环境变量都会进入浏览器产物。当前分享实现适合受控环境；面向公开网络部署时应将 GitHub API 写操作迁移到服务端。

## 项目结构

```text
src/core/          Diff、文本转换和行对齐逻辑
src/store/         Vue 响应式状态及派生结果
src/components/    工具栏、控制面板、编辑器和查看器
src/utils/         GitHub 分享和离线 HTML 导出
test/              Node.js 单元测试
```

## 限制

- GitHub Issue 正文仍受 GitHub API 大小限制；压缩能显著提高通常代码文本的可分享容量，但极大的或难以压缩的内容仍可能被拒绝。
- 自动换行需要可变行高，因此会关闭虚拟滚动；超大文件建议关闭自动换行。
