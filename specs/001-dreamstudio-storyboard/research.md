# Research: DreamStudio 2.0 前端架构研究

**Date**: 2026-04-17
**Feature**: DreamStudio 2.0 故事板创作系统

---

## 1. 现有架构分析

### 1.1 技术栈

| 技术 | 版本/现状 | 说明 |
|------|-----------|------|
| React | 18+ | 核心框架 |
| Vite | 新项目已配置 | 构建工具 |
| Zustand | 已使用 | 状态管理 |
| Framer Motion | 已使用 | 动画库 |
| Lucide React | 已使用 | 图标库 |
| NodeCanvas | 已存在 | 可复用的画布组件 |

### 1.2 现有 Stores

| Store | 职责 | 可复用性 |
|-------|------|----------|
| `projectStore` | 项目元数据 | ✅ 扩展 |
| `stageStore` | 分镜阶段状态 | ✅ 直接复用 |
| `workflowStore` | 画布节点/连接 | ✅ 画布层复用 |
| `uiStore` | UI状态 | ✅ 扩展 |
| `subgraphStore` | 子图管理 | ✅ 子图功能复用 |

### 1.3 现有组件

| 组件 | 状态 | 说明 |
|------|------|------|
| `HomePage` | 存在 | 需改造 |
| `Console` | 存在 | 现有对话组件 |
| `NodeCanvas` | 存在 | 可直接复用 |
| `NodeWorkspace` | 存在 | 节点属性面板 |
| `Storyboard2/` | 存在 | 需分析是否可用 |

### 1.4 现有 API

| API | 状态 | 说明 |
|-----|------|------|
| `homePageApi` | 存在 | 项目CRUD |
| `chatApi` | 存在 | 聊天历史 |
| `workflowApi` | 存在 | 工作流执行 |
| `agentApi` | 存在 | 智能体 |
| `nodeVersionApi` | 存在 | 节点版本 |

---

## 2. 架构决策

### 2.1 主题系统

**决策**: CSS 变量 + themeStore

**理由**:
- CSS 变量支持运行时切换
- 与 Framer Motion 配合良好
- 无需额外依赖

**实现方案**:
```css
:root {
  --color-primary: #6366F1;
  --color-bg: #FAFAFA;
  --color-surface: #FFFFFF;
}

[data-theme="night"] {
  --color-primary: #818CF8;
  --color-bg: #0F0F12;
  --color-surface: #1A1A1F;
}
```

### 2.2 浮窗拖动

**决策**: Framer Motion + transform

**理由**:
- 已使用 Framer Motion
- transform 性能最佳（GPU加速）
- 配合 drag 控制符简洁

**实现方案**:
```jsx
<motion.div
  drag
  style={{ x, y }}
  dragMomentum={false}
  onDragEnd={(e, info) => {
    // 计算吸附逻辑
  }}
>
```

### 2.3 对话上下文

**决策**: chatStore 独立管理

**理由**:
- 对话状态与项目/资产/节点关联复杂
- 需要消息历史持久化
- 上下文切换需要状态隔离

**Store 结构**:
```typescript
interface ChatState {
  currentSession: ChatSession | null;
  sessions: Record<string, ChatSession>;
  // 上下文切换
  switchContext: (type: ContextType, id?: string) => void;
}
```

### 2.4 组件目录

**决策**: 新增 Storyboard2/ + FloatingAssistant/

**理由**:
- 与现有 Storyboard/ 区隔
- 避免历史包袱
- 职责清晰

---

## 3. 技术风险

| 风险 | 影响 | 缓解方案 |
|------|------|----------|
| NodeCanvas 耦合 | 画布与故事板数据同步 | 通过 workflowStore 共享状态 |
| 主题切换闪烁 | 用户体验问题 | CSS 变量 + 预加载 |
| 大量状态更新 | 性能问题 | Zustand selector 优化 |

---

## 4. 结论

现有架构基本满足需求，主要工作为：
1. 扩展现有 stores
2. 新增 Storyboard2/ 和 FloatingAssistant/
3. 改造 HomePage
4. 实现主题系统
