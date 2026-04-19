# Implementation Plan: DreamStudio 2.0 故事板创作系统

**Branch**: `001-storyboard-v2` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dreamstudio-storyboard/spec.md`

## Summary

DreamStudio 2.0 前端重构，实现AI驱动的结构化创作工具支持剧本到视频的完整管线。前端基于 React 18+ + Zustand + Framer Motion，当前完成主题系统、项目选择对话框、故事板主视图、空白引导组件。

## Technical Context

**Language/Version**: JavaScript (ES2022+), React 18+
**Primary Dependencies**: Zustand (状态管理), Framer Motion (动画), React Router v6 (路由), Lucide React (图标)
**Storage**: localStorage (主题/偏好), 后端 REST API (项目数据)
**Testing**: N/A (纯前端展示层)
**Target Platform**: Web (桌面浏览器)
**Project Type**: React 单页应用 (SPA)
**Performance Goals**: 页面切换流畅，动画60fps
**Constraints**: 无严重性能约束
**Scale/Scope**: 6个创作阶段 (剧本/角色/场景/道具/分镜/视频)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| 方案先行 | ✅ PASS | 所有重构前先出方案用户review |
| 清晰沟通 | ✅ PASS | 遇到模糊需求先提问确认 |
| 小步快走 | ✅ PASS | 每次只改一个功能点 |
| 追踪影响 | ✅ PASS | 每次改动说明影响范围 |

## Project Structure

### Documentation (this feature)

```text
specs/001-dreamstudio-storyboard/
├── plan.md              # 本文件
├── research.md          # 架构研究
├── data-model.md        # 数据模型
├── quickstart.md        # 快速入门
├── tasks.md             # 任务清单
└── spec.md              # 功能规格
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Storyboard/     # 故事板组件集
│   │   │   ├── StoryboardMainView.jsx
│   │   │   ├── StageNavigation.jsx
│   │   │   ├── AssetGrid.jsx
│   │   │   ├── AssetDetailPanel.jsx
│   │   │   ├── EmptyGuide.jsx
│   │   │   ├── UploadModal.jsx
│   │   │   └── ScriptParser.jsx
│   │   ├── FloatingAssistant/  # 浮窗助手
│   │   ├── ProjectSelector/    # 项目选择
│   │   ├── HomePage/          # 主页
│   │   ├── TopBar/            # 顶部栏
│   │   └── Canvas/            # 画布
│   ├── stores/
│   │   ├── projectStore.js
│   │   ├── stageStore.js
│   │   ├── workflowStore.js
│   │   ├── chatStore.js
│   │   └── themeStore.js
│   └── styles/
│       ├── variables.css
│       ├── theme-day.css
│       └── theme-night.css
```

**Structure Decision**: 前端纯展示层，Zustand 管理状态，Framer Motion 处理动画，组件化架构清晰。

## 已完成工作

### Phase 1-4: 核心功能完成 ✅

| 任务 | 状态 | 说明 |
|------|------|------|
| T001-T008 | ✅ | 目录结构和CSS变量系统 |
| T009-T014 | ✅ | 主题系统、对话状态管理 |
| T015-T029 | ✅ | 故事板主视图、阶段导航、浮窗助手 |
| T030-T039 | ✅ | 资产选中、详情面板、画布路由 |

## 当前状态

### 已实现功能
1. **主题系统**: day/night 两种主题，localStorage 持久化
2. **项目选择对话框**: 4种状态（创建/加载/有项目/空状态），支持搜索
3. **故事板主视图**: 6阶段导航、资产网格、详情面板
4. **空白引导**: 上传剧本/从空白开始两种入口
5. **上传弹窗**: 支持文件上传和粘贴文本两种模式
6. **浮窗助手**: 拖动、最小化、上下文切换

### 待完善功能 (根据 UI review)
- [ ] 剧本阶段富文本编辑
- [ ] AI解析按钮交互
- [ ] 角色/场景/道具阶段 AI 生成流程
- [ ] 分镜阶段视频生成和导出
- [ ] 画布编辑器完整功能

## Complexity Tracking

> 无复杂度违规

---

**Note**: `/speckit.plan` 在 Phase 1 设计后停止。后续任务执行请使用 `/speckit.tasks` 生成详细任务清单。
