# DreamStudio 造梦AI

AI驱动的智能电影制作平台。基于节点式可视化工作流，多Agent协作完成从剧本到成片的全流程。

## 技术栈

### 前端
- **框架**: React 18 + Vite
- **动画**: Framer Motion
- **状态管理**: Zustand
- **图标**: Lucide React
- **样式**: CSS Modules / CSS Variables
- ** Markdown渲染**: React Markdown
- **视频处理**: webcut

### 后端
- **框架**: Spring Boot 3.2.0
- **语言**: Java 21
- **持久化**: JPA / Hibernate
- **数据库**: H2 (开发) / MySQL (生产)
- **认证**: JWT

## 项目结构

```
DreamStudio/
├── frontend/                    # 前端源码
│   ├── src/
│   │   ├── components/
│   │   │   ├── NodeCanvas/      # 可视化工作流画布
│   │   │   │   ├── NodeCanvas.jsx      # 画布主体（拖拽、缩放、连线）
│   │   │   │   ├── RichAgentNode.jsx   # 节点组件（状态、输入输出）
│   │   │   │   ├── NodeConnection.jsx  # SVG连接线
│   │   │   │   ├── AgentLibrary.jsx    # 左侧智能体库
│   │   │   │   ├── AgentNode.jsx       # 基础节点组件
│   │   │   │   ├── PipelineTemplates.jsx
│   │   │   │   ├── DraggingConnectionLine.jsx
│   │   │   │   └── index.js
│   │   │   ├── Canvas/          # 画布工具栏
│   │   │   │   ├── CanvasToolbar.jsx
│   │   │   │   ├── CanvasStatusBar.jsx
│   │   │   │   ├── FullscreenToolbar.jsx
│   │   │   │   ├── SaveTemplateDialog.jsx
│   │   │   │   └── index.js
│   │   │   ├── Console.jsx      # 左侧面板（对话/日志）
│   │   │   ├── ChatConversation.jsx  # 对话组件
│   │   │   ├── AssetPanel/      # 右侧资产面板
│   │   │   ├── HomePage.jsx    # 首页
│   │   │   ├── AuthModal/       # 登录/注册弹窗
│   │   │   ├── SkillMarket/     # Skill市场
│   │   │   ├── VideoEditor/     # 视频编辑器
│   │   │   ├── ProjectCard.jsx  # 项目卡片
│   │   │   ├── Toast/           # 提示组件
│   │   │   ├── Modal.jsx        # 通用弹窗
│   │   │   ├── ConfirmDialog/   # 确认对话框
│   │   │   └── ErrorBoundary.jsx
│   │   ├── services/
│   │   │   └── api.js           # API调用封装（含SSE）
│   │   ├── stores/
│   │   │   ├── index.js
│   │   │   ├── workflowStore.js  # 画布状态（节点、连线、运行状态）
│   │   │   ├── projectStore.js  # 项目状态（版本、配置）
│   │   │   └── uiStore.js       # UI状态（面板折叠、弹窗）
│   │   ├── constants/
│   │   │   └── ComponentType.js  # 节点类型常量
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── errorHandler.js
│   │   │   └── sseParser.js
│   │   ├── App.jsx              # 根组件
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # 后端源码
│   ├── src/main/java/com/dream/studio/
│   │   ├── controller/          # REST接口
│   │   │   ├── AuthController.java       # 用户认证
│   │   │   ├── HomePageController.java   # 项目管理
│   │   │   ├── WorkSpaceController.java  # 工作流执行
│   │   │   ├── WorkflowController.java  # 工作流API
│   │   │   └── TeamController.java       # 团队/模板
│   │   ├── service/             # 业务逻辑
│   │   │   ├── ChatService.java
│   │   │   ├── WorkflowService.java
│   │   │   ├── ExecutionService.java
│   │   │   ├── HomePageService.java
│   │   │   ├── UserService.java
│   │   │   └── UpstreamAiClient.java    # 上游AI服务调用
│   │   ├── entity/              # JPA实体
│   │   ├── repository/          # 数据访问
│   │   ├── dto/                # 数据传输对象
│   │   ├── config/             # 配置类
│   │   ├── filter/             # 过滤器（JWT认证）
│   │   └── exception/           # 异常处理
│   ├── pom.xml
│   └── 上游服务接口文档.md
│
├── CLAUDE.md                    # 项目规范
└── README.md
```

