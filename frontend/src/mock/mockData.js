/**
 * DreamStudio 2.0 Mock 数据
 * 统一管理所有前端 mock 数据，方便后续对接后端时移除
 */

// ============================================================================
// 项目数据
// ============================================================================

export const mockProject = {
  id: 'project-001',
  name: '红发女黑客潜入数据中心',
  createdAt: '2026-04-14 10:00:00',
  updatedAt: '2026-04-14 15:30:00',
  currentVersion: 1,
};

// ============================================================================
// 对话消息数据 (Messages)
// ============================================================================

export const mockMessages = [
  {
    id: 'msg-001',
    role: 'assistant',
    content: '已为你生成了10个分镜。',
    result: '已为你生成了10个分镜。\n\n1. 镜头1：建立场景 - 繁华的赛博朋克街道\n2. 镜头2：角色登场 - 红发女黑客出现\n3. 镜头3：核心动作 - 潜入数据中心\n...',
    timestamp: '10:05:00',
    hasModification: false,
  },
  {
    id: 'msg-002',
    role: 'user',
    content: '第3镜背景太乱，要简洁一点',
    timestamp: '14:15:00',
  },
  {
    id: 'msg-003',
    role: 'assistant',
    content: '已为你调整。',
    result: '已调整第3镜背景，简化了元素，突出主体。',
    timestamp: '14:20:00',
    hasModification: true, // 关键：标记有修改
    modificationId: 'mod-001', // 对应 mockModifications 中的 S1
    shotId: 'shot-003',
  },
];

// ============================================================================
// 镜头数据 (Shots)
// ============================================================================

export const mockShots = [
  {
    id: 'shot-001',
    projectId: 'project-001',
    sequence: 1,
    name: '镜头1',
    description: '建立场景',
    thumbnailUrl: 'https://picsum.photos/seed/shot1/400/300',
    prompt: '繁华的赛博朋克街道，霓虹灯牌林立，人群拥挤，镜头缓缓推进',
    status: 'generated',
    modifiedFrom: null,
    modificationSource: null,
    consistencyId: 'scene-street',
    createdAt: '2026-04-14 10:05:00',
    updatedAt: '2026-04-14 10:05:00',
  },
  {
    id: 'shot-002',
    projectId: 'project-001',
    sequence: 2,
    name: '镜头2',
    description: '角色登场',
    thumbnailUrl: 'https://picsum.photos/seed/shot2/400/300',
    prompt: '红发女黑客出现在街道拐角，戴着墨镜，身穿皮夹克，回头张望',
    status: 'generated',
    modifiedFrom: null,
    modificationSource: null,
    consistencyId: 'char-redhair',
    createdAt: '2026-04-14 10:05:00',
    updatedAt: '2026-04-14 10:05:00',
  },
  {
    id: 'shot-003',
    projectId: 'project-001',
    sequence: 3,
    name: '镜头3',
    description: '核心动作',
    thumbnailUrl: 'https://picsum.photos/seed/shot3/400/300',
    prompt: '红发女黑客潜入数据中心内部，冷色调，简洁背景，突出主体',
    status: 'adjusted',
    modifiedFrom: 'conversation',
    modificationSource: '背景太乱，要简洁一点',
    consistencyId: 'char-redhair',
    createdAt: '2026-04-14 10:05:00',
    updatedAt: '2026-04-14 14:20:00',
  },
  {
    id: 'shot-004',
    projectId: 'project-001',
    sequence: 4,
    name: '镜头4',
    description: '高潮',
    thumbnailUrl: 'https://picsum.photos/seed/shot4/400/300',
    prompt: '红发女黑客在数据中心内部操作电脑，屏幕蓝光映照在脸上',
    status: 'generated',
    modifiedFrom: null,
    modificationSource: null,
    consistencyId: 'char-redhair',
    createdAt: '2026-04-14 10:05:00',
    updatedAt: '2026-04-14 10:05:00',
  },
  {
    id: 'shot-005',
    projectId: 'project-001',
    sequence: 5,
    name: '镜头5',
    description: '结尾',
    thumbnailUrl: 'https://picsum.photos/seed/shot5/400/300',
    prompt: '红发女黑客完成任务后离开数据中心，回头露出微笑',
    status: 'generated',
    modifiedFrom: null,
    modificationSource: null,
    consistencyId: 'char-redhair',
    createdAt: '2026-04-14 10:05:00',
    updatedAt: '2026-04-14 10:05:00',
  },
  {
    id: 'shot-006',
    projectId: 'project-001',
    sequence: 6,
    name: '镜头6',
    description: '夜景切换',
    thumbnailUrl: 'https://picsum.photos/seed/shot6/400/300',
    prompt: '城市夜景，霓虹灯闪烁，红发女黑客的身影消失在人群中',
    status: 'pending',
    modifiedFrom: null,
    modificationSource: null,
    consistencyId: 'char-redhair',
    createdAt: '2026-04-14 10:05:00',
    updatedAt: '2026-04-14 10:05:00',
  },
];

