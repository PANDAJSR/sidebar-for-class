# AGENTS 协作规范

## 项目技术栈与主要包
- 运行时与桌面框架：`Electron`（`electron`）
- 前端框架：`React`（`react`、`react-dom`）
- 构建工具：`Vite`（`vite`、`@vitejs/plugin-react`）
- UI 组件：`Fluent UI`（`@fluentui/react-components`、`@fluentui/react-icons`）
- 编辑器组件：`Monaco Editor`（`@monaco-editor/react`）
- 桌面能力与多媒体相关：`screenshot-desktop`、`sharp`、`canvas`、`loudness`
- 打包与并发开发工具：`electron-builder`、`concurrently`、`wait-on`

## 代码文件大小与可维护性
- 单个代码文件（如 `.js`、`.jsx`、`.ts`、`.tsx`、`.css`）不应超过 400 行。
- 以可维护性优先，接近 400 行前就应主动拆分模块，而不是超过 400 行后再拆分。
- 新增功能时优先按职责拆分文件（如：UI 组件、状态管理、工具函数、平台能力封装）。

## 提交与推送规范
- 每次修改代码内容后，必须立即提交并推送到远程仓库。
- Commit message 必须使用中文，并遵循 Conventional Commits 规范。
- 推荐格式：`<type>(<scope>): <中文描述>`，例如：`feat(editor): 新增代码折叠功能`。
- 当用户输入 `cp` 时，必须立即使用中文 Conventional Commits 规范完成提交，并推送到远程仓库。
