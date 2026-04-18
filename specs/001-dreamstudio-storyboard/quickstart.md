# Quickstart: DreamStudio 2.0 前端开发

**Date**: 2026-04-17
**Feature**: DreamStudio 2.0 故事板创作系统

---

## 1. 开发环境

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 查看应用。

---

## 2. 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18+ | 核心框架 |
| Vite | 5+ | 构建工具 |
| Zustand | 4+ | 状态管理 |
| Framer Motion | 11+ | 动画库 |
| Lucide React | 0.4+ | 图标库 |

---

## 3. 目录结构

```text
frontend/src/
├── components/
│   ├── Storyboard2/          # 故事板2.0（新）
│   ├── FloatingAssistant/    # 对话助手浮窗（新）
│   ├── ProjectSelector/      # 项目选择（新）
│   ├── NodeCanvas/           # 画布层（复用）
│   └── ...
├── stores/
│   ├── projectStore.js       # 项目状态
│   ├── stageStore.js         # 阶段状态
│   ├── chatStore.js          # 对话状态（新）
│   └── themeStore.js         # 主题状态（新）
├── styles/
│   ├── variables.css         # CSS变量
│   ├── theme-day.css         # 浅色主题
│   └── theme-night.css       # 深色主题
└── App.jsx                  # 主应用
```

---

## 4. 新增依赖

无需新增核心依赖，使用现有技术栈。

---

## 5. 主题系统使用

```jsx
import { useThemeStore } from './stores/themeStore';

// 在组件中使用
function ThemeToggle() {
  const { mode, toggle } = useThemeStore();
  return <button onClick={toggle}>切换主题</button>;
}
```

```css
/* 在 CSS 中使用 */
.button {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
```

---

## 6. 对话助手使用

```jsx
import { useChatStore } from './stores/chatStore';

// 在组件中切换上下文
function AssetCard({ asset }) {
  const { switchContext } = useChatStore();

  const handleClick = () => {
    switchContext('asset', asset.id, asset.name);
  };

  return <div onClick={handleClick}>{asset.name}</div>;
}
```

---

## 7. 阶段导航使用

```jsx
import { useStageStore, STAGES, STAGE_LABELS } from './stores/stageStore';

function StageNav() {
  const { currentStage, setCurrentStage } = useStageStore();

  return (
    <div className="stage-nav">
      {STAGES.map(stage => (
        <button
          key={stage}
          className={currentStage === stage ? 'active' : ''}
          onClick={() => setCurrentStage(stage)}
        >
          {STAGE_LABELS[stage]}
        </button>
      ))}
    </div>
  );
}
```

---

## 8. 常用命令

```bash
# 开发
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

---

## 9. 动画性能注意

- 只使用 `transform` 和 `opacity` 做动画
- 使用 `will-change` 提示浏览器优化
- 避免动画 `width/height/top/left`
- 拖动使用 `transform: translate()`

```jsx
// 好：性能最佳
<motion.div
  drag
  style={{ x, y }}
  transition={{ duration: 0.2 }}
>

// 不好：触发 layout
<motion.div
  drag
  style={{ left: x, top: y }}
>
```

---

## 10. Mock 数据

在 `mock/` 目录添加测试数据：

```javascript
// mock/stagesMock.js
export const mockAssets = {
  script: [
    { id: '1', name: '第一幕', type: 'script', content: { type: 'text', text: '...' } },
  ],
  character: [
    { id: '2', name: '红发女', type: 'character', content: { type: 'image', url: '...' } },
  ],
  // ...
};
```

---

## 11. 调试

- React DevTools: 状态检查
- Framer Motion DevTools: 动画调试
- Chrome DevTools Performance: 性能分析

---

## 12. 下一步

1. 运行 `npm run dev` 启动开发服务器
2. 查看 `src/components/Storyboard2/` 开始开发
3. 参考 `design/ui-ux-spec.md` 实现 UI
