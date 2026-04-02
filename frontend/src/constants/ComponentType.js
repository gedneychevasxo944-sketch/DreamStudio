// 组件类型常量 - 与后端 ComponentType 枚举对应

export const COMPONENT_TYPE = {
  // 主节点
  ASSISTANT: 'assistant',
  PRODUCER: 'producer',
  CONTENT: 'content',
  VISUAL: 'visual',
  DIRECTOR: 'director',
  TECHNICAL: 'technical',
  VIDEO_GEN: 'videoGen',
  VIDEO_EDITOR: 'videoEditor',
};

export const COMPONENT_INFO = {
  [COMPONENT_TYPE.ASSISTANT]: { name: '智能助理', color: '#6366f1', icon: 'Bot' },
  [COMPONENT_TYPE.PRODUCER]: { name: '资深影视制片人', color: '#3b82f6', icon: 'Target' },
  [COMPONENT_TYPE.CONTENT]: { name: '金牌编剧', color: '#06b6d4', icon: 'PenTool' },
  [COMPONENT_TYPE.VISUAL]: { name: '概念美术总监', color: '#8b5cf6', icon: 'Palette' },
  [COMPONENT_TYPE.DIRECTOR]: { name: '分镜导演', color: '#f59e0b', icon: 'Video' },
  [COMPONENT_TYPE.TECHNICAL]: { name: '视频提示词工程师', color: '#10b981', icon: 'Code' },
  [COMPONENT_TYPE.VIDEO_GEN]: { name: '视频生成', color: '#6366f1', icon: 'Play' },
  [COMPONENT_TYPE.VIDEO_EDITOR]: { name: '视频剪辑', color: '#a855f7', icon: 'Scissors' },
};
