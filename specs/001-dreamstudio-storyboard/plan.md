# Implementation Plan: DreamStudio 2.0 故事板创作系统

**Branch**: `001-storyboard-v2` | **Date**: 2026-04-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dreamstudio-storyboard/spec.md`

## Summary

DreamStudio 2.0 是一个AI驱动的结构化创作工具，支持用户从剧本到视频的完整管线。前端基于 React + Zustand，采用单页应用架构，故事板驱动的6阶段创作流程，对话助手通过全局浮窗提供 AI 交互能力。

## Technical Context

**Language/Version**: JavaScript (ES2022+), React 18+
**Primary Dependencies**: Zustand (状态管理), Framer Motion (动画), React Router v6 (路由)
**Storage**: localStorage (用户偏好/主题), 后端 REST API (项目数据) — 前端纯展示层
**Testing**: 手动功能测试为主，前端单元测试 (Vitest) 可选
**Target Platform**: Web (Chrome/Firefox/Safari 最新版)，响应式最小宽度 1200px
**Project Type**: 单页应用 (SPA) / 前端模块
**Performance Goals**: UI 响应 <100ms，动画帧率 60fps (<16ms/帧)
**Constraints**: 移动端 v1 不支持，需 IE11 以外现代浏览器
**Scale/Scope**: 单用户，100+ 资产/项目，中等复杂度 UI 状态

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| 一、方案先行 | ✅ | plan.md 本文件为方案，所有代码修改前出方案 |
| 二、清晰沟通 | ✅ | 理解需求后提问确认，不猜测 |
| 三、小步快走 | ✅ | Phase 1-12 分阶段实施，每阶段可独立测试 |
| 四、追踪影响 | ✅ | 每个修改说明影响范围，影响提示系统已有 FR |

**结论**: 无需额外 GATE，所有原则均已满足。

## Project Structure

### Documentation (this feature)

```
specs/001-dreamstudio-storyboard/
├── plan.md              # 本文件
├── research.md          # 背景研究（Phase 0 输出）
├── data-model.md        # 数据模型定义
├── quickstart.md        # 快速开始指南
├── tasks.md             # 任务清单
└── checklists/          # 验收检查清单
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/           # React 组件
│   │   ├── Storyboard2/      # 故事板主视图（含6阶段）
│   │   ├── FloatingAssistant/ # 对话助手浮窗
│   │   ├── ProjectSelector/  # 项目选择对话框
│   │   ├── TemplateSelector/ # 模板选择器
│   │   ├── NodeCanvas/       # 画布编辑器（复用）
│   │   ├── Canvas/           # 旧版画布（兼容）
│   │   ├── HomePage/         # 主页
│   │   ├── ChatConversation/ # 对话列表
│   │   └── TopBar/           # 顶部导航栏
│   ├── stores/               # Zustand 状态管理
│   │   ├── projectStore.js  # 项目状态
│   │   ├── stageStore.js     # 阶段状态
│   │   ├── workflowStore.js  # 工作流状态
│   │   ├── chatStore.js      # 对话状态
│   │   └── themeStore.js    # 主题状态
│   ├── styles/              # CSS 样式
│   │   ├── variables.css     # CSS 变量
│   │   ├── theme-day.css    # 浅色主题
│   │   └── theme-night.css  # 深色主题
│   ├── utils/               # 工具函数
│   │   └── eventBus.js      # 全局事件总线
│   ├── App.jsx              # 根组件
│   └── index.css            # 全局样式
```

**Structure Decision**: 选择 Option 2 (Web application) — 前端 SPA + 后端 API 分离架构。现有 `frontend/` 目录结构保持不变，新增组件按上述结构组织。

## Phase 0: Research (已验证)

以下技术决策已在 Phase 0 研究中确认：

### 技术选型

| 决策 | 选择 | 理由 |
|------|------|------|
| 状态管理 | Zustand | 轻量、TypeScript 友好、章程推荐 |
| 动画库 | Framer Motion | 动画性能优（transform/opacity），章程要求 |
| 路由 | React Router v6 | 社区标准 |
| 主题系统 | CSS 变量 | 支持运行时切换主题，章程要求 |
| 全局通信 | eventBus | Zustand store 跨组件通信，章程推荐 |

### 无需澄清的决策

- 模板自动选择 → 委托给 AI 系统，本项目只做接口调用
- 视频导出格式 → ZIP 打包，具体实现待后端确认
- 资产依赖追踪 → 通过 `referencedBy` 字段实现（见 data-model.md）

## Phase 1: Design

已输出以下文档：

- `data-model.md` — 完整 TypeScript 类型定义 + Zustand Store 接口
- `quickstart.md` — 开发者快速开始指南
- `research.md` — 技术调研背景

### 架构关键决策

1. **对话上下文切换**: 通过 `chatStore.switchContext()` 实现，基于 `contextType` (project/asset/workflow/node) 决定对话范围
2. **浮窗状态持久化**: 位置/大小/吸附状态存 localStorage，key: `floatingAssistantPrefs`
3. **资产依赖追踪**: `Asset.referencedBy` 数组，修改资产时查询下游影响
4. **主题切换**: CSS 变量覆盖 + `data-theme` 属性 + localStorage 持久化

## Complexity Tracking

> 本项目无架构违规，无需追踪。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 无 | — | — |

---

**Generated**: 2026-04-18 | **Plan Version**: 1.0
