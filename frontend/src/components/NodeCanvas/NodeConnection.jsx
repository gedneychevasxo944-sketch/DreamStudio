import { useMemo } from 'react';
import { getDefaultNodeWidth } from '../../utils/nodeUtils';
import './NodeConnection.css';

const NodeConnection = ({ connection, nodes, isRunning, portPositions = {} }) => {
  // 计算连线路径
  const pathData = useMemo(() => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);

    if (!fromNode || !toNode) {
      return '';
    }

    // 使用实际的端口位置，如果没有则根据节点实际宽度计算
    const fromPort = portPositions[fromNode.id]?.output;
    const toPort = portPositions[toNode.id]?.input;

    // 获取节点实际宽度（考虑美术和分镜节点的1.5倍宽度）
    const fromNodeWidth = fromNode.data?.width || getDefaultNodeWidth(fromNode.type);
    const toNodeWidth = toNode.data?.width || getDefaultNodeWidth(toNode.type);

    // 端口中心位置计算：
    // 输入端口中心在节点左边缘: node.x
    // 输出端口中心在节点右边缘: node.x + width
    const startX = fromPort?.x ?? (fromNode.x + fromNodeWidth);
    const startY = fromPort?.y ?? (fromNode.y + 20);

    const endX = toPort?.x ?? (toNode.x);
    const endY = toPort?.y ?? (toNode.y + 20);

    // 计算控制点（贝塞尔曲线）
    const distance = Math.abs(endX - startX);
    const controlOffset = Math.max(distance * 0.5, 80);

    const cp1x = startX + controlOffset;
    const cp1y = startY;
    const cp2x = endX - controlOffset;
    const cp2y = endY;

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }, [connection, nodes, portPositions]);

  if (!pathData) return null;

  // 连线颜色
  const strokeColor = 'var(--accent-blue, #3b82f6)';
  const strokeWidth = 2;

  return (
    <g className="node-connection">
      {/* 主线 */}
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      
      {/* 运行时的数据流动画 */}
      {isRunning && (
        <>
          <path
            d={pathData}
            stroke={strokeColor}
            strokeWidth={strokeWidth + 3}
            fill="none"
            strokeLinecap="round"
            opacity="0.25"
            filter="blur(3px)"
          >
            <animate
              attributeName="stroke-dasharray"
              values="0,24;24,0;0,24"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </path>
          <circle r="5" fill="#ffffff" filter="drop-shadow(0 0 6px rgba(6, 182, 212, 0.8))">
            <animateMotion dur="1.2s" repeatCount="indefinite" path={pathData} />
          </circle>
        </>
      )}
    </g>
  );
};

export default NodeConnection;
