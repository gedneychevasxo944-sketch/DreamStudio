# DreamStudio 开发规范

## 技术栈

### Frontend (001-storyboard-v2)
- **JavaScript (ES2022+)**, React 18 + Vite
- **Zustand** 状态管理
- **Framer Motion** 动画
- **React Router v6** 路由
- **CSS Modules / CSS Variables**, Lucide React 图标
- **localStorage** 用户偏好/主题持久化
- 后端 REST API — 前端纯展示层

### Backend
- **Spring Boot 3.2.0**, Java 21
- **JPA / Hibernate** 持久化
- **H2** (开发) / **MySQL** (生产)
- **JWT** 认证

## 项目分支

| Branch | Description |
|--------|-------------|
| `main` | 基础架构 |
| `001-storyboard-v2` | 分镜工作台重构 — 剧本解析、资产AI生成、多阶段流转 |

## 开发约定

### Frontend
- 组件文件结构: `ComponentName.jsx` + `ComponentName.css` (同目录)
- Store 使用 Zustand，状态变更通过 set 函数
- 主题通过 `themeStore` + CSS 变量管理，`data-theme` 属性控制
- API 调用统一在 `services/api.js`，使用 async/await

### Backend
- Controller → Service → Repository 分层
- DTO 用于前后端数据交换
- Service 处理业务逻辑，Repository 处理数据访问
- 异常通过 `exception/` 目录下的自定义异常类处理

## 最近变更 (001-storyboard-v2)

- 新增分镜工作台 `Storyboard/` 组件及 `stages/` 多阶段视图
- 新增 `stageStore` 管理分镜阶段状态
- 新增 `ScriptAssistantPanel` AI脚本助手面板
- 新增 `AssetStageView` 资产阶段视图（角色/场景/道具）
- 新增 `ScriptStageView` 剧本阶段视图
- 新增 `AssetAIDialog` 资产AI生成弹窗
- 重构 `ChatConversation` 对话组件
- 新增 `AdeptifyService` / `AdeptifyController` AI生成服务
