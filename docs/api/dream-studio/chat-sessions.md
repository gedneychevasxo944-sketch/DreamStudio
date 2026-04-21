# 对话会话接口

## 获取或创建会话

**GET** `/api/v1/chat/sessions?projectId={projectId}`

如果会话不存在，会自动创建。

**Response:**
```json
{
  "code": 200,
  "data": {
    "session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "projectId": 1,
      "account": "user@example.com",
      "messageCount": 5,
      "lastMessageTime": "2026-04-22 12:30:00",
      "createdTime": "2026-04-22 10:00:00"
    }
  }
}
```

---

## 创建会话

**POST** `/api/v1/chat/sessions`

**Request:**
```json
{
  "projectId": 1
}
```

**Response:**
```json
{
  "code": 200,
  "data": {
    "session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "projectId": 1,
      "account": "user@example.com",
      "messageCount": 0,
      "createdTime": "2026-04-22 12:00:00"
    }
  }
}
```

---

## 获取项目会话列表

**GET** `/api/v1/chat/sessions/list?projectId={projectId}`

**Response:**
```json
{
  "code": 200,
  "data": {
    "sessions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "projectId": 1,
        "account": "user@example.com",
        "messageCount": 5,
        "lastMessageTime": "2026-04-22 12:30:00",
        "createdTime": "2026-04-22 10:00:00"
      }
    ],
    "total": 1
  }
}
```

---

## 获取会话详情

**GET** `/api/v1/chat/sessions/{sessionId}`

**Response:**
```json
{
  "code": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "projectId": 1,
    "account": "user@example.com",
    "messageCount": 5,
    "lastMessageTime": "2026-04-22 12:30:00",
    "createdTime": "2026-04-22 10:00:00",
    "updatedTime": "2026-04-22 12:30:00"
  }
}
```

---

## 获取会话消息历史

**GET** `/api/v1/chat/sessions/{sessionId}/messages?limit=50`

**Response:**
```json
{
  "code": 200,
  "data": {
    "messages": [
      {
        "messageId": "msg-001",
        "sessionId": "550e8400-e29b-41d4-a716-446655440000",
        "role": "user",
        "content": "帮我写一个都市爱情故事的剧本",
        "thinking": null,
        "attachments": null,
        "assets": null,
        "metadata": null,
        "createdTime": "2026-04-22 10:01:00"
      },
      {
        "messageId": "msg-002",
        "sessionId": "550e8400-e29b-41d4-a716-446655440000",
        "role": "assistant",
        "content": "好的，我来为您创建一个都市爱情故事的剧本。\n\n项目名称：都市情感微电影\n预算：500万\n周期：6个月",
        "thinking": "正在分析项目可行性...\n评估预算和资源需求...\n制定项目时间线...\n生成项目立项书...",
        "attachments": null,
        "assets": null,
        "metadata": null,
        "createdTime": "2026-04-22 10:01:30"
      }
    ],
    "total": 2,
    "hasMore": false
  }
}
```

**注意:**
- `role`: `user` 表示用户消息，`assistant` 表示 AI 回复
- 当 `role=assistant` 时，`content` 是 AI 回复，`thinking` 是思考过程
- 用户上传的附件在 `attachments` 字段（JSON）
- AI 回复包含的资产在 `assets` 字段（JSON）

---

## 删除会话

**DELETE** `/api/v1/chat/sessions/{sessionId}`

**Response:**
```json
{
  "code": 200,
  "data": null
}
```

**注意:** 删除会话会级联删除所有关联的消息。
