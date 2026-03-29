# AI电影制作平台 - 项目架构文档

## 一、项目概述

**项目名称**: 造梦AI (DreamAI)  
**定位**: AI驱动的智能电影生产线  
**核心功能**: 通过多智能体协作完成从剧本到成片的电影制作全流程

## 二、技术栈

### 前端
- **框架**: React 18 + Vite
- **状态管理**: React Hooks (useState, useCallback, useEffect)
- **动画**: Framer Motion
- **图标**: Lucide React
- **样式**: CSS3 + CSS Variables
- **视频编辑**: WebCut (Web Components)

### 后端 (待定义)
- 需要设计 RESTful API
- 需要 AI 服务接口
- 需要文件存储服务

## 三、项目结构

```
src/
├── components/
│   ├── AgentSettings/      # 智能体设置
│   ├── AssetPanel/         # 资产面板（右侧）
│   ├── Console/            # 控制台（左侧）
│   ├── HomePage/           # 主页
│   ├── Modal/              # 模态框组件
│   ├── NodeCanvas/         # 节点画布（核心）
│   │   ├── AgentLibrary.jsx    # 智能体库
│   │   ├── AgentNode.jsx       # 智能体节点
│   │   ├── NodeCanvas.jsx      # 画布主组件
│   │   ├── NodeConnection.jsx  # 节点连接
│   │   ├── PipelineTemplates.jsx # 流水线模板
│   │   └── RichAgentNode.jsx   # 富节点内容
│   ├── ProjectCard/        # 项目卡片
│   ├── SkillMarket/        # Skill市场
│   └── VideoEditor/        # 视频编辑器
├── App.jsx                 # 主应用组件
├── main.jsx               # 入口文件
└── index.css              # 全局样式
```

## 四、功能模块详解

### 4.1 主页模块 (HomePage)

#### 功能列表
1. **输入区域**
   - 创意想法输入框
   - 一键生成按钮
   - 直接进入工作台按钮

2. **最近项目区域**
   - 展示最近6个项目
   - 项目进度显示
   - 智能体状态指示
   - 点击进入项目

3. **案例演示区域**
   - 视频演示卡片
   - 播放功能
   - 进入工作台继续创作

#### 当前状态
- 使用 mock 数据展示
- 需要后端接口获取真实数据

---

### 4.2 工作台模块 (Workspace)

#### 布局结构
- **左侧面板 (20%)**: 智能体协作中心 / 控制台
- **中心区域 (62%)**: 无限画布
- **右侧面板 (18%)**: 资产中心

#### 4.2.1 左侧 - 智能体协作中心 (Console)

**功能列表**:
1. 执行日志显示
2. 用户命令输入
3. 智能体思考过程展示
4. 系统消息展示

**智能体类型**:
- 资深影视制片人 (producer)
- 金牌编剧 (content)
- 概念美术总监 (visual)
- 分镜导演 (director)
- 视频提示词工程师 (technical)
- 视频生成 (videoGen)
- 视频剪辑 (videoEditor)
- 各角色审核节点 (auditor)

#### 4.2.2 中心 - 无限画布 (NodeCanvas)

**功能列表**:
1. 节点拖拽放置
2. 节点连线
3. 节点展开/收起
4. 节点内容编辑
5. 画布缩放/平移
6. 全屏模式
7. 运行工作流

**节点类型**:
| 类型 | 名称 | 颜色 | 功能 |
|------|------|------|------|
| producer | 资深影视制片人 | #3b82f6 | 项目规划、需求分析 |
| content | 金牌编剧 | #06b6d4 | 剧本创作 |
| visual | 概念美术总监 | #8b5cf6 | 美术设计 |
| director | 分镜导演 | #f59e0b | 分镜设计 |
| technical | 视频提示词工程师 | #10b981 | 技术实现 |
| videoGen | 视频生成 | #ec4899 | AI视频生成 |
| videoEditor | 视频剪辑 | #a855f7 | 视频剪辑 |
| *Auditor | 审核节点 | #ef4444 | 质量审核 |

