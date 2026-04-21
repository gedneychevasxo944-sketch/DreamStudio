# 造梦后端架构设计方案

> 本文档记录造梦后端的完整架构设计方案。

**最后更新**: 2026-04-22

---

## 一、技术架构

### 1.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React + Zustand + Framer Motion | 故事板 + 画布双模式 |
| 后端 | Java Spring Boot (Maven) | API 服务 |
| 数据库 | PostgreSQL + S3 | 结构化数据 + 文件存储 |
| AI服务 | AdeptifyAi | 对话 + 工作流执行 |

### 1.2 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                           前端                                   │
│              (故事板模式 + 画布模式)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        造梦后端 (Java)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API 网关层                              │  │
│  │              (认证、路由、鉴权、限流)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │
│  │  项目管理层 │  │  资产管理  │  │     AdeptifyAi 客户端   │  │
│  │            │  │            │  │                        │  │
│  │ Projects   │  │ Assets     │  │ - chat() 对话         │  │
│  │ Snapshots │  │ AssetUsage │  │ - execute() 工作流执行 │  │
│  │            │  │ NodeVersions│  │                        │  │
│  │            │  │ ChatSessions│  │                        │  │
│  └────────────┘  └────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AdeptifyAi API                             │
│              (对话 + 工作流执行 / 后续扩展)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、数据模型

### 2.1 时间字段命名规范

所有时间字段统一使用 `{entity}Time` 结尾：

```java
createdTime: LocalDateTime      // 创建时间
updatedTime: LocalDateTime      // 更新时间
completedTime: LocalDateTime    // 完成时间
```

### 2.2 核心实体

> **注意**：以下为设计文档中的目标数据模型。现有后端实体 (Project, Asset, NodeVersion 等) 与此不完全一致，重构时需逐步对齐。当前优先实现 Adeptify SSE 接口，现有实体暂不做大范围修改。

#### Project (项目)

```java
Project {
    id: Long                    // 主键
    name: String                // 项目名称
    account: String              // 所有者账号
    currentVersion: Integer      // 当前版本号
    config: String               // JSON，工作流定义等配置
    createdTime: LocalDateTime
    updatedTime: LocalDateTime
}
```

**说明**：
- 项目级配置存在 `config` 字段
- 无 `phase` 字段（两个模式可自由切换）

#### ProjectSnapshot (项目快照)

```java
ProjectSnapshot {
    id: Long                    // 主键
    projectId: Long            // 关联项目ID
    version: Integer            // 版本号
    config: String              // JSON，快照配置
    createdTime: LocalDateTime  // 创建时间
}
```

**说明**：
- 每次保存版本时，将当前 Project.config 存入快照
- 获取历史版本直接查此表，无需聚合

#### Asset (资产)

```java
Asset {
    id: String                 // 主键 (UUID)
    projectId: Long            // 关联项目ID
    type: String               // character|scene|prop|storyboard|video
    name: String               // 资产名称
    description: String         // 描述
    thumbnailUrl: String       // 缩略图URL
    metadata: String            // JSON，类型特定数据
        - character: { consistencyId: "char-001" }
        - scene: { location: "室内|室外" }
        - prop: { category: "武器|工具" }
    consistencyId: String      // 一致性ID（角色特征保持）
    status: String              // pending|generated|modified
    source: String              // system|user
    createdTime: LocalDateTime
    updatedTime: LocalDateTime
}
```

**说明**：
- 资产在项目内全局共享，不绑定版本
- 资产ID全局唯一，修改后还是同一个ID
- `consistencyId` 用于保持角色等资产的一致性特征

#### AssetUsage (资产使用记录)

```java
AssetUsage {
    id: Long                    // 主键
    projectId: Long            // 关联项目ID
    assetId: String            // 被引用的资产ID
    usedByNodeId: String       // 使用方节点ID
    usedByStage: String        // 使用方阶段
    context: String             // JSON，引用上下文
        - { shotId: "shot-1" }
        - { sceneId: "scene-1" }
    createdTime: LocalDateTime
}
```

**说明**：
- 记录资产被谁引用，用于影响分析
- 查询"哪些分镜引用了角色A"：`SELECT * FROM asset_usage WHERE assetId = 'char-1'`
- 删除资产前检查此表

#### NodeVersion (节点版本)

```java
NodeVersion {
    id: Long                    // 主键
    projectId: Long            // 关联项目ID
    nodeId: String             // 节点ID (如 "node-script-1")
    version: Integer           // 版本号
    input: String               // JSON，输入参数
    output: String             // JSON，输出结果
        - script: { content: "..." }
        - director: { storyboards: [...] }
        - visual: { overallStyle: "...", characters: [...], ... }
    createdTime: LocalDateTime
}
```