## 核心概念

### 节点类型 (Agent)

| Type | 名称 | 功能 |
|------|------|------|
| `producer` | 资深影视制片人 | 项目立项，可行性分析 |
| `content` | 金牌编剧 | 剧本创作（分集分场景） |
| `visual` | 概念美术总监 | 角色/场景/道具设计 |
| `director` | 分镜导演 | 分镜脚本生成 |
| `technical` | 视频提示词工程师 | 视频Prompt优化 |
| `videoGen` | 视频生成 | 调用模型生成视频 |
| `videoEditor` | 视频剪辑 | 剪辑成片 |

### 工作台布局

```
┌─────────────────────────────────────────────────────────┐
│  Header: 项目名 / 版本切换 / 保存 / 新建 / 导航          │
├────────────┬────────────────────────────┬──────────────┤
│            │                            │              │
│  Console   │      NodeCanvas            │   Asset      │
│  (左侧)    │      (中心画布)             │   Panel      │
│            │                            │   (右侧)     │
│  - 智能助理│  - 节点拖拽/缩放/连线       │              │
│  - 对话历史│  - 工作流执行可视化          │  - 资产浏览  │
│  - 工作流  │  - 自动跟踪运行节点          │  - 导出功能  │
│    创建    │                            │              │
├────────────┴────────────────────────────┴──────────────┤
│  StatusBar: 缩放比例 / 节点数 / 连线数                   │
└─────────────────────────────────────────────────────────┘
```

### 工作流执行

工作流通过DAG定义节点和依赖关系，执行时通过SSE流式返回事件：

| 事件类型 | 说明 |
|----------|------|
| `init` | 初始化，返回executionId |
| `node_status` / `status` | 节点状态变化（running/completed） |
| `thinking` | 思考过程流式输出 |
| `result` | 最终结果流式输出 |
| `data` | 业务数据（图片、视频等） |
| `complete` | 执行完成 |
| `error` | 执行错误 |

### 版本管理

- 每个项目有多个版本，支持历史版本查看和恢复
- 版本信息包含完整的画布配置（节点、连线、视口位置）

## 快速启动

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`，Vite 会自动代理 `/api` 请求到后端。

### 后端

```bash
cd backend
mvn spring-boot:run
```

访问 `http://localhost:8080`

### 开发数据库

- H2 控制台：`http://localhost:8080/h2-console`
- JDBC URL：`jdbc:h2:mem:aimanjudb`

生产环境切换 MySQL，修改 `application.yml`。

## API 代理

前端所有 `/api/*` 请求通过 Vite 代理到后端：

| 前端路径 | 后端路径 |
|----------|----------|
| `/api/*` | `http://localhost:8080/api/*` |

## 接口文档

- Swagger UI（后端启动后访问）：`http://localhost:8080/swagger-ui.html`
- 上游服务接口文档：`backend/上游服务接口文档.md`

## 状态管理

项目使用 Zustand 管理状态，分为三个Store：

| Store | 职责 |
|-------|------|
| `workflowStore` | 画布数据（nodes, connections）、运行状态 |
| `projectStore` | 项目信息（ID、名称、版本） |
| `uiStore` | UI状态（面板宽度、弹窗、模态框） |

## 使用文档

### 首页操作

#### 登录/注册
1. 点击右上角「登录 / 注册」按钮
2. 支持账号密码登录和注册
3. 注册需要验证码

#### 创建项目
1. **方式一**：在搜索框输入创意想法，点击「生成」按钮，一键创建项目并进入工作台
2. **方式二**：点击「工作台」按钮，直接进入空白工作台
3. **方式三**：从案例演示选择一个模板，点击「使用此模板创建」

