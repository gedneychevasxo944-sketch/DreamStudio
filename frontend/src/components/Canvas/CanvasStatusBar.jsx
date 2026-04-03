import { Grid } from 'lucide-react';

/**
 * 画布底部状态栏组件
 */
const CanvasStatusBar = ({
  scale,
  nodesCount,
  connectionsCount,
}) => {
  return (
    <div className="canvas-statusbar">
      <div className="status-item">
        <Grid size={14} />
        <span>缩放: {Math.round(scale * 100)}%</span>
      </div>
      <div className="status-item">
        <span>节点: {nodesCount}</span>
      </div>
      <div className="status-item">
        <span>连线: {connectionsCount}</span>
      </div>
    </div>
  );
};

export default CanvasStatusBar;
