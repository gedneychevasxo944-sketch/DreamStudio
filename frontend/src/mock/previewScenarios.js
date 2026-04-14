/**
 * 预览面板场景模拟数据
 *
 * 用于开发和测试 RightPreviewPanel 的不同展示场景
 */

import { PREVIEW_MODE } from '../components/RightPreviewPanel';

// 使用 picsum.photos 作为占位图
const placeholderImages = {
  character1: 'https://picsum.photos/seed/cyberpunk1/400/300',
  character2: 'https://picsum.photos/seed/character2/400/300',
  character3: 'https://picsum.photos/seed/character3/400/300',
  scene1: 'https://picsum.photos/seed/datacenter/400/300',
  scene2: 'https://picsum.photos/seed/street/400/300',
  scene3: 'https://picsum.photos/seed/neoncity/400/300',
  scene4: 'https://picsum.photos/seed/office/400/300',
  prop1: 'https://picsum.photos/seed/terminal/400/300',
  shot1: 'https://picsum.photos/seed/shot1/200/120',
  shot2: 'https://picsum.photos/seed/shot2/200/120',
  shot3: 'https://picsum.photos/seed/shot3/200/120',
  shot4: 'https://picsum.photos/seed/shot4/200/120',
  avatar1: 'https://picsum.photos/seed/avatar1/80/80',
  avatar2: 'https://picsum.photos/seed/avatar2/80/80',
  avatar3: 'https://picsum.photos/seed/avatar3/80/80',
};

// 模拟子图节点数据
const mockNodes = {
  character: [
    { id: 'node-1', name: '角色设计', type: 'visual' },
    { id: 'node-2', name: 'Prompt优化', type: 'content' },
    { id: 'node-3', name: '高清渲染', type: 'videoGen' },
  ],
  scene: [
    { id: 'node-1', name: '场景构图', type: 'director' },
    { id: 'node-2', name: '环境光照', type: 'visual' },
    { id: 'node-3', name: '氛围渲染', type: 'videoGen' },
  ],
  prop: [
    { id: 'node-1', name: '道具建模', type: 'technical' },
    { id: 'node-2', name: '材质贴图', type: 'visual' },
  ],
  shot: [
    { id: 'node-1', name: '分镜设计', type: 'director' },
    { id: 'node-2', name: '镜头运动', type: 'technical' },
    { id: 'node-3', name: '光效合成', type: 'videoGen' },
    { id: 'node-4', name: '最终输出', type: 'videoEditor' },
  ],
};

// ============================================================================
// 场景一：单一资产
// ============================================================================
export const SCENARIO_SINGLE_ASSET = {
  mode: PREVIEW_MODE.SINGLE_ASSET,
  asset: {
    id: 'asset-001',
    name: '赛博朋克红发女概念图',
    type: 'character',
    thumbnail: placeholderImages.character1,
    prompt: 'cyberpunk female hacker with red hair, neon lights, dark city background, highly detailed, 8k',
    model: 'DreamStudio XL',
    seed: 12345678,
    createdAt: '2026-04-15T10:30:00Z',
  },
  assets: [{
    id: 'asset-001',
    name: '赛博朋克红发女概念图',
    type: 'character',
    thumbnail: placeholderImages.character1,
    subgraphNodes: mockNodes.character,
  }],
  subgraphNodes: mockNodes.character,
  script: null,
  shots: [],
};

// ============================================================================
// 场景二：多资产网格
// ============================================================================
export const SCENARIO_ASSET_GRID = {
  mode: PREVIEW_MODE.ASSET_GRID,
  asset: null,
  assets: [
    {
      id: 'asset-001',
      name: '红发女黑客',
      type: 'character',
      thumbnail: placeholderImages.character1,
      favorite: true,
      subgraphNodes: mockNodes.character,
    },
    {
      id: 'asset-002',
      name: '数据中心场景',
      type: 'scene',
      thumbnail: placeholderImages.scene1,
      favorite: false,
      subgraphNodes: mockNodes.scene,
    },
    {
      id: 'asset-003',
      name: '安保人员A',
      type: 'character',
      thumbnail: placeholderImages.character2,
      favorite: false,
      subgraphNodes: mockNodes.character,
    },
    {
      id: 'asset-004',
      name: '服务器终端',
      type: 'prop',
      thumbnail: placeholderImages.prop1,
      favorite: false,
      subgraphNodes: mockNodes.prop,
    },
    {
      id: 'asset-005',
      name: '城市街道',
      type: 'scene',
      thumbnail: placeholderImages.scene2,
      favorite: false,
      subgraphNodes: mockNodes.scene,
    },
    {
      id: 'asset-006',
      name: '霓虹雨夜',
      type: 'scene',
      thumbnail: placeholderImages.scene3,
      favorite: false,
      subgraphNodes: mockNodes.scene,
    },
  ],
  subgraphNodes: {
    'asset-001': mockNodes.character,
    'asset-002': mockNodes.scene,
    'asset-003': mockNodes.character,
    'asset-004': mockNodes.prop,
    'asset-005': mockNodes.scene,
    'asset-006': mockNodes.scene,
  },
  script: null,
  shots: [],
};

