import { STAGES } from '../stores/stageStore';

// Mock 数据 - 各阶段资产
export const mockStageAssets = {
  [STAGES.SCRIPT]: [
    {
      id: 'script-1',
      type: STAGES.SCRIPT,
      name: '第一集剧本',
      content: `第一幕：深夜，数据中心

红发女黑客"零"正在一台终端前快速敲击键盘。她的动作干净利落，眼神专注而锐利。

场景1：数据中心内部
- 角色：零（主角）
- 场景：霓虹闪烁的数据中心
- 氛围：赛博朋克风格，霓虹灯光与阴影交错

第二幕：安保出现

就在零即将完成入侵时，安保人员A出现在走廊尽头。零迅速藏身于服务器之间。

场景2：追逐
- 角色：零、安保人员A
- 运镜：跟拍、快速切换
- 时长：15秒

第三幕：成功脱身

零利用提前设置好的干扰器成功摆脱追踪，带着数据消失在雨夜中。

结局：镜头定格在零消失的方向，霓虹灯闪烁。`,
    },
  ],

  [STAGES.CHARACTER]: [
    {
      id: 'char-1',
      type: STAGES.CHARACTER,
      name: '零',
      description: '红发女黑客，年龄约20-25岁，身手敏捷，擅长潜入和破解',
      prompt: 'cyberpunk female hacker, red hair, wearing high-tech visor, black leather jacket, neon lighting, dark background, highly detailed, 8k',
      thumbnail: 'https://picsum.photos/seed/char1/400/225',
      status: 'synced',
    },
    {
      id: 'char-2',
      type: STAGES.CHARACTER,
      name: '安保人员A',
      description: '高大的男性安保人员，穿着制服，手持电击棒',
      prompt: 'tall male security guard, uniform, flashlight, serious expression, dimly lit corridor',
      thumbnail: 'https://picsum.photos/seed/char2/400/225',
      status: 'synced',
    },
    {
      id: 'char-3',
      type: STAGES.CHARACTER,
      name: 'AI管理员',
      description: '数据中心的中控AI，外形为一个全息投影的蓝色光球',
      prompt: 'holographic AI, blue glowing orb, data streams, futuristic, floating, ethereal',
      thumbnail: null,
      status: 'modified',
    },
  ],

  [STAGES.SCENE]: [
    {
      id: 'scene-1',
      type: STAGES.SCENE,
      name: '数据中心',
      description: '高科技数据中心，服务器密集，蓝色霓虹灯光',
      prompt: 'cyberpunk data center, rows of servers, blue neon lights, fog, highly detailed, cinematic lighting',
      thumbnail: 'https://picsum.photos/seed/scene1/400/225',
      status: 'synced',
    },
    {
      id: 'scene-2',
      type: STAGES.SCENE,
      name: '霓虹雨夜街道',
      description: '赛博朋克风格的雨夜街道，霓虹灯广告牌倒映在积水',
      prompt: 'cyberpunk rainy street, neon signs reflecting on wet ground, rain, atmospheric, cinematic',
      thumbnail: 'https://picsum.photos/seed/scene2/400/225',
      status: 'synced',
    },
    {
      id: 'scene-3',
      type: STAGES.SCENE,
      name: '走廊',
      description: '数据中心内部走廊，灯光昏暗',
      prompt: 'dark corridor in data center, dim emergency lighting, security cameras',
      thumbnail: null,
      status: 'running',
    },
  ],

  [STAGES.PROP]: [
    {
      id: 'prop-1',
      type: STAGES.PROP,
      name: '黑客终端',
      description: '便携式黑客设备，可接入任何终端进行入侵',
      prompt: 'hacking device, portable terminal, cyberpunk style, glowing screen, tech details',
      thumbnail: 'https://picsum.photos/seed/prop1/400/225',
      status: 'synced',
    },
    {
      id: 'prop-2',
      type: STAGES.PROP,
      name: '干扰器',
      description: '可发射电磁脉冲干扰监控设备的小型装置',
      prompt: 'EMP device, small handheld, blinking lights, cyberpunk gadget',
      thumbnail: 'https://picsum.photos/seed/prop2/400/225',
      status: 'synced',
    },
    {
      id: 'prop-3',
      type: STAGES.PROP,
      name: '数据芯片',
      description: '存储窃取数据的高密度芯片',
      prompt: 'data chip, small storage device, glowing circuit patterns',
      thumbnail: null,
      status: 'modified',
    },
  ],

  [STAGES.STORYBOARD]: [
    {
      id: 'shot-1',
      type: STAGES.STORYBOARD,
      label: '镜头 1',
      scriptParagraph: '红发女黑客"零"正在一台终端前快速敲击键盘...',
      characterIds: ['char-1'],
      sceneId: 'scene-1',
      propsIds: ['prop-1'],
      shotType: 'medium',
      cameraMovement: 'static',
      duration: 5,
      prompt: 'Close-up of female hacker typing rapidly, red hair, cyberpunk aesthetic, neon lights, focused expression',
      negativePrompt: 'blurry, low quality, distorted',
      thumbnail: 'https://picsum.photos/seed/shot1/400/225',
      status: 'synced',
    },
    {
      id: 'shot-2',
      type: STAGES.STORYBOARD,
      label: '镜头 2',
      scriptParagraph: '就在零即将完成入侵时，安保人员A出现在走廊尽头...',
      characterIds: ['char-2'],
      sceneId: 'scene-3',
      propsIds: [],
      shotType: 'over_shoulder',
      cameraMovement: 'pan_right',
      duration: 3,
      prompt: 'Security guard walking down dark corridor, flashlight beam, tense atmosphere',
      negativePrompt: 'bright, cheerful',
      thumbnail: 'https://picsum.photos/seed/shot2/400/225',
      status: 'synced',
    },
    {
      id: 'shot-3',
      type: STAGES.STORYBOARD,
      label: '镜头 3',
      scriptParagraph: '零迅速藏身于服务器之间...',
      characterIds: ['char-1'],
      sceneId: 'scene-1',
      propsIds: ['prop-1'],
      shotType: 'close_up',
      cameraMovement: 'zoom_in',
      duration: 4,
      prompt: 'Hacker hiding behind server racks, tense, looking over shoulder, blue neon light',
      negativePrompt: 'blurry, noisy',
      thumbnail: 'https://picsum.photos/seed/shot3/400/225',
      status: 'modified',
    },
    {
      id: 'shot-4',
      type: STAGES.STORYBOARD,
      label: '镜头 4',
      scriptParagraph: '零利用提前设置好的干扰器成功摆脱追踪...',
      characterIds: ['char-1', 'char-2'],
      sceneId: 'scene-3',
      propsIds: ['prop-2'],
      shotType: 'wide',
      cameraMovement: 'tracking',
      duration: 6,
      prompt: 'EMP blast, security cameras short-circuiting, hacker running through corridor',
      negativePrompt: 'static camera, peaceful',
      thumbnail: null,
      status: 'running',
    },
    {
      id: 'shot-5',
      type: STAGES.STORYBOARD,
      label: '镜头 5',
      scriptParagraph: '带着数据消失在雨夜中...',
      characterIds: ['char-1'],
      sceneId: 'scene-2',
      propsIds: ['prop-3'],
      shotType: 'cowboy',
      cameraMovement: 'dolly',
      duration: 8,
      prompt: 'Hacker disappearing into rainy cyberpunk street, neon reflections, cinematic shot',
      negativePrompt: 'daylight, sunny',
      thumbnail: 'https://picsum.photos/seed/shot5/400/225',
      status: 'synced',
    },
  ],

  [STAGES.VIDEO]: [
    {
      id: 'video-1',
      type: STAGES.VIDEO,
      name: '镜头 1 视频',
      thumbnail: 'https://picsum.photos/seed/shot1/400/225',
      videoUrl: null,
      linkedShotId: 'shot-1',
      status: 'synced',
    },
    {
      id: 'video-2',
      type: STAGES.VIDEO,
      name: '镜头 2 视频',
      thumbnail: 'https://picsum.photos/seed/shot2/400/225',
      videoUrl: null,
      linkedShotId: 'shot-2',
      status: 'pending',
    },
  ],
};

// 初始化 stageStore 的 mock 数据
export const initializeMockData = (setStageAssets, setStageCompletion) => {
  Object.entries(mockStageAssets).forEach(([stage, assets]) => {
    setStageAssets(stage, assets);
  });

  // 设置阶段完成状态
  setStageCompletion(STAGES.SCRIPT, true);
  setStageCompletion(STAGES.CHARACTER, true);
  setStageCompletion(STAGES.SCENE, true);
  setStageCompletion(STAGES.PROP, false);
  setStageCompletion(STAGES.STORYBOARD, false);
  setStageCompletion(STAGES.VIDEO, false);
};