**说明**：
- 每次节点执行产生一个新版本
- `output` 包含完整输出，不含引用关系

#### ChatSession (对话会话)

```java
ChatSession {
    id: String                 // 主键 (UUID，sessionId)
    projectId: Long            // 关联项目ID
    userId: String             // 用户ID
    createdTime: LocalDateTime
    updatedTime: LocalDateTime
    lastMessageTime: LocalDateTime
}
```

#### Message (消息)

```java
Message {
    id: String                 // 主键 (UUID，messageId)
    sessionId: String         // 关联会话ID
    role: String               // user|assistant
    content: String            // 消息内容
    thinking: String           // AI思考过程
    metadata: String            // JSON，附件、上下文等
    createdTime: LocalDateTime
}
```

---

## 三、Character (智能体) 定义

### 3.1 设计原则

- AdeptifyAi 不感知"阶段"概念
- 所有 AI 能力都是 Character
- Character ID 全局唯一，格式不限

### 3.2 预定义 Characters

| id | code | name | input | output | 对应 ComponentType |
|----|------|------|-------|--------|-------------------|
| char_script_001 | script | 剧本解析 | { text } | { parsed_script } | CONTENT |
| char_director_001 | director | 分镜生成 | { script } | { storyboards } | DIRECTOR |
| char_visual_001 | visual | 视觉生成 | { script, characters, scenes, props } | { overallStyle, characters, scenes, props } | VISUAL |
| char_technical_001 | technical | Prompt优化 | { prompt } | { optimized_prompt } | TECHNICAL |
| char_videogen_001 | videogen | 视频生成 | { prompt, style } | { video_url } | VIDEO_GEN |

**说明**：Character ID 与现有 `ComponentType` 枚举一一对应，便于与 `SimulationDataProvider` 集成。

---

## 四、接口设计

### 4.1 AdeptifyAi 对话接口

```
POST /adeptify/v1/chat/completions
Content-Type: application/json
```

**Request Body**:

```json
{
  "sessionId": "string",

  "message": {
    "content": "string",
    "metadata": {
      "attachments": [
        {
          "type": "image|text|file",
          "url": "https://...",
          "name": "文件名"
        }
      ],
      "context": {
        "projectId": "string",
        "versionId": "string",
        "assetUrls": ["string"],
        "characterId": "string"
      }
    }
  }
}
```

**Response (SSE Stream)**:

```yaml
event: message_start
data: { "messageId": "string" }

event: thinking
data: { "messageId": "string", "delta": "思考过程片段..." }

event: content
data: {
  "messageId": "string",
  "type": "text|image|component|batch_action",
  "delta": "内容片段..." | { ... }
}

event: metadata
data: { "messageId": "string", "tokens": 123 }

event: message_end
data: { "messageId": "string", "finishReason": "stop" }
```

**Content Type**:

```yaml
type=text: { "delta": "纯文本内容..." }
type=image: { "delta": { "url": "...", "alt": "..." } }
type=component: { "delta": {
  "componentType": "asset_card",
  "props": { "id": "...", "name": "...", "type": "character", "thumbnail": "..." }
}}
type=batch_action: { "delta": {
  "actionType": "create_shots",
  "items": [{ "shotId": "shot-1", "name": "镜头1", "thumbnail": "..." }]
}}
```

**Component Types**:

| componentType | props |
|---------------|-------|
| asset_card | id, name, type, thumbnail, description, status |
| text_block | content, style |
| action_suggestion | actionType, label, description, targetId |

**Batch Action Types**:

| actionType | 说明 |
|-------------|------|
| create_shots | 生成分镜 |
| generate_assets | 生成资产 |

---

### 4.2 AdeptifyAi 工作流执行接口

```
POST /adeptify/v1/workflows/run
Content-Type: application/json
```

**Request Body**:

```json
{
  "edges": [
    { "from": "node_script", "to": "node_director" },
    { "from": "node_director", "to": "node_visual" }
  ],
  "nodes": [
    {
      "nodeId": "string",
      "characterId": "string",
      "input": { ... }
    }
  ]
}
```

**Response (SSE Stream)**:

```yaml
event: execution_start
data: { "executionId": "string" }

event: node_start
data: { "nodeId": "string", "characterId": "string", "status": "running" }

event: thinking
data: { "nodeId": "string", "characterId": "string", "delta": "..." }

event: content
data: { "nodeId": "string", "characterId": "string", "type": "...", "delta": "..." }

event: node_complete
data: { "nodeId": "string", "characterId": "string", "status": "completed" }

event: execution_end
data: { "executionId": "string", "status": "completed", "summary": { "totalNodes": 3, "completedNodes": 3 } }
```