#### 4.2.3 右侧 - 资产中心 (AssetPanel)

**功能列表**:
1. 节点资产展示
2. 图片预览
3. 视频预览
4. 资产导出
5. 节点数据更新

**资产类型**:
- 剧本文档
- 概念图
- 分镜图
- 生成的图片
- 生成的视频
- 剪辑后的视频

---

### 4.3 Skill市场模块 (SkillMarket)

#### 功能列表
1. Skill展示
2. Skill分类
3. Skill搜索
4. Skill安装
5. Skill管理

#### Skill类型 (预留)
- 剧本生成Skill
- 美术风格Skill
- 运镜技巧Skill
- 后期处理Skill

---

## 五、数据流

### 5.1 工作流执行流程
1. 用户在主页输入创意
2. 系统分析需求，推荐智能体团队
3. 在工作台生成节点画布
4. 用户运行工作流
5. 智能体按顺序执行
6. 生成资产展示在右侧面板

### 5.2 节点数据流
```
用户输入 → 制片人节点 → 编剧节点 → 美术节点 → 导演节点 → 技术节点 → 视频生成 → 视频剪辑
                ↓              ↓            ↓            ↓            ↓
            审核节点        审核节点      审核节点      审核节点      审核节点
```

## 六、状态管理

### 6.1 App级别状态
- `currentView`: 当前视图 (home/workspace)
- `canvasNodes`: 画布节点列表
- `canvasConnections`: 节点连接列表
- `executionLogs`: 执行日志
- `isRunning`: 运行状态

### 6.2 节点状态
- `data`: 节点数据（剧本、图片、视频等）
- `isExpanded`: 是否展开
- `isRunning`: 是否运行中
- `status`: 状态 (pending/active/approved/interception)

---

## 七、后端接口定义

### 7.1 主页模块接口

#### 7.1.1 获取最近项目列表
```
GET /api/projects/recent

Request:
  Query:
    - limit: number (可选，默认6)
    - userId: string (用户ID)

Response:
  {
    "code": 200,
    "data": {
      "projects": [
        {
          "id": "string",
          "title": "string",
          "type": "string",
          "status": "string",
          "progress": number,
          "agents": ["string"],
          "nodeStatuses": {
            "agentName": "status"
          },
          "thumbnail": "string (URL)",
          "updatedAt": "timestamp"
        }
      ]
    }
  }
```

#### 7.1.2 获取案例演示列表
```
GET /api/demos

Request:
  Query:
    - limit: number (可选，默认10)
    - category: string (可选)

Response:
  {
    "code": 200,
    "data": {
      "demos": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "thumbnail": "string (URL)",
          "videoUrl": "string (URL)",
          "duration": "string",
          "views": "string",
          "category": "string"
        }
      ]
    }
  }
```

#### 7.1.3 创建新项目
```
POST /api/projects

Request:
  Body:
    {
      "userInput": "string",       // 用户输入的创意
      "templateId": "string",      // 模板ID (可选)
      "teamConfig": {              // 团队配置 (可选)
        "agents": ["string"]
      }
    }

Response:
  {
    "code": 200,
    "data": {
      "projectId": "string",
      "name": "string",
      "nodes": [...],              // 初始节点配置
      "connections": [...],        // 初始连接配置
      "createdAt": "timestamp"
    }
  }
```

#### 7.1.4 分析用户输入
```
POST /api/ai/analyze-input

Request:
  Body:
    {
      "input": "string"           // 用户输入
    }

Response:
  {
    "code": 200,
    "data": {
      "intent": "string",         // 意图识别结果
      "suggestedTemplate": "string", // 推荐模板
      "suggestedAgents": ["string"], // 推荐智能体
      "confidence": number        // 置信度
    }
  }
```