// ============================================================================
// 修改记录数据 (Modifications)
// ============================================================================

export const mockModifications = {
  // S1: 文本修改 - 对话调整镜头描述
  'shot-003-text': {
    id: 'mod-001',
    type: 'text',
    source: 'conversation',
    targetType: 'Shot',
    targetId: 'shot-003',
    timestamp: '2026-04-14 14:20:00',
    userInstruction: '背景太乱，要简洁一点',
    beforePrompt: '繁华的赛博朋克街道，霓虹灯牌林立，人群拥挤，镜头缓缓推进，红发女黑客出现在街道拐角',
    afterPrompt: '简洁的冷色调数据中心内部，突出主体红发女黑客，背景干净无杂物',
    changes: {
      removed: ['霓虹灯牌', '人群', '街道', '拥挤'],
      added: ['冷色调', '简洁背景', '突出主体'],
    },
  },

  // S2: 资产替换 - 拖拽角色卡到镜头
  'shot-002-asset': {
    id: 'mod-002',
    type: 'asset',
    source: 'storyboard',
    targetType: 'Shot',
    targetId: 'shot-002',
    timestamp: '2026-04-14 15:00:00',
    assetType: 'character',
    beforeAsset: {
      id: 'default-01',
      name: '默认女性角色',
      thumbnail: 'https://picsum.photos/seed/default-female/100/100',
    },
    afterAsset: {
      id: 'char-redhair',
      name: '红发女黑客',
      thumbnail: 'https://picsum.photos/seed/redhair/100/100',
    },
    consistencyNote: '该镜头的一致性ID已更新，后续生成将保持红发女特征',
  },

  // S3: 参数修改 - 改模型/参数
  'node-visual-param': {
    id: 'mod-003',
    type: 'parameter',
    source: 'node',
    targetType: 'Node',
    targetId: 'node-visual-001',
    timestamp: '2026-04-14 15:10:00',
    paramKey: 'model',
    paramLabel: '模型',
    beforeValue: 'DreamStudio XL',
    afterValue: 'SDXL Turbo',
    beforeNote: '质量优先，速度较慢',
    afterNote: '速度优先，质量略有下降',
    expectedImpact: '生成速度提升约3倍，细节丰富度可能降低',
  },

  // S4: 视觉调整 - AI自动优化构图
  'shot-001-visual': {
    id: 'mod-004',
    type: 'visual',
    source: 'conversation',
    targetType: 'Shot',
    targetId: 'shot-001',
    timestamp: '2026-04-14 15:20:00',
    visualType: 'composition',
    beforeImage: 'https://picsum.photos/seed/shot1-before/800/600',
    afterImage: 'https://picsum.photos/seed/shot1-after/800/600',
    beforeMeta: {
      position: '偏右',
      framing: '中景',
      angle: '平视',
    },
    afterMeta: {
      position: '居中',
      framing: '近景',
      angle: '略微俯视',
    },
    aiReason: 'AI 检测到原始构图主体偏右，自动居中并调整景别',
  },

  // S5: 批量修改 - 一次对话影响多个镜头
  'batch-night-day': {
    id: 'mod-005',
    type: 'batch',
    source: 'conversation',
    targetType: 'Shot',
    targetId: null,
    timestamp: '2026-04-14 15:30:00',
    userInstruction: '把所有夜景镜头改成白天',
    affectedShots: [
      {
        shotId: 'shot-002',
        beforeThumbnail: 'https://picsum.photos/seed/shot2-night/400/300',
        afterThumbnail: 'https://picsum.photos/seed/shot2-day/400/300',
      },
      {
        shotId: 'shot-005',
        beforeThumbnail: 'https://picsum.photos/seed/shot5-night/400/300',
        afterThumbnail: 'https://picsum.photos/seed/shot5-day/400/300',
      },
      {
        shotId: 'shot-006',
        beforeThumbnail: 'https://picsum.photos/seed/shot6-night/400/300',
        afterThumbnail: 'https://picsum.photos/seed/shot6-day/400/300',
      },
    ],
  },
};