---

### 4.3 造梦后端接口

#### 项目管理

```yaml
# 创建项目
POST /api/v1/projects
Request: { "name": "string", "account": "string" }
Response: { "project": { "id": 1, "name": "...", ... } }

# 获取项目
GET /api/v1/projects/{projectId}
Response: { "project": { ... } }

# 更新项目
PUT /api/v1/projects/{projectId}
Request: { "name": "string", "config": {...} }
Response: { "project": { ... } }

# 删除项目
DELETE /api/v1/projects/{projectId}

# 列出项目
GET /api/v1/projects?account={}&page=1&pageSize=20
Response: { "projects": [...], "pagination": {...} }

# 保存版本快照
POST /api/v1/projects/{projectId}/versions
Request: { "description": "string" }
Response: { "snapshot": { "id": 1, "version": 2, ... } }

# 获取版本快照
GET /api/v1/projects/{projectId}/versions/{version}
Response: { "snapshot": { ... } }

# 列出版本快照
GET /api/v1/projects/{projectId}/versions
Response: { "snapshots": [...] }

# 恢复到某版本
POST /api/v1/projects/{projectId}/versions/{version}/restore
```

#### 资产管理

```yaml
# 列出资产
GET /api/v1/projects/{projectId}/assets?type={character|scene|prop|storyboard}
Response: { "assets": [...] }

# 创建资产
POST /api/v1/projects/{projectId}/assets
Request: { "type": "character", "name": "...", "description": "...", "thumbnailUrl": "..." }
Response: { "asset": { ... } }

# 获取资产
GET /api/v1/projects/{projectId}/assets/{assetId}
Response: { "asset": { ... } }

# 更新资产
PUT /api/v1/projects/{projectId}/assets/{assetId}
Request: { "name": "...", "description": "...", "thumbnailUrl": "..." }
Response: { "asset": { ... } }

# 删除资产
DELETE /api/v1/projects/{projectId}/assets/{assetId}

# 查询资产使用方（影响分析）
GET /api/v1/projects/{projectId}/assets/{assetId}/usages
Response: { "usages": [{ "usedByNodeId": "...", "usedByStage": "...", "context": {...} }] }
```

#### 节点版本

```yaml
# 获取节点版本列表
GET /api/v1/projects/{projectId}/nodes/{nodeId}/versions
Response: { "versions": [...] }

# 获取当前版本
GET /api/v1/projects/{projectId}/nodes/{nodeId}/versions/current
Response: { "version": { ... } }

# 获取版本详情
GET /api/v1/projects/{projectId}/nodes/{nodeId}/versions/{versionId}
Response: { "version": { ... } }

# 激活版本
POST /api/v1/projects/{projectId}/nodes/{nodeId}/versions/{versionId}/activate
```

#### 对话会话

```yaml
# 获取会话 (按 userId+projectId，存在则返回，不存在则创建)
GET /api/v1/chat/sessions?userId={}&projectId={}
Response: { "session": { "sessionId": "...", ... } }

# 创建会话
POST /api/v1/chat/sessions
Request: { "userId": "string", "projectId": 1 }
Response: { "session": { "sessionId": "...", ... } }

# 获取消息历史
GET /api/v1/chat/sessions/{sessionId}/messages?limit=50
Response: { "messages": [...], "hasMore": false }
```

#### 工作流执行

```yaml
# 列出执行记录
GET /api/v1/projects/{projectId}/executions?status={running|completed|failed}
Response: { "executions": [...] }

# 获取执行详情
GET /api/v1/projects/{projectId}/executions/{executionId}
Response: { "execution": { ... } }

# 取消执行
POST /api/v1/projects/{projectId}/executions/{executionId}/cancel
```

---

## 五、数据库表结构

### 5.1 表清单

| 表名 | 说明 |
|------|------|
| project | 当前项目 |
| project_snapshot | 项目快照（历史版本） |
| asset | 资产（全局共享） |
| asset_usage | 资产使用记录 |
| node_version | 节点版本 |
| chat_session | 对话会话 |
| message | 消息 |

### 5.2 索引设计

