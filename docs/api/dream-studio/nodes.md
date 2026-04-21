# 节点接口

## 获取节点版本列表

**GET** `/api/v1/projects/{projectId}/nodes/{nodeId}/versions`

**Response:**
```json
{
  "code": 200,
  "data": {
    "versions": [
      {
        "id": 3,
        "projectId": 1,
        "nodeId": "node-script-1",
        "agentId": 2,
        "agentCode": "content",
        "nodeType": "content",
        "versionNo": 3,
        "versionKind": "RUN_OUTPUT",
        "isCurrent": true,
        "status": "READY",
        "diffSummary": "第三次运行版本",
        "createdAt": "10分钟前"
      }
    ],
    "total": 3
  }
}
```

---

## 获取当前版本

**GET** `/api/v1/projects/{projectId}/nodes/{nodeId}/versions/current`

**Response:**
```json
{
  "code": 200,
  "data": {
    "id": 3,
    "projectId": 1,
    "nodeId": "node-script-1",
    "agentId": 2,
    "agentCode": "content",
    "nodeType": "content",
    "versionNo": 3,
    "versionKind": "RUN_OUTPUT",
    "isCurrent": true,
    "status": "READY",
    "inputSnapshotJson": "{}",
    "paramSnapshotJson": "{}",
    "resultText": "剧本内容...",
    "thinkingText": "正在分析剧本结构...",
    "upstreamNodeIds": "[{\"nodeId\":\"producer\",\"versionId\":1}]",
    "createdAt": "10分钟前",
    "upstreamNodes": [
      {
        "nodeId": "producer",
        "nodeName": "制片组",
        "output": "项目立项完成...",
        "resultJson": null
      }
    ]
  }
}
```

---

## 获取版本详情（含上游节点）

**GET** `/api/v1/projects/{projectId}/nodes/{nodeId}/versions/{versionId}/detail-with-upstream`

**Response:**
```json
{
  "code": 200,
  "data": {
    "id": 3,
    "projectId": 1,
    "nodeId": "node-script-1",
    "versionNo": 3,
    "resultText": "分场剧本完成...",
    "thinkingText": "正在分析剧本结构...",
    "upstreamNodes": [
      {
        "nodeId": "producer",
        "nodeName": "制片组",
        "output": "项目立项完成\n\n项目名称：都市情感微电影...",
        "resultJson": "{\"resultText\":\"...\"}"
      }
    ],
    "status": "READY",
    "createdAt": "10分钟前"
  }
}
```

---

## 激活版本

**POST** `/api/v1/projects/{projectId}/nodes/{nodeId}/versions/{versionId}/activate`

**Response:**
```json
{
  "code": 200,
  "data": {
    "activatedVersionId": 3,
    "affectedNodeIds": ["node-visual-1"],
    "message": "版本激活成功"
  }
}
```

---

## 获取运行记录

**GET** `/api/v1/projects/{projectId}/nodes/{nodeId}/history`

**Response:**
```json
{
  "code": 200,
  "data": {
    "versions": [
      {
        "id": 3,
        "versionNo": 3,
        "diffSummary": "第三次运行版本",
        "status": "READY",
        "createdAt": "10分钟前"
      },
      {
        "id": 2,
        "versionNo": 2,
        "diffSummary": "第二次运行版本",
        "status": "READY",
        "createdAt": "1小时前"
      }
    ],
    "total": 3
  }
}
```

---

# 资产接口

## 获取节点资产

**GET** `/api/v1/projects/{projectId}/nodes/{nodeId}/assets?currentOnly=false`

**Response:**
```json
{
  "code": 200,
  "data": {
    "assets": [
      {
        "id": 1,
        "projectId": 1,
        "nodeId": "node-visual-1",
        "type": "image",
        "name": "角色概念图-林浩",
        "uri": "https://picsum.photos/400/300",
        "thumbnail": "https://picsum.photos/400/300",
        "status": "READY",
        "createTime": "1小时前"
      },
      {
        "id": 2,
        "projectId": 1,
        "nodeId": "node-visual-1",
        "type": "image",
        "name": "场景概念图-城市街道",
        "uri": "https://picsum.photos/400/300",
        "thumbnail": "https://picsum.photos/400/300",
        "status": "READY",
        "createTime": "2小时前"
      }
    ],
    "total": 2
  }
}
```

