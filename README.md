# DreamStudio 造梦AI

> AI驱动的智能电影制作平台。基于分镜工作台，多Agent协作完成从剧本到成片的全流程。

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Java 21](https://img.shields.io/badge/Java-21-007396?logo=java)](https://www.oracle.com/java/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-FF6B6B?logo=mit)](LICENSE)

## ✨ Features

- **智能剧本解析** — 上传或输入剧本，AI自动识别角色、场景、道具
- **多阶段分镜工作台** — 剧本 → 角色 → 场景 → 道具 → 分镜 → 视频 → 剪辑，7阶段完整管线
- **AI对话式生成** — 自然语言描述需求，AI辅助创作各阶段资产
- **资产版本管理** — 每个项目支持多版本，自动保存历史版本
- **可视化画布** — 节点式工作流编辑器，自由搭建复杂创作流程
- **多项目管理** — 支持多个项目，快速切换
- **主题切换** — 支持浅色/深色主题，一键切换

## 📁 Project Structure

```
DreamStudio/
├── frontend/                    # React 18 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── Storyboard/      # 分镜工作台
│   │   │   │   ├── stages/            # 多阶段视图
│   │   │   │   │   ├── ScriptStageView.jsx   # 剧本阶段
│   │   │   │   │   ├── AssetStageView.jsx    # 角色/场景/道具阶段
│   │   │   │   │   ├── VideoStageView.jsx    # 视频阶段
│   │   │   │   │   └── ClipStageView.jsx     # 剪辑阶段
│   │   │   │   ├── StoryboardMainView.jsx    # 分镜主视图
│   │   │   │   ├── ScriptAssistantPanel.jsx  # AI脚本助手
│   │   │   │   ├── ScriptParser.jsx          # 剧本解析器
│   │   │   │   ├── AssetDetailPanel.jsx      # 资产详情面板
│   │   │   │   ├── AssetAIDialog.jsx         # 资产AI生成弹窗
│   │   │   │   └── StageNavigation.jsx        # 阶段导航
│   │   │   ├── TopBar/           # 顶部导航栏
│   │   │   ├── NodeCanvas/       # 可视化工作流画布
│   │   │   ├── Console.jsx       # 左侧对话控制台
│   │   │   ├── ChatConversation.jsx  # 对话组件
│   │   │   └── ...
│   │   ├── stores/               # Zustand 状态管理
│   │   │   ├── projectStore.js   # 项目状态
│   │   │   ├── stageStore.js     # 分镜阶段状态
│   │   │   ├── workflowStore.js # 画布工作流状态
│   │   │   ├── chatStore.js     # 对话状态
│   │   │   ├── themeStore.js    # 主题状态
│   │   │   └── uiStore.js       # UI状态
│   │   ├── services/api.js       # API 调用封装
│   │   └── App.jsx
│   └── vite.config.js
│
├── backend/                     # Spring Boot 3.2 后端
│   └── src/main/java/com/dream/studio/
│       ├── controller/          # REST API 控制器
│       │   ├── AuthController.java      # 用户认证
│       │   ├── HomePageController.java  # 项目管理
│       │   ├── AdeptifyController.java # AI生成
│       │   ├── AiController.java       # AI对话
│       │   ├── ChatSessionController.java  # 对话会话
│       │   ├── NodeController.java      # 节点管理
│       │   ├── PlanController.java      # 计划管理
│       │   ├── TeamController.java      # 团队/模板
│       │   ├── WorkflowController.java  # 工作流
│       │   └── WorkSpaceController.java # 工作空间
│       ├── service/             # 业务逻辑层
│       ├── entity/              # JPA 实体
│       ├── repository/          # 数据访问层
│       ├── dto/                 # 数据传输对象
│       ├── config/              # 配置类
│       ├── filter/              # 过滤器 (JWT)
│       └── exception/           # 异常处理
│
├── specs/                       # 需求规格文档
│   └── 001-dreamstudio-storyboard/
│       └── spec.md
│
├── CLAUDE.md                    # 项目开发规范
└── README.md
```

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- Java 21+
- Maven 3.8+

### Install Dependencies

```bash
make install
```

### Start Services

```bash
make start        # 同时启动前后端
make stop         # 停止所有服务
make status       # 查看服务状态
# 或单独启动
make backend      # 仅后端 (http://localhost:8080)
make dev          # 仅前端 (http://localhost:5173)
```

访问 `http://localhost:5173`，Vite 开发服务器会自动代理 `/api/*` 请求到后端。

### Development Database

- H2 控制台: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:aimanjudb`
- 默认用户名: `sa`，密码为空

> 生产环境切换 MySQL，修改 `backend/src/main/resources/application.yml`

## 📖 Storyboard Workflow

分镜工作台是 DreamStudio 的核心创作界面，用户通过以下阶段完成从剧本到成片的创作：

```
剧本 → 角色 → 场景 → 道具 → 分镜 → 视频 → 剪辑
```

### Stage Navigation

| Stage | Description |
|-------|-------------|
| 剧本 | 上传或编写剧本，支持AI解析提取角色/场景/道具 |
| 角色 | 管理角色资产，AI生成角色形象描述 |
| 场景 | 管理场景资产，AI生成场景概念图 |
| 道具 | 管理道具资产，AI生成道具设计 |
| 分镜 | 生成镜头分镜，包含景别、运镜、时长等参数 |
| 视频 | 根据分镜参数生成视频片段 |
| 剪辑 | 将视频片段组装成完整成片 |

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/send-code` | 发送验证码 |

### Project Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | 获取项目列表 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/{id}` | 获取项目详情 |
| PUT | `/api/projects/{id}` | 更新项目 |
| GET | `/api/projects/{id}/versions` | 获取版本历史 |

### AI Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/adeptify/generate` | AI生成资产 |
| POST | `/api/ai/chat` | AI对话 |
| POST | `/api/ai/parse-script` | 解析剧本 |

### Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | 获取工作流列表 |
| POST | `/api/workflows` | 创建工作流 |
| POST | `/api/workflows/run` | 运行工作流 |

Swagger UI: `http://localhost:8080/swagger-ui.html`

## 🏗️ Architecture

### Frontend State Management (Zustand)

```
projectStore      → 项目信息 (ID, 名称, 版本)
stageStore        → 当前阶段、阶段数据
workflowStore     → 画布节点、连线、运行状态
chatStore         → 对话消息、会话
themeStore        → 主题偏好 (localStorage 持久化)
uiStore           → UI状态 (面板折叠、弹窗)
```

### Backend Layer

```
Controller → Service → Repository → Database
              ↓
         UpstreamAiClient (调用外部AI服务)
```

## ⚙️ Configuration

### Frontend Environment

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Backend Application Properties

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:mem:aimanjudb  # 开发环境
    # url: jdbc:mysql://localhost:3306/dreamstudio  # 生产环境
  h2:
    console:
      enabled: true
  jpa:
    show-sql: false
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.
