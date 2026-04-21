# API 文档目录

## Adeptify AI 接口

- [对话补全 (chat-completions)](adeptify/chat-completions.md) - SSE 流式对话和工作流执行

## 造梦后端接口

- [项目管理](dream-studio/projects.md) - 项目的 CRUD 和版本管理
- [节点接口](dream-studio/nodes.md) - 节点版本、资产、提案管理
- [对话会话](dream-studio/chat-sessions.md) - ChatSession CRUD 和消息历史

---

## 通用响应格式

所有 API 统一响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

**错误响应：**

```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

**分页响应：**

```json
{
  "code": 200,
  "data": {
    "list": [...],
    "pageNo": 1,
    "pageSize": 10,
    "total": 100
  }
}
```

---

## 认证方式

API 使用 Bearer Token 认证：

```
Authorization: Bearer <token>
```

部分接口需要 X-User-Id header：

```
X-User-Id: user123
```