// ============================================================================
// 节点数据 (Nodes) - 来自现有 workflowStore
// ============================================================================

export const mockNodes = [
  {
    id: 'node-script',
    name: '剧本输入',
    type: 'script',
    color: '#6366f1',
    icon: 'FileText',
    status: 'completed',
    x: 100,
    y: 300,
    data: {
      result: '第一场 日 外 城市街道\n\n繁华的都市街头...',
    },
  },
  {
    id: 'node-director',
    name: '分镜Agent',
    type: 'director',
    color: '#8b5cf6',
    icon: 'Video',
    status: 'completed',
    x: 700,
    y: 300,
    data: {
      result: '已生成10个分镜',
    },
  },
  {
    id: 'node-visual-001',
    name: '场景美术Agent',
    type: 'visual',
    color: '#06b6d4',
    icon: 'Palette',
    status: 'completed',
    x: 1300,
    y: 300,
    data: {
      overallStyle: '赛博朋克、霓虹灯光、高科技感。整体色调偏暗，以蓝色和紫色为主光源，辅以霓虹灯光营造未来都市氛围。',
      characters: [
        {
          name: '零',
          description: '红发女黑客，身穿战术外套，佩戴智能眼镜，眼神坚定',
          thumbnail: 'https://picsum.photos/seed/char_zero/400/300',
        },
        {
          name: '安保人员A',
          description: '高大男性，穿着标准安保制服，手持电击棒，表情严肃',
          thumbnail: 'https://picsum.photos/seed/char_guard/400/300',
        },
        {
          name: 'AI管理员',
          description: '全息投影的蓝色光球，代表数据中心的控制系统',
          thumbnail: 'https://picsum.photos/seed/char_ai/400/300',
        },
      ],
      scenes: [
        {
          name: '数据中心',
          description: '高科技数据中心，服务器密集排列，蓝光闪烁，雾气缭绕',
          thumbnail: 'https://picsum.photos/seed/scene_datacenter/400/300',
        },
        {
          name: '霓虹雨夜街道',
          description: '赛博朋克风格雨夜街道，霓虹广告牌倒映在积水之中',
          thumbnail: 'https://picsum.photos/seed/scene_street/400/300',
        },
        {
          name: '数据中心走廊',
          description: '狭长的数据中心走廊，紧急照明灯闪烁',
          thumbnail: 'https://picsum.photos/seed/scene_corridor/400/300',
        },
      ],
      props: [
        {
          name: '黑客终端',
          description: '便携式黑客设备，可接入任何终端，支持无线入侵',
          thumbnail: 'https://picsum.photos/seed/prop_hacker/400/300',
        },
        {
          name: '干扰器',
          description: '电磁脉冲装置，可瞬间瘫痪方圆十米内的电子设备',
          thumbnail: 'https://picsum.photos/seed/prop_emp/400/300',
        },
        {
          name: '数据芯片',
          description: '高密度存储芯片，存储容量达PB级，外形小巧',
          thumbnail: 'https://picsum.photos/seed/prop_chip/400/300',
        },
      ],
    },
  },
  {
    id: 'node-char-001',
    name: '角色美术',
    type: 'character',
    color: '#f59e0b',
    icon: 'User',
    status: 'completed',
    x: 1300,
    y: 500,
    data: {
      result: '角色设计完成',
    },
  },
  {
    id: 'node合成',
    name: '合成节点',
    type: 'compose',
    color: '#ec4899',
    icon: 'Layers',
    status: 'pending',
    x: 1900,
    y: 400,
    data: {},
  },
];