---

### 7.2 工作台模块接口

#### 7.2.1 获取项目详情
```
GET /api/projects/:projectId

Request:
  Params:
    - projectId: string

Response:
  {
    "code": 200,
    "data": {
      "id": "string",
      "name": "string",
      "status": "string",
      "nodes": [
        {
          "id": "string",
          "name": "string",
          "type": "string",
          "x": number,
          "y": number,
          "color": "string",
          "icon": "string",
          "data": {},
          "status": "string"
        }
      ],
      "connections": [
        {
          "id": "string",
          "from": "string",
          "to": "string",
          "type": "string"
        }
      ],
      "assets": [...],
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
```

#### 7.2.2 保存项目
```
PUT /api/projects/:projectId

Request:
  Params:
    - projectId: string
  Body:
    {
      "nodes": [...],
      "connections": [...],
      "assets": [...]
    }

Response:
  {
    "code": 200,
    "data": {
      "updatedAt": "timestamp"
    }
  }
```

#### 7.2.3 执行节点
```
POST /api/projects/:projectId/nodes/:nodeId/execute

Request:
  Params:
    - projectId: string
    - nodeId: string
  Body:
    {
      "input": {},                 // 上游节点输出
      "context": {}                // 执行上下文
    }

Response:
  {
    "code": 200,
    "data": {
      "nodeId": "string",
      "status": "completed|failed|running",
      "output": {},                // 节点输出数据
      "assets": [                  // 生成的资产
        {
          "type": "image|video|text",
          "url": "string",
          "name": "string"
        }
      ],
      "logs": [                    // 执行日志
        {
          "level": "info|warning|error",
          "message": "string",
          "timestamp": "timestamp"
        }
      ],
      "thinking": "string",        // AI思考过程
      "thinkingDuration": "string"
    }
  }
```

#### 7.2.4 批量执行工作流
```
POST /api/projects/:projectId/execute

Request:
  Params:
    - projectId: string
  Body:
    {
      "startNodeId": "string",     // 起始节点
      "executionMode": "sequential|parallel" // 执行模式
    }

Response:
  {
    "code": 200,
    "data": {
      "executionId": "string",
      "status": "running|completed|failed",
      "progress": number,
      "currentNode": "string",
      "logs": [...]
    }
  }
```

#### 7.2.5 获取执行日志
```
GET /api/projects/:projectId/logs

Request:
  Params:
    - projectId: string
  Query:
    - executionId: string (可选)
    - limit: number (可选，默认50)
    - offset: number (可选，默认0)

Response:
  {
    "code": 200,
    "data": {
      "logs": [
        {
          "id": "string",
          "level": "user|system|agent",
          "agent": "string",
          "content": "string",
          "thinking": "string",
          "thinkingDuration": "string",
          "result": "string",
          "timestamp": "timestamp",
          "isThinkingComplete": boolean
        }
      ],
      "total": number
    }
  }
```

#### 7.2.6 上传资产
```
POST /api/projects/:projectId/assets

Request:
  Params:
    - projectId: string
  Body (multipart/form-data):
    - file: File
    - nodeId: string
    - assetType: "image|video|audio|document"

Response:
  {
    "code": 200,
    "data": {
      "assetId": "string",
      "url": "string",
      "name": "string",
      "type": "string",
      "size": number,
      "createdAt": "timestamp"
    }
  }
```

#### 7.2.7 导出资产
```
POST /api/projects/:projectId/export

Request:
  Params:
    - projectId: string
  Body:
    {
      "assetIds": ["string"],      // 要导出的资产ID列表
      "format": "zip|folder"       // 导出格式
    }

Response:
  {
    "code": 200,
    "data": {
      "downloadUrl": "string",
      "expiresAt": "timestamp"
    }
  }
```

---

### 7.3 AI服务接口

