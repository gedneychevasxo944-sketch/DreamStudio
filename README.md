# DreamStudio 造梦AI

AI驱动的智能电影制作平台。基于节点式可视化工作流，多Agent协作完成从剧本到成片的全流程。

## 技术栈

**前端**
- React 18 + Vite
- Framer Motion (动画)
- Lucide React (图标)

**后端**
- Spring Boot 3.2.0
- Java 21
- JPA/Hibernate (H2 开发环境 / MySQL 生产环境)

## 项目结构

```
DreamStudio/
├── src/                          # 前端源码
│   ├── components/
│   │   ├── NodeCanvas/           # 可视化工作流编辑器
│   │   │   ├── NodeCanvas.jsx    # 画布（拖拽、缩放）
│   │   │   ├── RichAgentNode.jsx # 节点组件
│   │   │   ├── NodeConnection.jsx# SVG连接线
│   │   │   ├── AgentLibrary.jsx  # 左侧Agent库
│   │   │   └── PipelineTemplates.jsx
│   │   ├── Console.jsx           # 左侧面板（执行日志/对话）
│   │   ├── AssetPanel/          # 右侧资产面板
│   │   ├── HomePage.jsx         # 项目列表首页
│   │   └── SkillMarket/         # 插件市场
│   ├── services/api.js          # API调用封装
│   └── constants/ComponentType.js # 节点类型定义
│
├── dream-studio-backend/         # 后端源码
│   ├── controller/               # REST接口
│   │   ├── HomePageController   # 项目管理
│   │   ├── WorkSpaceController  # 工作流执行
│   │   └── AuthController       # 用户认证
│   ├── service/                  # 业务逻辑
│   ├── entity/                  # JPA实体
│   ├── repository/              # 数据访问
│   └── dto/                     # 数据传输对象
│
└── public/                      # 静态资源
```

## 快速启动

### 前端

```bash
# 安装依赖
npm install

# 启动开发服务器 (localhost:5173)
npm run dev
```

Vite 会自动代理 `/api` 请求到后端 `http://localhost:8080`。

### 后端

```bash
cd dream-studio-backend

# 启动 (localhost:8080)
mvn spring-boot:run

# 运行测试
mvn test
```

### 开发环境数据库

- H2 控制台：`http://localhost:8080/h2-console`
- JDBC URL：`jdbc:h2:mem:aimanjudb`

生产环境切换到 MySQL，修改 `application.yml` 中的数据库配置。

## 核心概念

### 节点类型

| 类型 | 名称 | 功能 |
|------|------|------|
| producer | 资深影视制片人 | 项目立项，可行性分析 |
| content | 金牌编剧 | 剧本创作 |
| visual | 概念美术总监 | 角色/场景/道具设计 |
| director | 分镜导演 | 分镜脚本 |
| technical | 视频提示词工程师 | 视频Prompt优化 |
| videoGen | 视频生成 | 调用模型生成视频 |
| videoEditor | 视频剪辑 | 剪辑成片 |

### 工作流执行

工作流通过DAG定义节点和依赖关系，执行时通过SSE流式返回：

```
init → status → thinking → images/videos/data → result → complete
```

### API代理

前端所有 `/api/*` 请求通过 Vite 代理到后端：

| 前端路径 | 后端路径 |
|----------|----------|
| `/api/*` | `http://localhost:8080/api/*` |

## 接口文档

后端接口文档位于 `dream-studio-backend/上游服务接口文档.md`。

Swagger UI（后端启动后访问）：`http://localhost:8080/swagger-ui.html`

## License

MIT
