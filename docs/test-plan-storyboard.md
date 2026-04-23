# 故事板功能测试计划

**项目**: DreamStudio 故事板系统
**分支**: 001-storyboard-v2
**日期**: 2026-04-23

---

## 一、TopBar 功能测试（已完成完善）

### 1.1 项目名称编辑
- **前端组件**: TopBar.jsx
- **功能**: 点击项目名称 → 进入编辑模式 → Enter 或失焦保存
- **后端接口**: `POST /api/projects/{id}/save`
- **请求数据**: `{ title: string, config: string }`
- **响应数据**: `ProjectDTO.Response`

### 1.2 版本下拉
- **功能**: 点击 V1.0 ▼ → 显示版本历史列表
- **后端接口**: `GET /api/projects/{id}/versions`
- **响应数据**:
```json
{
  "success": true,
  "data": {
    "versions": [
      { "id": 1, "name": "V1.0", "createdAt": "2026-04-23", "description": "初始版本" },
      { "id": 2, "name": "V1.1", "createdAt": "2026-04-22", "description": "修改剧本" }
    ],
    "total": 2
  }
}
```

### 1.3 切换版本
- **后端接口**: `POST /api/projects/{id}/versions/{v}/restore`
- **响应数据**: `ProjectDTO.Response`

### 1.4 创作模式切换
- **前端状态**: currentLayer (storyboard / node)
- **功能**: 切换到 node 层时提示"开发中"
- **无后端接口**: 纯前端状态

### 1.5 保存按钮
- **后端接口**: `POST /api/projects/{id}/save`
- **请求数据**: `{ title: string, config: object }`
- **响应数据**: `ProjectDTO.Response`

### 1.6 主题切换
- **存储**: localStorage (dreamstudio-theme)
- **无后端接口**

### 1.7 项目下拉菜单
- **后端接口**: `GET /api/projects`
- **响应数据**:
```json
{
  "success": true,
  "data": {
    "projects": [
      { "id": 1, "name": "我的微电影", "updatedAt": "2天前" },
      { "id": 2, "name": "科幻短片", "updatedAt": "5天前" }
    ],
    "total": 2
  }
}
```

### 1.8 创建项目
- **后端接口**: `POST /api/projects`
- **请求数据**: `{ title: "新项目" }`
- **响应数据**: `ProjectDTO.Response`

---

## 二、7个阶段功能详细测试

### 阶段 1: SCRIPT (剧本)

| 功能 | 前端组件 | 后端接口 | 期望响应数据 |
|------|---------|---------|-------------|
| **剧本编辑器** | AssetDetailPanel/ScriptEditor | 无（本地编辑） | - |
| **生成目录** | ScriptStageView | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **AI生成剧本** | ScriptStageView | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **AI提取素材** | ScriptStageView | `POST /adeptify/v1/chat/completions` | 返回 { characters: [], scenes: [], props: [] } |
| **剧本自动保存** | AssetDetailPanel/ScriptEditor | `POST /api/projects/{id}/save` | - |
| **剧本引导（空状态）** | ScriptStageView | 无 | - |

**AI对话接口**: `POST /adeptify/v1/chat/completions`
**请求数据**:
```json
{
  "sessionId": "sess_xxx",
  "projectId": 1,
  "account": "user123",
  "contextType": "asset",
  "contextId": "script-main",
  "message": {
    "content": "用户输入内容",
    "metadata": { "attachments": [], "context": {} }
  }
}
```

**SSE 响应格式**:
```
event: message_start
data: {"sessionId": "sess_xxx"}

event: thinking
data: {"content": "正在分析..."}

event: content
data: {"type": "text", "delta": "生成的内容..."}

event: message_end
data: {"content": "完整内容"}
```

---

### 阶段 2: CHARACTER (角色)

| 功能 | 前端组件 | 后端接口 | 期望响应数据 |
|------|---------|---------|-------------|
| **角色列表** | AssetGrid | `GET /api/v1/projects/{id}/assets?type=character` | AssetDTO.AssetListResponse |
| **创建角色** | AssetGrid | `POST /api/v1/projects/{id}/assets` | AssetDTO.Response |
| **选择角色** | AssetCard | 无 | - |
| **更新角色** | AssetDetailPanel/CharacterEditor | `PUT /api/v1/projects/{id}/assets/{assetId}` | AssetDTO.Response |
| **删除角色** | AssetDetailPanel/CharacterEditor | `DELETE /api/v1/projects/{id}/assets/{assetId}` | - |
| **生成图片** | AssetDetailPanel/CharacterEditor | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **AI优化描述** | AssetAIDialog | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **上传角色** | AssetGrid | `POST /api/upload` | `{ url: string }` |
| **空状态引导** | AssetGrid | 无 | - |