---

## 获取项目资产

**GET** `/api/v1/projects/{projectId}/assets?currentOnly=true`

**Response:**
```json
{
  "code": 200,
  "data": {
    "assets": [...],
    "total": 10
  }
}
```

---

## 激活资产

**POST** `/api/v1/projects/{projectId}/assets/{assetId}/activate`

**Response:**
```json
{
  "code": 200,
  "data": {
    "activatedAssetId": 1,
    "nodeId": "node-visual-1",
    "affectedNodeIds": [],
    "message": "Asset activated successfully"
  }
}
```

---

# 提案接口

## 获取提案列表

**GET** `/api/v1/projects/{projectId}/nodes/{nodeId}/proposals`

**Response:**
```json
{
  "code": 200,
  "data": {
    "proposals": [
      {
        "id": 2,
        "projectId": 1,
        "nodeId": "node-script-1",
        "agentId": 2,
        "proposalType": "EDIT",
        "title": "剧本优化建议",
        "summary": "建议优化第二幕的对白，增强情感张力",
        "changeInstruction": "将林浩与陈雨的对话修改为更冲突的版本",
        "applyStrategy": "PATCH_ONLY",
        "status": "PENDING",
        "createdAt": "5分钟前"
      },
      {
        "id": 1,
        "projectId": 1,
        "nodeId": "node-script-1",
        "agentId": 2,
        "proposalType": "REGENERATE",
        "title": "重写第一集开头",
        "summary": "建议重新生成第一集的开场场景",
        "changeInstruction": "将开场从街道场景改为办公室场景",
        "applyStrategy": "RERUN_REQUIRED",
        "status": "APPLIED",
        "createdAt": "30分钟前"
      }
    ],
    "total": 2
  }
}
```

---

## 获取提案详情

**GET** `/api/v1/projects/{projectId}/nodes/{nodeId}/proposals/{proposalId}`

**Response:**
```json
{
  "code": 200,
  "data": {
    "id": 2,
    "projectId": 1,
    "nodeId": "node-script-1",
    "agentId": 2,
    "proposalType": "EDIT",
    "title": "剧本优化建议",
    "summary": "建议优化第二幕的对白，增强情感张力",
    "changeInstruction": "将林浩与陈雨的对话修改为更冲突的版本",
    "beforeSnapshotJson": "{\"resultText\": \"场景2-3：咖啡馆...\"}",
    "afterSnapshotJson": "{\"resultText\": \"场景2-3：咖啡馆...\"}",
    "diffJson": {
      "diffType": "TEXT_DIFF",
      "title": "剧本差异对比",
      "summary": "修改了第2集第3场的对白内容",
      "textDiff": {
        "beforeText": "场景2-3：咖啡馆 日 内\n林浩：我觉得这个项目很有前景...\n陈雨：但是风险太大了。",
        "afterText": "场景2-3：咖啡馆 日 内\n林浩：相信我，这个创意一定会火的！\n陈雨：你确定？这可不是闹着玩的。",
        "segments": [
          {"type": "EQUAL", "content": "场景2-3：咖啡馆 日 内\n"},
          {"type": "REMOVE", "content": "林浩：我觉得这个项目很有前景...\n陈雨：但是风险太大了。"},
          {"type": "ADD", "content": "林浩：相信我，这个创意一定会火的！\n陈雨：你确定？这可不是闹着玩的。"}
        ]
      }
    },
    "impactNodes": ["content-2", "visual-1"],
    "applyStrategy": "PATCH_ONLY",
    "status": "PENDING",
    "createdAt": "5分钟前",
    "appliedAt": null
  }
}
```

---

## 应用提案

**POST** `/api/v1/projects/{projectId}/nodes/{nodeId}/proposals/{proposalId}/apply`

**Response:**
```json
{
  "code": 200,
  "data": null
}
```

---

## 拒绝提案

**POST** `/api/v1/projects/{projectId}/nodes/{nodeId}/proposals/{proposalId}/reject`

**Response:**
```json
{
  "code": 200,
  "data": null
}
```

---

## 获取已应用的提案

**GET** `/api/v1/projects/{projectId}/nodes/{nodeId}/applied-proposal`

**Response:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "重写第一集开头",
    ...
  }
}
```
