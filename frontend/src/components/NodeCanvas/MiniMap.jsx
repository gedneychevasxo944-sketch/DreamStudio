import { useMemo } from 'react';
import { useSubgraphStore } from '../../stores';
import './MiniMap.css';

/**
 * MiniMap - 鹰眼导航组件
 * 显示所有子图的位置，支持点击跳转
 */
const MiniMap = ({
  subgraphs = [],
  viewport = { x: 0, y: 0, zoom: 1 },
  onNavigate,
  width = 150,
  height = 100,
}) => {
  const { focusedSubgraphId } = useSubgraphStore();

  // 计算子图的缩放位置
  const scaledSubgraphs = useMemo(() => {
    // 简化的布局算法 - 假设子图垂直排列
    const startY = 20;
    const gap = 25;
    return subgraphs.map((sg, index) => ({
      ...sg,
      x: 20,
      y: startY + index * gap,
      w: 50,
      h: 20,
    }));
  }, [subgraphs]);

  // 计算画布边界
  const canvasBounds = useMemo(() => {
    if (scaledSubgraphs.length === 0) {
      return { minX: 0, minY: 0, maxX: 150, maxY: 100 };
    }
    const padding = 10;
    return {
      minX: 0,
      minY: 0,
      maxX: Math.max(...scaledSubgraphs.map(sg => sg.x + sg.w)) + padding,
      maxY: Math.max(...scaledSubgraphs.map(sg => sg.y + sg.h)) + padding,
    };
  }, [scaledSubgraphs]);

  const handleClick = (subgraph) => {
    onNavigate?.(subgraph);
  };

  if (subgraphs.length === 0) {
    return null;
  }

  return (
    <div
      className="minimap"
      style={{ width, height }}
    >
      <div className="minimap-title">子图导航</div>
      <div className="minimap-content">
        {scaledSubgraphs.map((sg) => (
          <div
            key={sg.id}
            className={`minimap-subgraph ${sg.id === focusedSubgraphId ? 'focused' : ''} ${!sg.isExpanded ? 'collapsed' : ''}`}
            style={{
              left: sg.x,
              top: sg.y,
              width: sg.w,
              height: sg.h,
            }}
            onClick={() => handleClick(sg)}
            title={sg.name}
          />
        ))}
      </div>
    </div>
  );
};

export default MiniMap;