**获取资产列表**: `GET /api/v1/projects/{id}/assets`
**响应数据**:
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": 1,
        "name": "零",
        "type": "character",
        "description": "红发女黑客",
        "prompt": "赛博朋克风格...",
        "thumbnail": "https://xxx.jpg",
        "status": "completed",
        "createdAt": "2026-04-23"
      }
    ],
    "total": 1
  }
}
```

**创建资产**: `POST /api/v1/projects/{id}/assets`
**请求数据**:
```json
{
  "name": "新角色",
  "type": "character",
  "description": "",
  "prompt": ""
}
```

---

### 阶段 3: SCENE (场景)

| 功能 | 前端组件 | 后端接口 | 期望响应数据 |
|------|---------|---------|-------------|
| **场景列表** | AssetGrid | `GET /api/v1/projects/{id}/assets?type=scene` | 同上 |
| **创建场景** | AssetGrid | `POST /api/v1/projects/{id}/assets` | 同上 |
| **更新场景** | AssetDetailPanel/SceneEditor | `PUT /api/v1/projects/{id}/assets/{assetId}` | 同上 |
| **删除场景** | AssetDetailPanel/SceneEditor | `DELETE /api/v1/projects/{id}/assets/{assetId}` | - |
| **生成图片** | AssetDetailPanel/SceneEditor | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **AI优化描述** | AssetAIDialog | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **上传场景** | AssetGrid | `POST /api/upload` | `{ url: string }` |

---

### 阶段 4: PROP (道具)

| 功能 | 前端组件 | 后端接口 | 期望响应数据 |
|------|---------|---------|-------------|
| **道具列表** | AssetGrid | `GET /api/v1/projects/{id}/assets?type=prop` | 同上 |
| **创建道具** | AssetGrid | `POST /api/v1/projects/{id}/assets` | 同上 |
| **更新道具** | AssetDetailPanel/PropEditor | `PUT /api/v1/projects/{id}/assets/{assetId}` | 同上 |
| **删除道具** | AssetDetailPanel/PropEditor | `DELETE /api/v1/projects/{id}/assets/{assetId}` | - |
| **生成图片** | AssetDetailPanel/PropEditor | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **AI优化描述** | AssetAIDialog | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **上传道具** | AssetGrid | `POST /api/upload` | `{ url: string }` |

---

### 阶段 5: STORYBOARD (分镜)

| 功能 | 前端组件 | 后端接口 | 期望响应数据 |
|------|---------|---------|-------------|
| **分镜列表** | AssetGrid | `GET /api/v1/projects/{id}/assets?type=storyboard` | 同上 |
| **创建分镜** | AssetGrid | `POST /api/v1/projects/{id}/assets` | 同上 |
| **选择分镜** | AssetCard | 无 | - |
| **更新分镜** | AssetDetailPanel/StoryboardEditor | `PUT /api/v1/projects/{id}/assets/{assetId}` | 同上 |
| **删除分镜** | AssetDetailPanel/StoryboardEditor | `DELETE /api/v1/projects/{id}/assets/{assetId}` | - |
| **生成预览帧** | AssetDetailPanel/StoryboardEditor | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **AI优化Prompt** | AssetDetailPanel/StoryboardEditor | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **批量生成** | AssetGrid | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |

**分镜特殊字段**:
```json
{
  "id": 1,
  "name": "镜头1",
  "type": "storyboard",
  "style": "cyberpunk",
  "cameraMovement": "pan_left",
  "shotType": "medium",
  "duration": 8,
  "prompt": "昏暗的数据中心...",
  "frames": {
    "first": "https://xxx1.jpg",
    "key": "https://xxx2.jpg",
    "last": "https://xxx3.jpg"
  },
  "characterIds": [1, 2],
  "sceneId": 1,
  "propsIds": [1],
  "scriptParagraph": "红发女黑客零正在..."
}
```

---

### 阶段 6: VIDEO (视频)

| 功能 | 前端组件 | 后端接口 | 期望响应数据 |
|------|---------|---------|-------------|
| **视频片段列表** | AssetGrid | `GET /api/v1/projects/{id}/assets?type=video` | 同上 |
| **选择片段** | AssetCard | 无 | - |
| **更新片段参数** | AssetDetailPanel/VideoEditor | `PUT /api/v1/projects/{id}/assets/{assetId}` | 同上 |
| **生成视频** | AssetDetailPanel/VideoEditor | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **AI优化Prompt** | AssetDetailPanel/VideoEditor | `POST /adeptify/v1/chat/completions` | SSE 流式响应 |
| **导出所有视频** | VideoStageView | 无（前端导出） | - |

**视频特殊字段**:
```json
{
  "id": 1,
  "name": "视频片段1",
  "type": "video",
  "videoUrl": "https://xxx.mp4",
  "thumbnail": "https://xxx.jpg",
  "aspectRatio": "16:9",
  "duration": 8,
  "quality": "high",
  "prompt": "昏暗的数据中心...",
  "scriptParagraph": "...",
  "characterIds": [],
  "sceneId": 1,
  "propIds": []
}
```

---

### 阶段 7: CLIP (剪辑)

| 功能 | 前端组件 | 后端接口 | 期望响应数据 |
|------|---------|---------|-------------|
| **片段列表** | ClipStageView | `GET /api/v1/projects/{id}/clips` | ClipDTO.ClipListResponse |
| **选择片段** | ClipStageView | 无 | - |
| **拖拽排序** | ClipStageView | `PUT /api/v1/projects/{id}/clips/reorder` | - |
| **裁剪片段** | ClipStageView | `PUT /api/v1/projects/{id}/clips/{clipId}` | - |
| **切割片段** | ClipStageView | `POST /api/v1/projects/{id}/clips/{clipId}/split` | - |
| **删除片段** | ClipStageView | `DELETE /api/v1/projects/{id}/clips/{clipId}` | - |
| **播放/暂停** | ClipStageView | 无（前端控制） | - |
| **缩放** | ClipStageView | 无（前端控制） | - |
| **预览** | ClipStageView | 无（前端控制） | - |
| **导出成片** | ClipStageView | `POST /api/v1/projects/{id}/clips/export` | - |

**片段数据格式**:
```json
{
  "id": "clip-1",
  "name": "片段1",
  "videoUrl": "https://xxx.mp4",
  "thumbnail": "https://xxx.jpg",
  "startTime": 0,
  "endTime": 10,
  "duration": 10,
  "order": 1
}
```

---

## 三、通用功能测试

### 3.1 AI 对话（SSE）

所有阶段的 AI 对话都通过 `POST /adeptify/v1/chat/completions`：

**请求**:
```json
{
  "sessionId": "sess_abc123",
  "projectId": 1,
  "account": "user123",
  "contextType": "asset",
  "contextId": "asset-123",
  "message": {
    "content": "把头发改成蓝色",
    "metadata": {
      "attachments": [],
      "context": {
        "projectId": "1",
        "assetUrls": [],
        "characterId": null
      }
    }
  }
}
```

**响应（SSE格式）**:
```
event: message_start
data: {"sessionId": "sess_abc123", "type": "message_start"}

