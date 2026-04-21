# 前端 API 迁移方案

## 背景

将前端所有旧接口迁移到新的 Adeptify + ChatSession 接口体系。

---

## 一、接口映射表

### 1.1 SSE 对话接口

| 前端调用 | 旧端点 | 新端点 | 说明 |
|---------|--------|--------|------|
| `sendChatMessageStream` | `POST /v1/agents/{agentId}/chat/stream` | `POST /adeptify/v1/chat/completions` | 对话补全 |

**旧 Request:**
```json
{
  "projectId": 1,
  "projectVersion": 1,
  "agentId": "char_script_001",
  "agentName": "char_script_001",
  "message": "帮我写剧本",
  "nodeId": "node-1"
}
```

**新 Request:**
```json
{
  "sessionId": "xxx",
  "projectId": 1,
  "account": "user@example.com",
  "message": {
    "content": "帮我写剧本",
    "metadata": {
      "attachments": [],
      "context": {
        "projectId": "1",
        "assetUrls": [],
        "characterId": "char_script_001"
      }
    }
  }
}
```

**需要前端修改点:**
1. URL: `/v1/agents/${agentId}/chat/stream` → `/adeptify/v1/chat/completions`
2. Request body 结构调整
3. SSE 事件处理逻辑调整

---

### 1.2 SSE 工作流执行接口

| 前端调用 | 旧端点 | 新端点 | 说明 |
|---------|--------|--------|------|
| `executeWorkflow` | `POST /v1/workflows/executions/stream?projectId=` | `POST /adeptify/v1/workflows/run` | 工作流执行 |

**旧 Request:**
```json
{
  "dag": {
    "nodes": [{"nodeId": "...", "agentId": ..., "agentCode": "content", "inputParam": {}}]
  },
  "edges": [{"fromNodeId": "A", "toNodeId": "B"}],
  "upstreamContext": {...}
}
```

**新 Request:**
```json
{
  "edges": [{"from": "A", "to": "B"}],
  "nodes": [{"nodeId": "...", "characterId": "char_script_001", "input": {}}]
}
```

**需要前端修改点:**
1. URL 变更
2. Request body 的 dag.nodes → nodes, dag.nodes[].agentCode → characterId
3. `fromNodeId/toNodeId` → `from/to`
4. SSE 事件处理逻辑调整

---

### 1.3 对话历史接口

| 前端调用 | 旧端点 | 新端点 | 说明 |
|---------|--------|--------|------|
| `getChatHistory` | `GET /workspace/chat?project_id=` | `GET /api/v1/chat/sessions/{sessionId}/messages` | 获取消息历史 |
| `getNodeChatHistory` | `GET /v1/projects/{projectId}/nodes/{nodeId}/chat-history` | `GET /api/v1/chat/sessions/{sessionId}/messages` | 节点对话历史 |

**前端调用方式变化:**
- 旧: 直接传 projectId，后端按 projectId 查所有会话
- 新: 需要先获取 sessionId，再查消息

---

### 1.4 其他接口

| 前端调用 | 旧端点 | 新端点 | 说明 |
|---------|--------|--------|------|
| `getAgents` | `GET /workspace/agents` | 无 | Adeptify 不提供此接口 |
| `sendMessage` (非SSE) | `POST /workspace/chat` | 废弃 | 使用 SSE 版本 |

---

## 二、SSE 事件映射

### 2.1 对话事件映射

**旧事件:**
| 事件 | 说明 |
|------|------|
| `init` | 初始化 |
| `thinking` | 思考步骤 |
| `status` | 状态 |
| `result` | 结果 (含 resultType, result, workflowCreated) |
| `data` | 数据 |
| `complete` | 完成 |
| `error` | 错误 |

**新事件:**
| 事件 | 说明 |
|------|------|
| `message_start` | 消息开始 |
| `thinking` | AI 思考过程 |
| `content` (type=text) | 文本内容 |
| `content` (type=batch_action) | 批量操作 |
| `metadata` | token 统计 |
| `message_end` | 消息结束 |

**事件处理对照:**

```javascript
// 旧
case 'thinking': onThinking?.(data);
case 'result': onResult?.(data);

// 新
case 'thinking': onThinking?.(data);           // 直接复用
case 'content':
  if (data.type === 'text') {
    // 拼接到结果
  } else if (data.type === 'batch_action') {
    // 处理批量操作
  }
case 'message_end': onComplete?.(data);
```

---

### 2.2 工作流事件映射

**旧事件:**
| 事件 | 说明 |
|------|------|
| `execution_start` | 执行开始 |
| `node_status` | 节点状态 |
| `thinking` | 思考 |
| `result` | 结果 |
| `execution_end` | 执行结束 |

**新事件:**
| 事件 | 说明 |
|------|------|
| `execution_start` | 执行开始 |
| `node_start` | 节点开始 |
| `thinking` | 思考过程 |
| `content` | 节点输出 |
| `node_complete` | 节点完成 |
| `execution_end` | 执行结束 |

---

## 三、前端修改清单

### 3.1 api.js 修改

**文件:** `frontend/src/services/api.js`