#### 7.3.1 剧本生成
```
POST /api/ai/generate-script

Request:
  Body:
    {
      "prompt": "string",          // 创意描述
      "style": "string",           // 风格
      "duration": number,          // 预计时长(分钟)
      "characters": ["string"],    // 角色列表
      "scenes": number             // 场景数量
    }

Response:
  {
    "code": 200,
    "data": {
      "script": {
        "title": "string",
        "scenes": [
          {
            "sceneNumber": number,
            "location": "string",
            "time": "string",
            "description": "string",
            "dialogues": [
              {
                "character": "string",
                "line": "string"
              }
            ]
          }
        ]
      }
    }
  }
```

#### 7.3.2 概念图生成
```
POST /api/ai/generate-concept

Request:
  Body:
    {
      "script": {},                // 剧本内容
      "sceneNumber": number,       // 场景号
      "style": "string",           // 美术风格
      "aspectRatio": "16:9|4:3|1:1"
    }

Response:
  {
    "code": 200,
    "data": {
      "images": [
        {
          "url": "string",
          "prompt": "string",
          "seed": number
        }
      ]
    }
  }
```

#### 7.3.3 分镜生成
```
POST /api/ai/generate-storyboard

Request:
  Body:
    {
      "script": {},
      "sceneNumber": number,
      "style": "string",
      "shots": [                   // 镜头列表
        {
          "type": "string",
          "description": "string"
        }
      ]
    }

Response:
  {
    "code": 200,
    "data": {
      "storyboard": [
        {
          "shotNumber": number,
          "type": "string",
          "angle": "string",
          "movement": "string",
          "imageUrl": "string",
          "description": "string"
        }
      ]
    }
  }
```

#### 7.3.4 视频生成
```
POST /api/ai/generate-video

Request:
  Body:
    {
      "storyboard": {},            // 分镜数据
      "shotId": "string",          // 镜头ID
      "prompt": "string",          // 提示词
      "negativePrompt": "string",  // 负面提示词
      "duration": number,          // 时长(秒)
      "resolution": "1080p|4k",
      "style": "string"
    }

Response:
  {
    "code": 200,
    "data": {
      "jobId": "string",
      "status": "queued|processing|completed|failed",
      "progress": number,
      "videoUrl": "string",        // 完成后返回
      "estimatedTime": number      // 预计完成时间(秒)
    }
  }
```

#### 7.3.5 查询视频生成状态
```
GET /api/ai/generate-video/:jobId/status

Request:
  Params:
    - jobId: string

Response:
  {
    "code": 200,
    "data": {
      "jobId": "string",
      "status": "queued|processing|completed|failed",
      "progress": number,
      "videoUrl": "string",
      "error": "string"            // 失败时返回
    }
  }
```

---

### 7.4 Skill市场接口

#### 7.4.1 获取Skill列表
```
GET /api/skills

Request:
  Query:
    - category: string (可选)
    - keyword: string (可选)
    - sortBy: "popular|newest|rating" (可选)
    - page: number (可选，默认1)
    - pageSize: number (可选，默认20)

Response:
  {
    "code": 200,
    "data": {
      "skills": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "category": "string",
          "icon": "string",
          "author": "string",
          "rating": number,
          "downloads": number,
          "isInstalled": boolean,
          "version": "string",
          "updatedAt": "timestamp"
        }
      ],
      "total": number,
      "page": number,
      "pageSize": number
    }
  }
```

#### 7.4.2 安装Skill
```
POST /api/skills/:skillId/install

Request:
  Params:
    - skillId: string

Response:
  {
    "code": 200,
    "data": {
      "success": true,
      "installedAt": "timestamp"
    }
  }
```

#### 7.4.3 卸载Skill
```
DELETE /api/skills/:skillId/install

Request:
  Params:
    - skillId: string

Response:
  {
    "code": 200,
    "data": {
      "success": true
    }
  }
```