event: thinking
data: {"content": "正在分析角色信息...", "type": "thinking"}

event: content
data: {"type": "text", "delta": "根据您的要求，我...", "type": "content"}

event: content
data: {"type": "batch_action", "actions": [{"type": "asset_update", "data": {...}}], "type": "content"}

event: message_end
data: {"sessionId": "sess_abc123", "type": "message_end"}
```

### 3.2 项目保存

**接口**: `POST /api/projects/{id}/save`
**请求**:
```json
{
  "title": "我的项目",
  "config": "{\"stages\":{\"script\":{...},\"character\":[...]}}"
}
```

### 3.3 资产库

**接口**: `GET /api/v1/projects/{id}/assets`
**响应**:
```json
{
  "success": true,
  "data": {
    "assets": [...],
    "total": 10
  }
}
```

---

## 六、资产库功能测试

### 6.1 组件结构
- **主组件**: `AssetLibrary.jsx`
- **子组件**: `ProjectSelector`, `AssetCard`, `ProjectGroup`, `AssetDetail`

### 6.2 功能列表

| 功能 | 前端组件 | 后端接口 | 期望响应数据 |
|------|---------|---------|-------------|
| **打开/关闭资产库** | TopBar (资产按钮) | 无 | - |
| **搜索资产** | AssetLibrary | 无（前端过滤） | - |
| **项目切换** | ProjectSelector | 无（前端状态） | - |
| **分类 Tab 筛选** | AssetLibrary | 无（前端过滤） | - |
| **资产列表（按项目分组）** | ProjectGroup | `GET /api/v1/projects/{id}/assets` | AssetDTO.AssetListResponse |
| **展开/折叠项目组** | ProjectGroup | 无 | - |
| **选择资产** | AssetCard | 无 | - |
| **查看资产详情** | AssetDetail | 无（前端面板） | - |
| **复制内容** | AssetDetail | 无（剪贴板API） | - |
| **添加到故事板** | AssetDetail | 无（回调） | - |
| **拖拽资产** | AssetCard | 无（dataTransfer） | - |

### 6.3 数据格式

**资产库 Props**:
```typescript
interface AssetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: { id: string, name: string };
  projects: { id: string, name: string }[];
  onProjectChange: (projectId: string) => void;
  assets?: Asset[];
  onAssetSelect?: (asset: Asset) => void;
  onAssetDrag?: (asset: Asset) => void;
  onAssetAddToStoryboard?: (asset: Asset) => void;
}