export const mockConnections = [
  { id: 'conn-1', from: 'node-script', fromPort: 'output', to: 'node-director', toPort: 'input', type: 'data-flow' },
  { id: 'conn-2', from: 'node-director', fromPort: 'output', to: 'node-visual-001', toPort: 'input', type: 'data-flow' },
  { id: 'conn-3', from: 'node-visual-001', fromPort: 'output', to: 'node合成', toPort: 'input', type: 'data-flow' },
  { id: 'conn-4', from: 'node-char-001', fromPort: 'output', to: 'node合成', toPort: 'input', type: 'data-flow' },
];

// ============================================================================
// 资产数据 (Assets)
// ============================================================================

export const mockAssets = {
  characters: [
    {
      id: 'char-redhair',
      name: '红发女黑客',
      category: '角色卡',
      thumbnail: 'https://picsum.photos/seed/redhair/200/200',
      is常用: true,
      consistencyId: 'char-redhair',
    },
    {
      id: 'char-guard',
      name: '保安',
      category: '角色卡',
      thumbnail: 'https://picsum.photos/seed/guard/200/200',
      is常用: false,
      consistencyId: 'char-guard',
    },
    {
      id: 'char-default',
      name: '默认女性角色',
      category: '角色卡',
      thumbnail: 'https://picsum.photos/seed/default-female/200/200',
      is常用: false,
      consistencyId: 'default-01',
    },
  ],
  scenes: [
    {
      id: 'scene-datacenter',
      name: '数据中心',
      category: '场景',
      thumbnail: 'https://picsum.photos/seed/datacenter/200/200',
      is常用: true,
    },
    {
      id: 'scene-street',
      name: '赛博朋克街道',
      category: '场景',
      thumbnail: 'https://picsum.photos/seed/cyber-street/200/200',
      is常用: true,
    },
    {
      id: 'scene-office',
      name: '办公室',
      category: '场景',
      thumbnail: 'https://picsum.photos/seed/office/200/200',
      is常用: false,
    },
  ],
  styles: [
    {
      id: 'style-cyberpunk',
      name: '赛博朋克',
      category: '风格',
      thumbnail: 'https://picsum.photos/seed/cyber/200/200',
    },
    {
      id: 'style-realistic',
      name: '写实',
      category: '风格',
      thumbnail: 'https://picsum.photos/seed/realistic/200/200',
    },
  ],
};

// ============================================================================
// 版本数据
// ============================================================================

export const mockVersions = [
  {
    id: 'current',
    name: 'V1.0',
    versionNumber: 1,
    description: '当前版本',
    createdAt: '2026-04-14 15:30:00',
    isDefault: true,
  },
  {
    id: 'v3',
    name: 'V0.3',
    versionNumber: 3,
    description: '镜头3背景简化',
    createdAt: '2026-04-14 14:20:00',
    isDefault: false,
  },
  {
    id: 'v2',
    name: 'V0.2',
    versionNumber: 2,
    description: '角色替换',
    createdAt: '2026-04-14 12:00:00',
    isDefault: false,
  },
  {
    id: 'v1',
    name: 'V0.1',
    versionNumber: 1,
    description: '初始版本',
    createdAt: '2026-04-14 10:00:00',
    isDefault: false,
  },
];

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 根据 ID 获取镜头
 */
export const getShotById = (shotId) => mockShots.find((s) => s.id === shotId);

/**
 * 根据类型获取修改记录
 */
export const getModificationsByTarget = (targetType, targetId) => {
  return Object.values(mockModifications).filter(
    (m) => m.targetType === targetType && m.targetId === targetId
  );
};

/**
 * 根据 shotId 获取最新修改记录
 */
export const getLatestModification = (shotId) => {
  return Object.values(mockModifications)
    .filter((m) => m.targetId === shotId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
};

/**
 * 检查镜头是否有修改
 */
export const hasModification = (shotId) => {
  return mockShots.some((s) => s.id === shotId && s.modifiedFrom !== null);
};