#### A. `sendChatMessageStream` 函数
```javascript
// 旧
createSSEStream(`/v1/agents/${agentId}/chat/stream`, { body }, ...)

// 新
createSSEStream(`/adeptify/v1/chat/completions`, { body }, ...)
```

Request body:
```javascript
// 旧
{
  projectId,
  projectVersion,
  agentId,
  agentName: agentId,
  message: message.trim(),
  nodeId,
}

// 新
{
  sessionId: sessionId || generateSessionId(),
  projectId,
  account: getCurrentAccount(),
  message: {
    content: message.trim(),
    metadata: {
      attachments: [],
      context: {
        projectId: String(projectId),
        assetUrls: [],
        characterId: agentId  // 或 nodeId
      }
    }
  }
}
```

#### B. SSE 事件处理
```javascript
// 旧
onEvent: (eventType, eventWithType, data) => {
  switch (eventType) {
    case 'thinking': callbacks.onThinking?.(eventWithType); break;
    case 'result': callbacks.onResult?.(eventWithType); break;
    // ...
  }
}

// 新
onEvent: (eventType, eventWithType, data) => {
  switch (eventType) {
    case 'thinking':
      callbacks.onThinking?.(eventWithType);
      break;
    case 'content':
      if (data.type === 'text') {
        // 拼接到 onResult
        callbacks.onResult?.({ ...data, resultType: 'text', result: data.delta });
      } else if (data.type === 'batch_action') {
        // 处理批量操作
        callbacks.onData?.(eventWithType);
      }
      break;
    case 'message_end':
      callbacks.onComplete?.(eventWithType);
      break;
  }
}
```

#### C. `executeWorkflow` 函数
```javascript
// 旧
createSSEConnectionForExecution(
  `/v1/workflows/executions/stream?projectId=${projectId}`,
  body,
  onMessage,
  onError
);

// 新
createSSEConnectionForExecution(
  `/adeptify/v1/workflows/run`,
  body,
  onMessage,
  onError
);

// body 转换
{
  edges: connections.map(conn => ({ from: conn.from, to: conn.to })),
  nodes: nodes.map(node => ({
    nodeId: node.id,
    characterId: node.agentCode || node.type,
    input: node.data || {}
  }))
}
```

#### D. 对话历史接口
```javascript
// 旧
getChatHistory: (projectId, version, agentId) => {
  return request(`/workspace/chat?project_id=${projectId}&version=${version}&agent_id=${agentId}`);
}

// 新
getChatHistory: (sessionId, limit = 50) => {
  return request(`/api/v1/chat/sessions/${sessionId}/messages?limit=${limit}`);
}
```

#### E. 删除废弃函数
- `getAgents()` - `/workspace/agents` 无新接口，需移除或 mock

---

### 3.2 NodeCanvas.jsx 修改

**文件:** `frontend/src/components/NodeCanvas/NodeCanvas.jsx`

#### A. `executeWorkflowWithBackend` 回调
- SSE 事件处理需要适配新格式
- `node_status` → `node_start`/`node_complete`
- `result` → `content` (type=text)

#### B. `handleGenerateVideoNodes` 中的 SSE 处理
- 适配新的工作流事件格式

---

### 3.3 NodeWorkspace.jsx 修改

**文件:** `frontend/src/components/NodeWorkspace.jsx`

- `sendChatMessageStream` 调用适配新格式
- SSE 事件处理适配

---

## 四、后端配套修改

### 4.1 AdeptifyController 适配

当前 Adeptify 的 `chat/completions` 接口缺少一些字段，需要确认或补充:

```java
// 当前 Request
public static class ChatCompletionsRequest {
    private String sessionId;
    private Long projectId;
    private String account;
    private Message message;  // 只有 content 和 metadata
}

// 建议补充
public static class ChatCompletionsRequest {
    private String sessionId;
    private Long projectId;
    private String account;
    private String nodeId;           // 新增
    private String characterId;       // 新增 (对应 agentId)
    private Message message;
}
```

### 4.2 ChatSessionController

需确认 `/api/v1/chat/sessions/{sessionId}/messages` 接口返回格式是否满足前端需求。

---

## 五、迁移步骤

1. **第一阶段: 基础接口对接**
   - 修改 `api.js` 中的 `sendChatMessageStream`
   - 修改 `api.js` 中的 `executeWorkflow`
   - 适配 SSE 事件处理

2. **第二阶段: 对话历史**
   - 确认 session 获取流程
   - 修改 `getChatHistory` 调用

3. **第三阶段: 组件适配**
   - NodeCanvas.jsx SSE 处理
   - NodeWorkspace.jsx SSE 处理

4. **第四阶段: 清理**
   - 删除废弃的 API 函数
   - 删除 WorkSpaceController 中不再需要的端点

---

## 六、风险点

1. **characterId vs agentId**: 新接口用 `characterId`，旧接口用 `agentId`，需确认映射
2. **sessionId 管理**: 前端需要自行管理 sessionId
3. **upstreamContext**: 工作流执行不再需要 upstreamContext (在 input 中)
