import './NodeConnection.css';

// 获取节点默认宽度
const getDefaultNodeWidth = (nodeType) => {
  // 美术、分镜和技术节点默认宽度为1.5倍
  if (nodeType === 'visual' || nodeType === 'director' || nodeType === 'technical') {
    return 540; // 360 * 1.5
  }
  return 360;
};

const DraggingConnectionLine = ({ fromNode, mousePos, portPositions = {} }) => {
  if (!fromNode) return null;

  // 使用实际的端口位置
  const fromPort = portPositions[fromNode.id]?.output;

  // 获取节点实际宽度
  const fromNodeWidth = fromNode.data?.width || getDefaultNodeWidth(fromNode.type);

  // 起点（输出端口中心）- 输出端口中心在节点右边缘: node.x + width
  const startX = fromPort?.x ?? (fromNode.x + fromNodeWidth);
  const startY = fromPort?.y ?? (fromNode.y + 20);

  // 终点（鼠标位置）
  const endX = mousePos.x;
  const endY = mousePos.y;

  // 计算控制点（贝塞尔曲线）
  const distance = Math.abs(endX - startX);
  const controlOffset = Math.max(distance * 0.5, 50);

  const cp1x = startX + controlOffset;
  const cp1y = startY;
  const cp2x = Math.max(endX - controlOffset, startX + 20);
  const cp2y = endY;

  const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  return (
    <g className="dragging-connection">
      {/* 虚线预览 */}
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5 5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* 发光效果 */}
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.3"
        filter="blur(2px)"
      />
    </g>
  );
};

export default DraggingConnectionLine;