interface Asset {
  id: string;
  projectId: string;
  name: string;
  type: 'character' | 'scene' | 'prop' | 'video' | 'script';
  content: string;
  thumbnail?: string;
  createTime: string;
}
```

### 6.4 筛选逻辑

| 条件 | 行为 |
|------|------|
| 默认状态（当前项目有效） | 只显示当前项目的资产，按项目分组 |
| Demo模式/无项目ID | 显示所有资产，按项目分组 |
| 分类 Tab | 在当前范围内筛选（当前项目或全部） |
| 搜索 | 跨所有项目搜索，结果按项目分组 |

### 6.5 交互规格

| 交互 | 行为 |
|------|------|
| 点击项目组头 | 折叠/展开该项目组的资产列表 |
| 点击资产卡片 | 打开详情面板（右侧滑入） |
| 拖拽资产卡片 | 触发 `onAssetDrag` 回调，设置 dataTransfer |
| 搜索框输入 | 实时过滤（无 debounce） |
| 选择不同项目 | 重置分类 Tab 到"全部" |
| 点击详情返回 | 关闭详情面板 |

### 6.6 资产详情面板

**显示内容**:
- 预览图（thumbnail 或占位符）
- 基本信息：名称、类型、项目、创建时间
- 描述内容（content 字段）
- 操作按钮：复制内容、添加到故事板

---

## 七、测试执行顺序

1. **启动服务**
   - 后端: `cd backend && mvn spring-boot:run`
   - 前端: `cd frontend && npm run dev`

2. **登录测试**
   - 注册账号
   - 登录
   - 检查 `GET /auth/me`

3. **项目创建测试**
   - 创建项目
   - 获取项目列表
   - 切换项目

4. **阶段功能测试**（按顺序）
   - SCRIPT → CHARACTER → SCENE → PROP → STORYBOARD → VIDEO → CLIP

5. **AI 对话测试**
   - 每个阶段的 AI 对话功能

6. **资产库测试**
   - 打开/关闭
   - 项目切换
   - 分类筛选
   - 资产选择
   - 详情查看
   - 拖拽功能

7. **综合流程测试**
   - 完整创作流程

---

## 八、已知问题（已修复）

1. ✅ **资产接口 mock 数据不完整** - 已修复
   - 位置: NodeController.getProjectAssets()
   - 修复: 后端现在在数据为空时返回 mock 数据

2. ✅ **剧本阶段 AI 对话需要模拟响应** - 已修复
   - 位置: AdeptifyController.chatCompletions()
   - 修复: 后端返回符合测试计划格式的 SSE 事件

3. ✅ **各阶段编辑器缺少保存到后端的逻辑** - 已修复
   - 前端编辑器的 onUpdate/onDelete 现在会调用后端 API
   - 已实现 POST/PUT/DELETE /api/v1/projects/{id}/assets 接口

---

## 九、新增接口（实现于 2026-04-23）

### 9.1 资产 CRUD 接口

| 功能 | 接口 | 请求数据 | 响应数据 |
|------|------|---------|---------|
| **创建资产** | `POST /api/v1/projects/{projectId}/assets` | `{name, type, description, prompt, thumbnail, uri}` | AssetResponse |
| **更新资产** | `PUT /api/v1/projects/{projectId}/assets/{assetId}` | `{name, description, prompt, thumbnail, uri, status}` | AssetResponse |
| **删除资产** | `DELETE /api/v1/projects/{projectId}/assets/{assetId}` | - | - |

**请求格式**:
```json
{
  "name": "角色名称",
  "type": "character",
  "description": "角色描述",
  "prompt": "生成 prompt"
}
```

**响应格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "角色名称",
    "type": "character",
    "description": "角色描述",
    "prompt": "生成 prompt",
    "thumbnail": null,
    "status": "READY",
    "createTime": "2026-04-23T15:41:47.770185"
  }
}
```

### 9.2 AI 对话接口（SSE）- 符合测试计划格式

**端点**: `POST /api/adeptify/v1/chat/completions`

**SSE 事件格式**:
```
event: message_start
data: {"sessionId": "sess_xxx"}

event: thinking
data: {"content": "正在分析..."}

event: content
data: {"type": "text", "delta": "生成的内容..."}

event: message_end
data: {"content": "完整内容"}
```