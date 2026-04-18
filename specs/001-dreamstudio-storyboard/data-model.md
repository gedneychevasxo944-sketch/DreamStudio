# Data Model: DreamStudio 2.0 前端数据结构

**Date**: 2026-04-17
**Feature**: DreamStudio 2.0 故事板创作系统

---

## 1. 核心类型定义

### 1.1 阶段类型

```typescript
type StageType = 'script' | 'character' | 'scene' | 'prop' | 'storyboard' | 'video';

const STAGES: StageType[] = ['script', 'character', 'scene', 'prop', 'storyboard', 'video'];

const STAGE_LABELS: Record<StageType, string> = {
  script: '剧本',
  character: '角色',
  scene: '场景',
  prop: '道具',
  storyboard: '分镜',
  video: '视频',
};

const STAGE_COLORS: Record<StageType, { day: string; night: string }> = {
  script: { day: '#3B82F6', night: '#60A5FA' },
  character: { day: '#EC4899', night: '#F472B6' },
  scene: { day: '#10B981', night: '#34D399' },
  prop: { day: '#F59E0B', night: '#FBBF24' },
  storyboard: { day: '#8B5CF6', night: '#A78BFA' },
  video: { day: '#EF4444', night: '#F87171' },
};
```

### 1.2 项目

```typescript
interface Project {
  id: string;
  name: string;
  currentStage: StageType;
  stages: Record<StageType, StageData>;
  createdAt: string;
  updatedAt: string;
}

interface StageData {
  assets: Asset[];
  completion: boolean;
}
```

### 1.3 资产

```typescript
interface Asset {
  id: string;
  projectId: string;
  type: StageType;
  name: string;
  content: AssetContent;
  workflowBinding: WorkflowBinding;
  resources: Resource[];
  // 资产被哪些资产引用（用于影响追踪）
  // 例如：角色资产被分镜 A、B 引用
  // 修改角色时，查询 referencedBy 得知需重新生成分镜 A、B
  referencedBy: Array<{
    assetId: string;
    stage: StageType;
    context?: string; // 例如"作为主角出现"
  }>;
  createdAt: string;
  updatedAt: string;
}

type AssetContent =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; prompt?: string }
  | { type: 'video'; url: string; duration?: number }
  | { type: 'parameters'; params: Record<string, any> };

interface WorkflowBinding {
  workflowId: string;
  versionId: string;
}
```

### 1.4 资源

```typescript
interface Resource {
  id: string;
  assetId?: string;
  type: 'upload' | 'ai_generated';
  fileType: 'image' | 'video' | 'text' | 'pdf';
  url: string;
  aiProcessed: boolean;
  aiDescription?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
```

### 1.5 对话

```typescript
interface ChatSession {
  id: string;
  contextType: 'project' | 'asset' | 'workflow' | 'node';
  contextId?: string;
  contextName?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Resource[];
  recommendations?: string[];
  actions?: MessageAction[];
  createdAt: string;
}

interface MessageAction {
  type: 'confirm' | 'cancel' | 'link';
  label: string;
  value?: string;
}
```

### 1.6 工作流

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  graph: WorkflowGraph;
  isTemplate: boolean;
  isSystem: boolean;
  linkedAssets: string[];
  createdAt: string;
  updatedAt: string;
}

interface WorkflowGraph {
  nodes: WorkflowNode[];
  connections: Connection[];
}

interface WorkflowNode {
  id: string;
  type: 'textgen' | 'imagegen' | 'videogen' | 'control' | 'transform';
  position: { x: number; y: number };
  config: NodeConfig;
  inputs: Port[];
  outputs: Port[];
}

interface Port {
  id: string;
  name: string;
  type: string;
}

interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}
```

---

## 2. Zustand Stores

### 2.1 projectStore (扩展)

```typescript
interface ProjectState {
  // 现有字段
  currentProjectId: string | null;
  projectName: string;
  currentVersion: string;

  // 新增
  projects: Project[];
  currentProject: Project | null;

  // 方法
  createProject: (name: string) => Project;
  switchProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
}
```

### 2.2 stageStore (扩展)

```typescript
interface StageState {
  // 现有字段
  currentStage: StageType;
  stageAssets: Record<StageType, Asset[]>;
  selectedAssetId: string | null;
  stageCompletion: Record<StageType, boolean>;

  // 新增
  stageLoading: Record<StageType, boolean>;

  // 方法
  setCurrentStage: (stage: StageType) => void;
  selectAsset: (assetId: string | null) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  setStageAssets: (stage: StageType, assets: Asset[]) => void;
}
```

### 2.3 chatStore (新增)

```typescript
interface ChatState {
  // 当前会话
  currentSession: ChatSession | null;

  // 所有会话（按上下文分组）
  sessions: Record<string, ChatSession>;

  // 浮窗状态
  isFloatingOpen: boolean;
  floatingPosition: { x: number; y: number };
  floatingSize: { width: number; height: number };
  isDocked: 'left' | 'right' | 'bottom' | null;

  // 方法
  switchContext: (type: ChatContext['type'], id?: string, name?: string) => void;
  sendMessage: (content: string, attachments?: Resource[]) => Promise<void>;
  toggleFloating: () => void;
  setFloatingPosition: (pos: { x: number; y: number }) => void;
  dockFloating: (edge: 'left' | 'right' | 'bottom') => void;
}
```

### 2.4 themeStore (新增)

```typescript
interface ThemeState {
  mode: 'day' | 'night' | 'system';
  resolved: 'day' | 'night';

  // 方法
  setMode: (mode: 'day' | 'night' | 'system') => void;
  toggle: () => void;
}
```

---

## 3. 组件 Props 接口

### 3.1 StoryboardMainView

```typescript
interface StoryboardMainViewProps {
  projectId: string;
  onNavigateToCanvas: (assetId?: string) => void;
}
```

### 3.2 AssetDetailPanel

```typescript
interface AssetDetailPanelProps {
  asset: Asset | null;
  onUpdate: (updates: Partial<Asset>) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
  onAICreate: () => void;
}
```

### 3.3 FloatingAssistant

```typescript
interface FloatingAssistantProps {
  // 从 storyboardStore 读取
  contextType: 'project' | 'asset' | 'workflow' | 'node' | null;
  contextId: string | null;
  contextName: string | null;

  // 从 chatStore 读取
  messages: Message[];
  isLoading: boolean;
  recommendations: string[];

  // Actions
  onSend: (content: string, attachments?: Resource[]) => void;
  onRecommendationClick: (text: string) => void;
  onClose: () => void;
}
```

---

## 4. 事件定义

```typescript
// 全局事件（通过 eventBus）
const STORYBOARD_EVENTS = {
  STAGE_CHANGE: 'stage_change',
  ASSET_SELECT: 'asset_select',
  ASSET_UPDATE: 'asset_update',
  ASSET_CREATE: 'asset_create',
  CHAT_CONTEXT_CHANGE: 'chat_context_change',
  THEME_CHANGE: 'theme_change',
};
```