```sql
-- asset 查询优化
CREATE INDEX idx_asset_project_type ON asset(project_id, type);
CREATE INDEX idx_asset_consistency ON asset(consistency_id);

-- asset_usage 查询优化
CREATE INDEX idx_asset_usage_asset ON asset_usage(asset_id);
CREATE INDEX idx_asset_usage_project ON asset_usage(project_id);

-- node_version 查询优化
CREATE INDEX idx_node_version_project_node ON node_version(project_id, node_id);
```

---

## 六、Mock 数据构造

### 6.1 延迟配置

```java
MockDelayConfig {
    baseDelay: { min: 500, max: 2000 }  // ms

    byCharacter: {
        "char_script_001": { min: 2000, max: 5000 },
        "char_director_001": { min: 1500, max: 4000 },
        "char_visual_001": { min: 2000, max: 5000 },
        "char_technical_001": { min: 1000, max: 2000 },
        "char_videogen_001": { min: 3000, max: 8000 }
    }

    thinkingChunkDelay: { min: 100, max: 300 }
    contentChunkDelay: { min: 50, max: 150 }
}
```

### 6.2 Mock 场景

| 场景 | 说明 |
|------|------|
| 正常对话 | 返回简单文本回复 |
| 剧本解析 | 返回 characters/scenes/props 数据，触发 batch_action |
| 生成分镜 | 返回 storyboards 数据，触发 batch_action |
| 视觉生成 | 返回 overallStyle + 资产列表 |
| Prompt优化 | 返回优化后的 prompt |
| 工作流执行 | DAG 流式执行，多节点依次完成 |

---

## 七、文档结构

```
/docs
  /api
    /adeptify
      /chat-completions.md       # 对话接口
      /workflows-run.md         # 工作流执行
      /characters.md            # Character 定义
      /sse-format.md            # SSE 格式
    /dream-studio
      /projects.md
      /assets.md
      /chat-sessions.md
      /executions.md
  /guides
    /quickstart.md
    /sse-client.md
  /schemas
    /project.yaml
    /asset.yaml
    /node-version.yaml
```

---

## 八、实现清单

### 8.1 后端实现

- [x] 创建 AdeptifyController (对话 + 工作流执行) - 使用 SseEmitter
- [x] 创建 AdeptifyService (SSE Mock 实现) - 使用 Consumer 模式处理 SSE 事件
- [x] 创建 Message 实体 (对话消息)
- [x] 创建 AssetUsage 实体 (资产使用记录)
- [x] 创建 MessageRepository
- [x] 创建 AssetUsageRepository
- [x] 更新 Project 实体 (移除 phase 字段)
- [x] 整理/重构 ChatSession 实体 (ChatSession + ChatSessionService + ChatSessionController)
- [x] 整理/重构 Asset 实体 (按设计文档对齐 DTO)
- [x] 整理/重构 NodeVersion 实体 (按设计文档对齐 DTO)
- [x] 实现项目管理接口 (HomePageController)
- [x] 实现资产管理接口 (NodeController)
- [x] 实现对话会话接口 (ChatSessionController)
- [x] 实现节点版本接口 (NodeController)
- [x] 更新数据库表结构 (docs/database/ddl.sql)

### 8.2 前端改动

- [x] 移除 stagesMock.js、mockData.js (已完成)
- [ ] 对接后端真实 API
- [ ] 处理 SSE 流式响应

### 8.3 文档完善

- [ ] 补充接口请求/响应示例
- [x] 补充数据库 DDL (docs/database/ddl.sql)
- [x] 补充 Mock 场景详情 (MockDataCenter.java)

---

## 更新记录

### 2026-04-22 (晚上)
- 完成 ChatSession CRUD API (ChatSessionDTO + ChatSessionService + ChatSessionController)
- AssetDTO 字段对齐前端 (assetType→type, title→name, coverUri→thumbnail, createdAt→createTime)
- NodeVersion DTO 确认与前端对齐
- 创建数据库 DDL 文档 (docs/database/ddl.sql)
- 更新实现清单完成状态

### 2026-04-22 (傍晚)
- 完成 AdeptifyController/Service 实现，使用 SseEmitter 替代 webflux
- 创建 Message、AssetUsage 实体及对应 Repository
- 更新 Project 实体 (移除 phase 字段)
- 确认：NodeVersion 仅用于画布模式 (currentLayer === 'node')，故事板模式不使用

### 2026-04-22 (下午)
- 确定最终数据模型
- Project + ProjectSnapshot 分表
- Asset 全局共享，AssetUsage 记录引用关系
- 确认无 phase 字段
- 前端 mock 清理完成

### 2026-04-22
- 创建文档
- 整理核心技术架构
- 整理 Character 定义
- 整理对话接口设计
- 整理工作流执行接口设计
- 整理数据模型
