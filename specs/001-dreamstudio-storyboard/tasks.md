# Tasks: DreamStudio 2.0 故事板创作系统

**Input**: Design documents from `/specs/001-dreamstudio-storyboard/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3...)
- Include exact file paths in descriptions

---

## Phase 1: Setup (项目初始化)

**Purpose**: 创建基础目录结构和 CSS 变量系统

- [x] T001 [P] 创建 `frontend/src/styles/` 目录及 CSS 变量文件 `variables.css`
- [x] T002 [P] 创建 `frontend/src/styles/theme-day.css` 浅色主题
- [x] T003 [P] 创建 `frontend/src/styles/theme-night.css` 深色主题
- [x] T004 [P] 创建 `frontend/src/components/Storyboard2/` 目录结构
- [x] T005 [P] 创建 `frontend/src/components/FloatingAssistant/` 目录结构
- [x] T006 [P] 创建 `frontend/src/components/ProjectSelector/` 目录结构
- [x] T007 [P] 创建 `frontend/src/stores/chatStore.js` 对话状态 store 骨架
- [x] T008 [P] 创建 `frontend/src/stores/themeStore.js` 主题状态 store 骨架

---

## Phase 2: Foundational (核心基础设施)

**Purpose**: 必须完成才能开始任何用户故事

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 在 `themeStore.js` 中实现主题切换逻辑（CSS 变量 + localStorage）
- [x] T010 [P] 在 `index.css` 中引入主题 CSS 变量系统
- [x] T011 [P] 在 `App.jsx` 中添加主题状态监听和应用
- [x] T012 [P] 在 `stageStore.js` 中添加阶段类型常量（STAGE_COLORS 等）
- [x] T013 在 `chatStore.js` 中实现对话上下文切换逻辑
- [x] T014 在 `chatStore.js` 中实现浮窗状态管理（位置、大小、吸附）

---

## Phase 3: 用户故事 1 - 小白用户快速创作 (优先级: P1) 🎯 MVP

**Goal**: 用户可以通过对话完成基本创作流程（剧本→角色→分镜→视频）

**Independent Test**: 用户通过对话完成：进入故事板 → 生成角色 → 生成分镜 → 查看视频

### 实现

- [x] T015 [P] [US1] 创建 `Storyboard2/StoryboardMainView.jsx` 故事板主视图骨架
- [x] T016 [P] [US1] 创建 `Storyboard2/StageNavigation.jsx` 阶段导航组件
- [x] T017 [P] [US1] 创建 `Storyboard2/AssetGrid.jsx` 资产网格组件
- [x] T018 [US1] 在 `stageStore.js` 中实现阶段切换和资产列表管理
- [x] T019 [P] [US1] 创建 `Storyboard2/AssetDetailPanel.jsx` 资产详情面板骨架
- [x] T020 [US1] 创建 `Storyboard2/EmptyGuide.jsx` 空白引导组件
- [x] T021 [US1] 在 `App.jsx` 中添加故事板路由和视图切换逻辑
- [x] T022 [US1] 创建 `FloatingAssistant/FloatingAssistant.jsx` 浮窗主组件
- [x] T023 [P] [US1] 创建 `FloatingAssistant/ChatInput.jsx` 输入区组件
- [x] T024 [P] [US1] 创建 `FloatingAssistant/ChatMessage.jsx` 消息展示组件
- [x] T025 [P] [US1] 创建 `FloatingAssistant/ContextHeader.jsx` 上下文标题组件
- [x] T026 [US1] 在浮窗中实现上下文切换（项目级/资产级）
- [x] T027 [US1] 在浮窗中实现消息发送和推荐操作显示
- [x] T028 [US1] 实现浮窗拖动和吸附功能（Framer Motion）
- [x] T029 [US1] 实现浮窗最小化到导航栏功能

**Checkpoint**: 用户可以看到故事板界面，对话助手可以拖动和切换上下文

---

## Phase 4: 用户故事 2 - 进阶用户微调 (优先级: P2)

**Goal**: 用户可以选中资产后通过对话修改

**Independent Test**: 选中角色 → 对话说"把头发改成蓝色" → 角色形象更新

### 实现

- [x] T030 [P] [US2] 在 `AssetGrid.jsx` 中实现资产卡片点击选中
- [x] T031 [P] [US2] 在 `AssetDetailPanel.jsx` 中实现资产详情展示和编辑
- [x] T032 [US2] 在 `stageStore.js` 中实现选中资产状态管理
- [x] T033 [US2] 在 `FloatingAssistant.jsx` 中实现选中资产时显示资产简介
- [x] T034 [US2] 在 `FloatingAssistant.jsx` 中实现根据选中资产切换对话上下文
- [x] T035 [P] [US2] 在 `FloatingAssistant.jsx` 中实现"添加到故事板"按钮逻辑
- [x] T036 [US2] 在 `AssetDetailPanel.jsx` 中实现资源区显示（上传+AI生成）

---

## Phase 5: 用户故事 3 - 技术用户复杂工作流 (优先级: P3)

**Goal**: 用户可以进入画布编辑复杂工作流

**Independent Test**: 点击"工作流编辑" → 进入全屏画布 → 添加节点 → 保存为模板

### 实现

- [x] T037 [P] [US3] 在 `App.jsx` 中实现画布层路由和视图切换
- [x] T038 [P] [US3] 复用现有 `NodeCanvas/` 组件集成到故事板
- [x] T039 [US3] 在画布工具栏添加"返回故事板"按钮
- [x] T040 [US3] 在画布中集成对话助手（无节点选中=全局，有节点=锚定节点）
- [x] T041 [US3] 在 `FloatingAssistant.jsx` 中实现画布内对话逻辑
- [x] T042 [P] [US3] 在画布中实现"测试运行"单个节点功能
- [x] T043 [P] [US3] 在画布中实现"保存为模板"功能
- [x] T044 [US3] 在画布中实现运行结果"替换/新增/取消"选项弹窗

---

## Phase 6: 用户故事 4 - 剧本解析 (优先级: P1)

**Goal**: 用户上传剧本后，AI解析出角色/场景/道具供确认

**Independent Test**: 上传剧本 → AI解析 → 显示角色/场景/道具列表 → 用户确认 → 进入对应阶段

### 实现

- [x] T045 [P] [US4] 创建 `Storyboard2/UploadModal.jsx` 上传弹窗组件
- [x] T046 [US4] 在 `UploadModal.jsx` 中实现文件选择和上传
- [x] T047 [US4] 在 `UploadModal.jsx` 中实现"直接展示/AI处理"选择
- [x] T048 [US4] 创建 `Storyboard2/ScriptParser.jsx` 剧本解析结果显示组件
- [x] T049 [US4] 在 `stageStore.js` 中实现解析结果→阶段资产的转换
- [x] T050 [P] [US4] 在剧本阶段实现"AI解析"按钮和解析结果展示
- [x] T051 [US4] 实现剧本阶段富文本编辑器基础功能

---

## Phase 7: 用户故事 5 - 分镜生成 (优先级: P1)

**Goal**: AI根据剧本/角色/场景/道具自动生成分镜

**Independent Test**: 点击"AI生成分镜" → 显示分镜列表 → 用户微调参数 → 生成视频

### 实现

- [x] T052 [P] [US5] 创建分镜阶段专用资产卡片组件
- [x] T053 [US5] 在 `AssetDetailPanel.jsx` 中实现分镜详情编辑（景别/运镜/时长等）
- [x] T054 [US5] 在分镜阶段实现"AI生成分镜"按钮
- [x] T055 [US5] 在 `AssetDetailPanel.jsx` 中实现关联资产选择器（角色/场景/道具）
- [x] T056 [US5] 实现视频阶段播放器组件集成
- [x] T057 [US5] 实现视频批量导出功能（ZIP）

---

## Phase 8: 用户故事 6 & 7 - 上传资源 (优先级: P2)

**Goal**: 用户可以上传资源并选择AI处理或直接展示

**Independent Test**: 上传图片 → 选择"AI处理" → 显示AI描述 → 资产进入列表

### 实现

- [x] T058 [P] [US6] 在各阶段添加上传入口按钮
- [x] T059 [US6] 复用 `UploadModal.jsx` 支持图片/视频文件上传
- [x] T060 [US6] 在 `UploadModal.jsx` 中实现"直接展示/AI处理"选项
- [x] T061 [US6] 在 `FloatingAssistant.jsx` 中实现文件上传按钮和附件展示
- [x] T062 [US6] 在 `Resource` 类型中实现 `aiProcessed` 和 `aiDescription` 字段

---

## Phase 9: 项目选择和切换 (优先级: P1)

**Goal**: 实现主页、项目选择对话框、顶部项目切换器

**Independent Test**: 点击"开始创作" → 显示项目列表 → 选择项目 → 进入故事板

### 实现

- [x] T063 [P] [US1] 创建 `ProjectSelector/ProjectSelector.jsx` 项目选择对话框
- [x] T064 [US1] 在 `HomePage.jsx` 中简化主页（仅保留介绍+开始创作按钮）
- [x] T065 [US1] 在 `ProjectSelector.jsx` 中实现项目列表展示
- [x] T066 [US1] 在 `ProjectSelector.jsx` 中实现"创建新项目"功能
- [x] T067 [US1] 在 `ProjectSelector.jsx` 中实现选择项目后进入故事板
- [x] T068 [P] [US1] 在故事板顶部导航实现项目名称下拉切换器
- [x] T069 [US1] 在 `projectStore.js` 中实现项目切换逻辑

---

## Phase 10: 影响提示系统 (优先级: P2)

**Goal**: 修改资产时显示下游影响提示

**Independent Test**: 修改角色 → 显示"分镜2,5,7使用该角色，需要重新生成"

### 实现

- [x] T070a [P] [P2] 在 `data-model.md` Asset 接口中添加 `referencedBy` 字段
- [x] T070b [P] [P2] 在 `stageStore.js` 中实现 `addAsset` 时自动建立引用关系
- [x] T070c [P] [P2] 在 `stageStore.js` 中实现 `getImpactedAssets(assetId)` 函数
- [x] T071 [P] [P2] 创建影响提示条组件 `ImpactToast.jsx`
- [x] T072 [US2] 在 `AssetDetailPanel.jsx` 中触发影响提示显示
- [x] T073 [US2] 在影响提示中实现"重新生成"和"忽略"按钮

---

## Phase 11: 模板系统前端 (优先级: P3)

**Goal**: 用户可以发布和选择模板

**Independent Test**: 保存工作流 → 发布为模板 → 在其他项目选择该模板

### 实现

- [x] T074 [P] [P3] 创建模板选择下拉组件 `TemplateSelector.jsx`
- [x] T075 [P] [P3] 在模板选择器中显示系统预设模板
- [x] T076 [P3] 在模板选择器中显示用户创建的模板
- [x] T077 [P3] 在 `workflowStore.js` 中实现"发布为模板"功能
- [x] T078 [P3] 在模板版本变更时通知相关资产用户

---

## Phase 12: Polish & 跨切面问题

**Purpose**: 提升整体质量和体验

- [x] T079 [P] 动画性能优化（检查所有动画使用 transform/opacity）
- [x] T080 [P] 响应式布局检查（最小宽度 1200px）
- [x] T081 [P] 深色主题细节完善（边框、阴影、对比度）
- [x] T082 空状态设计检查（各阶段无数据时显示引导）
- [x] T083 [P] 对话助手浮窗 z-index 层级检查
- [x] T084 [P] 无障碍检查（键盘导航、aria-label）
- [x] T085 记忆用户偏好（浮窗位置、主题选择）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖 - 可以立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1 完成后执行 - BLOCKS 所有用户故事
- **Phase 3-8 (User Stories)**: 依赖 Phase 2 完成后执行
  - US1, US4, US5, US9 可以并行开发（基于不同组件）
  - US2 依赖 US1 完成（需要资产选中功能）
  - US3 依赖 US1 完成（需要故事板基础）
- **Phase 10-11 (Enhancements)**: 依赖核心用户故事完成后
- **Phase 12 (Polish)**: 最后执行

### User Story Dependencies

| 用户故事 | 依赖 | 说明 |
|----------|------|------|
| US1 (快速创作) | Phase 2 | MVP 核心 |
| US2 (微调) | US1 | 需要资产选中 |
| US3 (画布) | US1 | 需要故事板基础 |
| US4 (剧本解析) | Phase 2 | 可与 US1 并行 |
| US5 (分镜生成) | US4 | 需要剧本数据 |
| US6&7 (上传) | US1 | 需要资产基础 |
| US9 (项目选择) | Phase 2 | 可与 US1 并行 |

---

## Suggested MVP Scope

**建议 MVP**: Phase 1 + Phase 2 + Phase 3 (US1) + Phase 9 (项目选择)

实现后可测试：
1. 主页"开始创作" → 项目选择 → 进入故事板
2. 阶段导航切换
3. 对话助手拖动、切换上下文、发送消息
4. 空白故事板引导

---

## Parallel Execution Example

```bash
# Phase 1 Setup tasks can run in parallel:
T001 + T002 + T003 + T004 + T005 + T006 + T007 + T008

# Phase 2 Foundational tasks can run in parallel:
T010 + T011 + T012

# User Story 1 tasks can run in parallel:
T015 + T016 + T017 + T019 + T023 + T024 + T025
```

---

## Notes

- [P] 标记的任务可以并行执行（不同文件，无依赖）
- [Story] 标签将任务映射到特定用户故事以便追踪
- 每个用户故事应该可以独立完成和测试
- 在移动到下一个故事之前验证当前故事
