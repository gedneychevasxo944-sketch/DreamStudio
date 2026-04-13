/**
 * 布局常量
 */

// 节点默认宽度（统一值）
export const DEFAULT_NODE_WIDTH = 360;

// 画布布局默认值
export const CANVAS = {
  START_X: 50,
  START_Y: 200,
  NODE_GAP: 100,
};

// ========== 模板节点布局常量 ==========
// 模板节点类型渲染时的位置计算
export const TEMPLATE_LAYOUT = {
  SOURCE_NODE_WIDTH: 540,   // 源节点宽度
  HORIZONTAL_GAP: 300,      // 源节点与生成节点的水平间距
  VIDEO_GEN_NODE_HEIGHT: 300, // 视频生成节点高度
  VERTICAL_GAP: 150,        // 视频生成节点之间的垂直间距
};

// ========== 工作流布局常量 ==========
// handleLoadWorkflow 时节点横向排列
export const WORKFLOW_LAYOUT = {
  START_X: 100,
  START_Y: 300,
  GAP: 150,
  NODE_WIDTH: 360,
};

// ========== 计划布局常量 ==========
// plan 节点横向排列（与 WORKFLOW_LAYOUT 相似但 gap 更小）
export const PLAN_LAYOUT = {
  START_X: 100,
  START_Y: 300,
  GAP: 100,
  NODE_WIDTH: 700,
};
