# 项目管理接口

## 创建项目

**POST** `/api/projects`

**Request:**
```json
{
  "title": "我的微电影项目"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "项目创建成功",
  "data": {
    "id": 1,
    "title": "我的微电影项目",
    "description": null,
    "status": "DRAFT",
    "account": "user@example.com",
    "coverImage": null,
    "tags": null,
    "config": "{}",
    "lastResult": "{}",
    "currentVersion": 1,
    "createdTime": "2026-04-22 10:00:00",
    "updatedTime": "2026-04-22 10:00:00"
  }
}
```

---

## 获取项目列表

**GET** `/api/projects`

**Response:**
```json
{
  "code": 200,
  "data": {
    "projects": [
      {
        "id": 1,
        "title": "我的微电影项目",
        "description": "一部都市情感微电影",
        "status": "DRAFT",
        "account": "user@example.com",
        "coverImage": "https://...",
        "tags": "都市,情感",
        "config": "{}",
        "lastResult": "{}",
        "currentVersion": 3,
        "createdTime": "2026-04-22 10:00:00",
        "updatedTime": "2026-04-22 12:30:00"
      }
    ],
    "total": 1
  }
}
```

---

## 获取项目详情

**GET** `/api/projects/{projectId}`

**Response:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "我的微电影项目",
    "description": "一部都市情感微电影",
    "status": "DRAFT",
    "account": "user@example.com",
    "coverImage": "https://...",
    "tags": "都市,情感",
    "config": "{ \"nodes\": [...], \"edges\": [...] }",
    "lastResult": "{}",
    "currentVersion": 3,
    "createdTime": "2026-04-22 10:00:00",
    "updatedTime": "2026-04-22 12:30:00"
  }
}
```

---

## 保存项目

**POST** `/api/projects/{projectId}/save`

**Request:**
```json
{
  "title": "更新后的标题",
  "config": "{ \"nodes\": [...], \"edges\": [...] }",
  "lastResult": "{}"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "项目保存成功",
  "data": {
    "id": 1,
    "title": "更新后的标题",
    "currentVersion": 4,
    ...
  }
}
```

---

## 删除项目

**DELETE** `/api/projects/{projectId}`

**Response:**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## Fork 模板

**POST** `/api/projects/{templateId}/fork`

**Response:**
```json
{
  "code": 200,
  "message": "基于模板创建项目成功",
  "data": {
    "id": 2,
    "title": "好莱坞工业流水线 - 副本",
    ...
  }
}
```

---

## 获取版本列表

**GET** `/api/projects/{projectId}/versions`

**Response:**
```json
{
  "code": 200,
  "data": {
    "versions": [
      {
        "id": 5,
        "versionNumber": 3,
        "title": "我的微电影项目",
        "description": "第三版",
        "status": "DRAFT",
        "config": "{}",
        "createdTime": "2026-04-22 12:00:00"
      }
    ],
    "total": 3
  }
}
```

---

## 恢复版本

**POST** `/api/projects/{projectId}/versions/{versionNumber}/restore`

**Response:**
```json
{
  "code": 200,
  "message": "版本恢复成功",
  "data": {
    "id": 1,
    "currentVersion": 2,
    ...
  }
}
```

---

## 获取模板列表

**GET** `/api/templates`

**Response:**
```json
{
  "code": 200,
  "data": {
    "templates": [
      {
        "id": 1,
        "name": "好莱坞工业流水线",
        "description": "标准五组双子星节点完整流程",
        "coverImage": "https://...",
        "tags": "好莱坞,工业流水线",
        "useCount": 128,
        "createdTime": "2026-04-22 10:00:00"
      }
    ],
    "total": 11
  }
}
```
