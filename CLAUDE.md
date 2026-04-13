# DreamStudio 项目

## 项目概述

这是一个 AI 视频生成工作室项目，包含以下核心模块：
- **前端**：React + Vite + Framer Motion（画布、节点工作区、对话）
- **后端**：Node.js API（节点版本管理、提案系统、工作流）

---

## 开发原则

### 核心原则
1. **方案先行** — 任何代码修改前，必须先出方案让用户 review
2. **清晰沟通** — 先理解需求，提问题确认，不要猜测
3. **小步快走** — 每次只改一个功能点，验证后再继续
4. **追踪影响** — 改完后说明影响了哪些文件、哪些功能

### 工作流程
```
用户提出需求
    ↓
分析问题，明确需求（必要时提问）
    ↓
出方案（涉及代码改动的必须出方案）
    ↓
用户 review 方案
    ↓
确认后开发
    ↓
验证功能，说明改动范围
```

---

## 节点版本系统

### 版本数据结构
```js
{
  id: 15,          // 数据库主键（API 用这个）
  versionNo: 3,    // 用户看到的版本号 v3
  isCurrent: true, // 是否是当前版本
  createdAt: "2026-04-12 23:31:34"
}
```

### API 路径
```
POST /v1/projects/{projectId}/nodes/{nodeId}/versions/{versionId}/activate
```
注意：后端期望的是 `id`（数据库主键），不是 `versionNo`（用户版本号）

### 刷新机制
- 版本切换成功后，触发 `document.dispatchEvent(new Event('workflowComplete'))`
- NodeWorkspace 监听该事件，自动刷新版本列表

---

## 关键模块说明

### NodeWorkspace 组件
- 位置：`frontend/src/components/NodeWorkspace.jsx`
- 包含：ResultTab、ChatTab、ConfigTab、HistoryTab、ImpactTab
- 版本历史下拉：浮动面板，点击遮罩或 ESC 关闭

### ConfigTab 两层配置
- **任务参数**（默认展开）：画质、时长、比例等高频配置
- **智能体设置**（默认折叠）：模型、Temperature、Prompt、Skills
- 智能体配置入口统一在右侧面板，不再使用节点右上角 Edit3 按钮

### 版本历史下拉布局
```
Grid: [60px 版本号] [1fr 时间] [24px 状态图标]
```

### 节点卡片职责
- 节点卡片只保留：拖拽手柄、删除按钮、执行状态、结果摘要
- 智能体配置（模型/Prompt/Skills）移至右侧 NodeWorkspace Config Tab

### 状态管理
- 使用 Zustand store（workflowStore）
- 全局事件：workflowComplete、proposalApplied、proposalRejected

---

## 统一布局（规划/执行）

规划区和执行区共用左侧对话区域，通过 `currentView` 状态切换：

```
左侧面板          中间区域          右侧面板
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Console    │  │              │  │  规划区:      │
│  (共用对话)  │  │  规划:       │  │  ContextPanel │
│              │  │  PlanPreview │  │              │
│              │  │              │  │  执行区:      │
│              │  │  执行:       │  │  NodeWorkspace│
│              │  │  NodeCanvas │  │  (按需展开)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 常见坑和注意事项

### 1. 版本 ID 混淆
- `v.id` = 数据库主键，用于 API 调用
- `v.versionNo` = 用户看到的版本号（v1, v2, v3）
- 传参时一定要确认是哪个

### 2. props 层层传递
- NodeWorkspace 的 props 通过 tabContentMap 传递给各个 Tab
- 修改 props 时注意检查传递链路

### 3. CSS 样式冲突
- 大量使用 CSS 类名，注意命名冲突
- 优先使用组件级别的 CSS 文件

### 4. API 错误处理
- 异步操作要 try-catch
- 注意检查 nodeId 是否变化（取消请求）

---

## Skills 协作流程

### 开发新功能
1. `/ui-ux-pro-max` - UI/UX 设计规范
2. `/frontend-design` - 前端实现
3. `/frontend-code-review` - 前端代码审查
4. `/webapp-testing` - 功能测试

### 独立开发
- 后端开发：`/backend-patterns`
- 前端开发：`/frontend-design`

### 代码审查
- 前端：`/frontend-code-review`
- 后端：`/backend-patterns`

---

## 提交规范

### Commit Message 格式
```
<类型>: <简短描述>

<详细说明（可选）>
```

### 类型
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构
- `ui`: UI 修改
- `chore`: 构建/工具

### 示例
```
fix: 修复版本历史下拉被遮挡的问题

- 改为浮动面板定位
- 添加遮罩层和ESC关闭
- 修复时间对齐
```

---

## 项目结构

```
frontend/
├── src/
│   ├── components/
│   │   ├── NodeWorkspace.jsx      # 节点工作区主组件
│   │   ├── NodeWorkspace/
│   │   │   ├── ConfigTab.jsx      # 配置 Tab（任务参数 + 智能体设置）
│   │   │   ├── HistoryTab.jsx     # 历史 Tab
│   │   │   └── ImpactTab.jsx     # 影响 Tab
│   │   ├── NodeCanvas/
│   │   │   ├── RichAgentNode.jsx  # 节点卡片组件
│   │   │   └── ...
│   │   ├── ChatConversation.jsx  # 对话组件（规划/执行共用）
│   │   ├── Console.jsx            # 左侧面板包装组件
│   │   ├── PlanPreview.jsx       # 规划区方案预览
│   │   ├── ContextPanel.jsx      # 规划区上下文面板
│   │   └── ...
│   ├── stores/
│   │   └── workflowStore.js      # Zustand 状态管理
│   ├── services/
│   │   └── api.js                # API 接口定义
│   └── App.jsx                   # 主应用组件
└── ...
```
