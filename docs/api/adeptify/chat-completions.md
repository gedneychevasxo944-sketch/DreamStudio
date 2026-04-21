# Adeptify AI 对话补全接口

## 对话补全 (SSE 流式)

**POST** `/adeptify/v1/chat/completions`

Content-Type: `application/json`
Accept: `text/event-stream`

**Request:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": 1,
  "account": "user@example.com",
  "message": {
    "content": "帮我写一个都市爱情故事的剧本",
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

**Response (SSE Stream):**

```
event: message_start
data: {"messageId": "abc123"}

event: thinking
data: {"messageId": "abc123", "delta": "正在理解您的问题..."}

event: thinking
data: {"messageId": "abc123", "delta": "分析问题意图..."}

event: thinking
data: {"messageId": "abc123", "delta": "生成回答..."}

event: content
data: {"messageId": "abc123", "type": "text", "delta": "好的，我来为您创建一个都市爱情故事的剧本。\n"}

event: content
data: {"messageId": "abc123", "type": "text", "delta": "\n项目名称：都市情感微电影\n"}

event: content
data: {"messageId": "abc123", "type": "text", "delta": "预算：500万\n"}

event: content
data: {"messageId": "abc123", "type": "text", "delta": "周期：6个月"}

event: content
data: {"messageId": "abc123", "type": "batch_action", "delta": {"actionType": "generate_assets", "items": [{"id": "char-1", "name": "角色1", "type": "character", "thumbnail": "https://..."}]}}

event: metadata
data: {"messageId": "abc123", "tokens": 128}

event: message_end
data: {"messageId": "abc123", "finishReason": "stop"}
```

---

## 事件类型说明

### message_start
消息开始

```json
{"messageId": "abc123"}
```

### thinking
AI 思考过程（打字机效果）

```json
{"messageId": "abc123", "delta": "正在理解您的问题..."}
```

### content
AI 回复内容

**type=text:** 纯文本片段
```json
{"messageId": "abc123", "type": "text", "delta": "好的，我来为您创建..."}
```

**type=batch_action:** 批量操作（如生成分镜）
```json
{"messageId": "abc123", "type": "batch_action", "delta": {"actionType": "create_shots", "items": [...]}}
```

**actionType 类型:**
| actionType | 说明 |
|------------|------|
| generate_assets | 生成资产（角色/场景/道具） |
| create_shots | 生成分镜 |

### metadata
Token 统计

```json
{"messageId": "abc123", "tokens": 128}
```

### message_end
消息结束

```json
{"messageId": "abc123", "finishReason": "stop"}
```

**finishReason:** `stop` | `length` | `content_filter`

---

## 工作流执行 (SSE 流式)

**POST** `/adeptify/v1/workflows/run`

Content-Type: `application/json`
Accept: `text/event-stream`

**Request:**
```json
{
  "edges": [
    {"from": "producer", "to": "content"},
    {"from": "content", "to": "visual"}
  ],
  "nodes": [
    {
      "nodeId": "node-producer-1",
      "characterId": "char_producer_001",
      "input": {}
    },
    {
      "nodeId": "node-content-1",
      "characterId": "char_script_001",
      "input": {}
    },
    {
      "nodeId": "node-visual-1",
      "characterId": "char_visual_001",
      "input": {}
    }
  ]
}
```

**Response (SSE Stream):**

```
event: execution_start
data: {"executionId": "exec-001"}

event: node_start
data: {"nodeId": "node-producer-1", "characterId": "char_producer_001", "status": "running"}

event: thinking
data: {"nodeId": "node-producer-1", "characterId": "char_producer_001", "delta": "正在分析项目可行性..."}

event: thinking
data: {"nodeId": "node-producer-1", "characterId": "char_producer_001", "delta": "评估预算和资源需求..."}

event: content
data: {"nodeId": "node-producer-1", "characterId": "char_producer_001", "type": "text", "delta": "项目立项完成\n\n项目名称：都市情感微电影..."}

event: node_complete
data: {"nodeId": "node-producer-1", "characterId": "char_producer_001", "status": "completed"}

event: node_start
data: {"nodeId": "node-content-1", "characterId": "char_script_001", "status": "running"}

event: thinking
data: {"nodeId": "node-content-1", "characterId": "char_script_001", "delta": "构建故事框架..."}

event: content
data: {"nodeId": "node-content-1", "characterId": "char_script_001", "type": "text", "delta": "分场剧本完成\n\n第1集：清晨的邂逅..."}

event: node_complete
data: {"nodeId": "node-content-1", "characterId": "char_script_001", "status": "completed"}

event: execution_end
data: {"executionId": "exec-001", "status": "completed", "summary": {"totalNodes": 3, "completedNodes": 3}}
```

---

## 事件类型说明

### execution_start
执行开始

```json
{"executionId": "exec-001"}
```

### node_start
节点开始执行

```json
{"nodeId": "node-content-1", "characterId": "char_script_001", "status": "running"}
```

### thinking
节点思考过程

```json
{"nodeId": "node-content-1", "characterId": "char_script_001", "delta": "构建故事框架..."}
```

### content
节点输出内容

**type=text:** 文本输出
```json
{"nodeId": "node-content-1", "characterId": "char_script_001", "type": "text", "delta": "分场剧本完成..."}
```

**type=component:** 结构化组件数据
```json
{"nodeId": "node-visual-1", "characterId": "char_visual_001", "type": "component", "delta": {"overallStyle": "都市现代感 + 暖色调", "characters": [...]}}
```

### node_complete
节点执行完成

```json
{"nodeId": "node-content-1", "characterId": "char_script_001", "status": "completed"}
```

### execution_end
整个工作流执行完成

```json
{"executionId": "exec-001", "status": "completed", "summary": {"totalNodes": 3, "completedNodes": 3}}
```