#### 查看和管理项目
- 登录后显示「最近项目」列表
- 点击项目卡片进入对应的工作台
- 支持分页查看所有项目

---

### 工作台操作

#### 智能体库（添加节点）

1. 点击顶部工具栏的「+」按钮，打开智能体库
2. 支持分类浏览：
   - **官方认证**：系统预置的智能体
   - **我的私有**：用户自定义的智能体
3. 添加方式：
   - **拖拽**：拖动智能体卡片到画布上
   - **点击**：点击智能体卡片，自动添加到画布中心

#### 节点操作

| 操作 | 说明 |
|------|------|
| 添加节点 | 从智能体库拖拽或点击添加到画布 |
| 移动节点 | 鼠标拖拽节点 |
| 删除节点 | 选中节点后按 Delete 键，或点击删除按钮 |
| 编辑节点 | 双击节点打开设置面板 |
| 连接节点 | 从输出端口拖拽到另一个节点的输入端口 |
| 删除连线 | 选中连线后按 Delete 键 |
| 缩放画布 | 鼠标滚轮（Mac触控板双指缩放） |
| 拖动画布 | 点击空白区域拖拽 |

#### 运行工作流

1. 点击顶部工具栏的「运行」按钮
2. 工作流开始执行，节点状态变化：
   - `idle` → 空闲（初始状态）
   - `running` → 运行中（高亮显示）
   - `completed` → 已完成（显示结果）
3. 运行过程中：
   - 画布自动跟踪当前运行的节点
   - 用户手动滚动画布会退出自动跟踪模式
   - 思考过程和结果实时流式显示在节点上

#### 全屏模式
- 点击「全屏」按钮进入全屏工作台
- ESC 键退出全屏

---

### 左侧面板 - Console（控制台）

#### 智能助理对话
1. 在输入框输入消息
2. 发送后会调用 AI 进行对话
3. 支持 markdown 格式显示
4. 支持复制回答内容

#### 工作流创建
1. 通过对话描述需求
2. AI 会自动生成工作流
3. 生成的工作流节点会同步显示在画布上

#### 功能特点
- 对话历史自动保存
- 支持图片预览和视频播放
- 流式输出（打字机效果）

---

### 右侧面板 - Asset（资产面板）

#### 资产类型
- **剧本**：编剧节点产出的剧本内容
- **概念图**：美术节点产出的图片
- **分镜**：导演节点产出的分镜脚本
- **视频**：最终生成的视频成品

#### 资产操作
- 点击资产卡片查看详情
- 支持图片放大预览
- 支持视频播放
- 导出资产到本地

---

### 版本管理

#### 查看历史版本
1. 点击顶部版本下拉框
2. 查看所有历史版本列表
3. 点击版本可切换查看

#### 恢复版本
1. 在版本列表点击目标版本
2. 画布会加载该版本的数据

#### 删除版本
1. hover 版本条目显示删除按钮
2. 点击删除按钮确认操作

---

### 项目管理

#### 保存项目
- 点击「保存」按钮
- 自动保存当前画布配置（节点、连线、视口位置）
- 未保存的修改会有圆点提示

#### 新建项目
- 点击「新建」按钮
- 如有未保存的修改，提示保存或放弃

#### 编辑项目名称
- 点击项目名称旁边的编辑图标
- 输入新名称后按 Enter 保存

---

### 画布快捷键

| 快捷键 | 功能 |
|--------|------|
| `Delete` / `Backspace` | 删除选中的节点或连线 |
| `Escape` | 退出全屏 / 取消连线 |
| 鼠标滚轮 | 缩放画布 |
| 双指缩放 (Mac) | 缩放画布 |

---

### 常见问题

#### Q: 画布为空时提示"已退出自动跟踪模式"？
A: 这是正常行为，只有在工作流运行过程中手动干预画布时才会显示该提示。

#### Q: 如何导入外部模板？
A: 在首页案例演示中点击模板，选择「使用此模板创建」即可。

#### Q: 工作流执行失败怎么办？
A: 检查后端服务是否正常运行，查看浏览器控制台错误日志。

---

## License

MIT
