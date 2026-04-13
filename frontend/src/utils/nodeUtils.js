/**
 * 节点工具函数
 */

import { CANVAS, DEFAULT_NODE_WIDTH } from '../constants/layoutConstants';

/**
 * BFS 遍历图查找相连节点
 * @param {string} startId - 起始节点 ID
 * @param {Array} connections - 连接数组 [{from, to}, ...]
 * @param {'downstream'|'upstream'} direction - 遍历方向
 * @returns {Set} 相连节点 ID 的集合
 */
export const traverseConnectedNodes = (startId, connections, direction) => {
  const result = new Set();
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    connections.forEach(conn => {
      let nextId = null;
      if (direction === 'downstream' && conn.from === currentId && !result.has(conn.to)) {
        nextId = conn.to;
      } else if (direction === 'upstream' && conn.to === currentId && !result.has(conn.from)) {
        nextId = conn.from;
      }
      if (nextId) {
        result.add(nextId);
        queue.push(nextId);
      }
    });
  }

  return result;
};

/**
 * 根据 fieldPath 修改数据的辅助函数
 */
export const applyFieldChanges = (data, changes) => {
  if (!changes || !changes.length) return data || {};
  if (!data) return {};

  const result = JSON.parse(JSON.stringify(data)); // 深拷贝

  changes.forEach(change => {
    // 后端使用 key，前端期望 fieldPath，兼容两者
    const fieldPath = change.fieldPath || change.key || '';
    const after = change.after || change.afterValue;
    if (!fieldPath) return;

    const keys = fieldPath.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = after;
  });

  return result;
};

// 节点默认宽度（统一值）
export const getDefaultNodeWidth = () => DEFAULT_NODE_WIDTH;

// 计算节点位置 - 横向排列，间距基于前一个节点的 endX
export const calculateNodePositions = (nodes, options = {}) => {
  const {
    startX = CANVAS.START_X,
    startY = CANVAS.START_Y,
    gap = CANVAS.NODE_GAP,
  } = options;

  let currentX = startX;

  return nodes.map((node) => {
    const nodeWidth = getDefaultNodeWidth(node.type || node.agentCode);
    const x = currentX;
    currentX = x + nodeWidth + gap;

    return {
      ...node,
      x,
      y: startY,
    };
  });
};

// 计算模板节点位置
export const calculateTemplateNodePositions = (columns, startX = CANVAS.START_X, startY = CANVAS.START_Y, gap = CANVAS.NODE_GAP) => {
  const nodes = [];
  let currentX = startX;

  columns.forEach((column) => {
    const { type, name, color, icon } = column;
    const nodeWidth = getDefaultNodeWidth(type);

    nodes.push({
      id: type,
      name: name,
      type: type,
      x: currentX,
      y: startY,
      color: color,
      icon: icon,
      data: {}
    });

    currentX += nodeWidth + gap;
  });

  return nodes;
};

// 思考内容生成
export const generateThinkingContent = (nodeType) => {
  const thinkings = {
    producer: ['正在分析项目可行性...', '评估预算和资源需求...', '制定项目时间线...', '生成项目立项书...'],
    content: ['构建故事框架...', '设计角色弧线...', '编写分场剧本...', '优化对白和节奏...'],
    visual: ['分析视觉风格参考...', '生成概念草图...', '优化色彩和构图...', '输出文生图指令...'],
    director: ['分析剧本节奏...', '设计镜头语言...', '规划运镜方案...', '生成分镜脚本...'],
    technical: ['解析视觉输入...', '优化视频提示词...', '配置生成参数...', '打包输出指令...'],
    auditor: ['审核内容质量...', '检查合规性...', '评估技术指标...', '生成审核报告...']
  };
  return thinkings[nodeType] || ['处理中...', '分析输入...', '生成输出...'];
};

// 结果内容生成
export const generateResultContent = (nodeType) => {
  const results = {
    producer: '项目立项完成，预算500万，周期6个月',
    content: '第一场 日 外 城市街道\n\n繁华的都市街头，人来人往...',
    visual: '概念美术完成，8张关键场景图',
    director: '分镜脚本完成，45个镜头设计',
    technical: '视频提示词包生成，15组指令',
    auditor: '审核通过，质量评分92/100'
  };
  return results[nodeType] || '任务执行完成';
};