// ============================================================================
// 场景三：剧本编辑器
// ============================================================================
export const SCENARIO_SCRIPT_EDITOR = {
  mode: PREVIEW_MODE.SCRIPT_EDITOR,
  asset: null,
  assets: [],
  subgraphNodes: {},
  script: {
    title: '第1集：潜入开始',
    episodes: [
      {
        id: 'ep1',
        title: '第1集：潜入开始',
        scenes: [
          {
            id: 'scene-1',
            title: '场景1：数据中心办公室 - 夜',
            content: '红发女黑客轻手轻脚地绕过监控摄像头，屏幕上闪烁着密密麻麻的代码。她的目标是三层加密的财务数据库。\n\n她快速输入一串指令，防火墙的警示灯开始闪烁。',
            location: '数据中心办公室',
            time: '夜',
          },
          {
            id: 'scene-2',
            title: '场景2：服务器机房 - 接续',
            content: '她插入数据线，屏幕开始剧烈闪烁，突然，警报响起！\n"检测到入侵者！安保系统已触发！"\n\n红发女快速拔出数据线，向紧急出口奔去。身后传来脚步声越来越近...',
            location: '服务器机房',
            time: '接续',
          },
          {
            id: 'scene-3',
            title: '场景3：逃离通道 - 接续',
            content: '她翻身跃过障碍物，在走廊尽头发现一部电梯。\n"该死，电梯停了！" 她不得不选择楼梯。\n\n楼梯间里回响着沉重的脚步声，她屏住呼吸...',
            location: '逃离通道',
            time: '接续',
          },
        ],
      },
      {
        id: 'ep2',
        title: '第2集：追逃',
        scenes: [
          {
            id: 'scene-4',
            title: '场景4：地下停车场 - 日',
            content: '清晨的阳光从停车场入口倾泻而下。红发女终于逃出了大楼，但她的车被堵在了最里面。\n\n远处传来警笛声...',
            location: '地下停车场',
            time: '日',
          },
          {
            id: 'scene-5',
            title: '场景5：城市街道 - 日',
            content: '她劫持了一辆摩托车，在城市街道上疾驰。追踪她的无人机在头顶盘旋。\n\n"警告：目标正在向东部地区移动。"',
            location: '城市街道',
            time: '日',
          },
        ],
      },
    ],
  },
  shots: [],
};

// ============================================================================
// 场景四：序列模式（故事板）
// ============================================================================
export const SCENARIO_SEQUENCE = {
  mode: PREVIEW_MODE.SEQUENCE,
  asset: null,
  assets: [],
  subgraphNodes: {},
  script: {
    title: '第1集：潜入开始',
    content: '红发女黑客潜入数据中心，目标是三层加密的财务数据库...',
  },
  shots: [
    {
      id: 'scene-1',
      name: '场景1：数据中心办公室',
      shots: [
        { id: 'shot-1', label: 'Shot 1 - 建立', thumbnail: placeholderImages.shot1, type: 'image' },
        { id: 'shot-2', label: 'Shot 2 - 入侵', thumbnail: placeholderImages.shot2, type: 'image' },
      ],
    },
    {
      id: 'scene-2',
      name: '场景2：服务器机房',
      shots: [
        { id: 'shot-3', label: 'Shot 3 - 警报', thumbnail: placeholderImages.shot3, type: 'video' },
        { id: 'shot-4', label: 'Shot 4 - 逃离', thumbnail: placeholderImages.shot4, type: 'image' },
      ],
    },
    {
      id: 'scene-3',
      name: '场景3：逃离通道',
      shots: [
        { id: 'shot-5', label: 'Shot 5 - 追逐', thumbnail: placeholderImages.shot1, type: 'video' },
        { id: 'shot-6', label: 'Shot 6 - 消失', thumbnail: placeholderImages.shot2, type: 'image' },
      ],
    },
  ],
  characters: [
    { id: 'char-1', name: '红发女黑客', role: '主角', avatar: placeholderImages.avatar1 },
    { id: 'char-2', name: '安保人员A', role: '配角', avatar: placeholderImages.avatar2 },
    { id: 'char-3', name: 'AI防御系统', role: '道具', avatar: placeholderImages.avatar3 },
  ],
};

// ============================================================================
// 场景管理
// ============================================================================

export function detectScenarioFromInput(userInput) {
  if (!userInput) return null;
  const input = userInput.toLowerCase();

  if (input.includes('一张图') || input.includes('一个人物')) return SCENARIO_SINGLE_ASSET;
  if (input.includes('角色卡') || input.includes('场景图')) return SCENARIO_ASSET_GRID;
  if (input.includes('剧本') || input.includes('脚本')) return SCENARIO_SCRIPT_EDITOR;
  if (input.includes('分镜') || input.includes('镜头')) return SCENARIO_SEQUENCE;

  return SCENARIO_ASSET_GRID;
}

export function getScenario(scenarioName) {
  const scenarios = {
    single_asset: SCENARIO_SINGLE_ASSET,
    asset_grid: SCENARIO_ASSET_GRID,
    script_editor: SCENARIO_SCRIPT_EDITOR,
    sequence: SCENARIO_SEQUENCE,
  };
  return scenarios[scenarioName] || null;
}

export function getAllScenarios() {
  return {
    single_asset: SCENARIO_SINGLE_ASSET,
    asset_grid: SCENARIO_ASSET_GRID,
    script_editor: SCENARIO_SCRIPT_EDITOR,
    sequence: SCENARIO_SEQUENCE,
  };
}