#### 7.4.4 获取已安装Skill
```
GET /api/skills/installed

Request:
  Query:
    - userId: string

Response:
  {
    "code": 200,
    "data": {
      "skills": [...]
    }
  }
```

---

### 7.5 用户模块接口

#### 7.5.1 用户登录
```
POST /api/auth/login

Request:
  Body:
    {
      "username": "string",
      "password": "string"
    }

Response:
  {
    "code": 200,
    "data": {
      "token": "string",
      "user": {
        "id": "string",
        "username": "string",
        "avatar": "string",
        "settings": {}
      }
    }
  }
```

#### 7.5.2 获取用户信息
```
GET /api/users/:userId

Response:
  {
    "code": 200,
    "data": {
      "id": "string",
      "username": "string",
      "avatar": "string",
      "projectsCount": number,
      "createdAt": "timestamp"
    }
  }
```

---

## 八、WebSocket接口 (实时通信)

### 8.1 连接
```
WS /ws/projects/:projectId

Headers:
  - Authorization: Bearer {token}
```

### 8.2 消息类型

#### 8.2.1 客户端发送
```json
{
  "type": "execute_node",
  "data": {
    "nodeId": "string",
    "input": {}
  }
}
```

#### 8.2.2 服务端推送
```json
{
  "type": "node_status_update",
  "data": {
    "nodeId": "string",
    "status": "running|completed|failed",
    "progress": number,
    "output": {},
    "logs": []
  }
}
```

---

## 九、数据模型

### 9.1 Project (项目)
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  status: 'draft' | 'running' | 'completed' | 'archived';
  progress: number;
  nodes: Node[];
  connections: Connection[];
  assets: Asset[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 9.2 Node (节点)
```typescript
interface Node {
  id: string;
  name: string;
  type: NodeType;
  x: number;
  y: number;
  color: string;
  icon: string;
  data: Record<string, any>;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'approved' | 'interception';
  parentId?: string;  // 审核节点关联的主节点
}

type NodeType = 
  | 'producer' | 'producerAuditor'
  | 'content' | 'contentAuditor'
  | 'visual' | 'visualAuditor'
  | 'director' | 'directorAuditor'
  | 'technical' | 'technicalAuditor'
  | 'videoGen' | 'videoGenAuditor'
  | 'videoEditor';
```

### 9.3 Connection (连接)
```typescript
interface Connection {
  id: string;
  from: string;      // 源节点ID
  to: string;        // 目标节点ID
  type: 'data-flow' | 'audit-loop';
}
```

### 9.4 Asset (资产)
```typescript
interface Asset {
  id: string;
  projectId: string;
  nodeId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  name: string;
  url: string;
  size: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

### 9.5 ExecutionLog (执行日志)
```typescript
interface ExecutionLog {
  id: string;
  projectId: string;
  executionId: string;
  level: 'user' | 'system' | 'agent';
  agent?: string;
  content?: string;
  thinking?: string;
  thinkingDuration?: string;
  result?: string;
  timestamp: Date;
}
```

---

## 十、部署建议

### 10.1 前端部署
- 静态资源托管: CDN
- 构建工具: Vite
- 环境变量管理

### 10.2 后端部署
- API服务: Node.js / Python
- 数据库: PostgreSQL + Redis
- 文件存储: OSS / S3
- AI服务: 独立部署或调用第三方API

### 10.3 扩展性考虑
- 微服务架构
- 消息队列处理AI任务
- 缓存策略
- 负载均衡

---

## 十一、开发计划建议

### 第一阶段 (MVP)
1. 主页 + 项目列表
2. 基础工作台 (画布 + 节点)
3. 简单的AI剧本生成

### 第二阶段
1. 完整的智能体协作流程
2. 资产管理和导出
3. 视频生成功能

### 第三阶段
1. Skill市场
2. 高级编辑功能
3. 团队协作

---

*文档版本: 1.0*  
*更新日期: 2026-03-24*
