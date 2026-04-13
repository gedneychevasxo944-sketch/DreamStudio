/**
 * 把技术路径转成用户友好的标签
 */
const FIELD_LABELS = {
  'genParams.quality': '画质',
  'genParams.duration': '时长',
  'genParams.model': '模型',
  'genParams.ratio': '比例',
  'budget': '预算',
  'duration': '周期',
  'style': '风格',
  'model': '模型',
  'scene3.description': '场景描述',
  'shot1.type': '镜头类型',
  'shot1.duration': '镜头时长',
};

export const getFieldLabel = (fieldPath) => {
  return FIELD_LABELS[fieldPath] || fieldPath;
};
