import { useState } from 'react';
import { Check, List, RotateCcw } from 'lucide-react';
import './BatchImpactList.css';

/**
 * S5: 批量影响列表
 *
 * 场景：一次对话影响多个镜头
 * 展示：影响范围列表 + 批量预览
 */
const BatchImpactList = ({ modification, onClose }) => {
  const [selectedShot, setSelectedShot] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'single'

  if (!modification) return null;

  const { userInstruction, affectedShots } = modification;

  return (
    <div className="batch-impact-list">
      {/* 用户指令 */}
      <div className="user-instruction">
        <span className="label">你的指令：</span>
        <span className="value">"{userInstruction}"</span>
      </div>

      {/* 影响范围 */}
      <div className="impact-summary">
        <span className="summary-label">影响范围：</span>
        <span className="summary-value">
          {affectedShots.length}个镜头
          （镜头{affectedShots.map((s) => s.shotId.replace('shot-', '')).join('、')}）
        </span>
      </div>

      {/* 视图切换 */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          全部预览
        </button>
        <button
          className={`toggle-btn ${viewMode === 'single' ? 'active' : ''}`}
          onClick={() => setViewMode('single')}
        >
          <List size={14} />
          逐个确认
        </button>
      </div>

      {/* 影响列表 */}
      {viewMode === 'all' ? (
        <div className="all-preview">
          {affectedShots.map((shot, index) => (
            <div key={shot.shotId} className="shot-row">
              <div className="shot-info">
                <span className="shot-name">镜头{shot.shotId.replace('shot-', '')}</span>
                <div className="shot-comparison">
                  <img src={shot.beforeThumbnail} alt="修改前" className="shot-thumb before" />
                  <span className="shot-arrow">→</span>
                  <img src={shot.afterThumbnail} alt="修改后" className="shot-thumb after" />
                </div>
              </div>
              <button
                className="view-detail-btn"
                onClick={() => {
                  setSelectedShot(shot);
                  setViewMode('single');
                }}
              >
                查看对比
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="single-preview">
          {selectedShot ? (
            <div className="selected-shot-detail">
              <div className="detail-header">
                <span className="detail-title">
                  镜头{selectedShot.shotId.replace('shot-', '')}
                </span>
                <button
                  className="back-btn"
                  onClick={() => {
                    setSelectedShot(null);
                    setViewMode('all');
                  }}
                >
                  返回列表
                </button>
              </div>
              <div className="detail-comparison">
                <div className="detail-column">
                  <div className="detail-label">修改前</div>
                  <img
                    src={selectedShot.beforeThumbnail}
                    alt="修改前"
                    className="detail-image"
                  />
                </div>
                <div className="detail-arrow">→</div>
                <div className="detail-column">
                  <div className="detail-label">修改后</div>
                  <img
                    src={selectedShot.afterThumbnail}
                    alt="修改后"
                    className="detail-image"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="shot-list">
              {affectedShots.map((shot, index) => (
                <div
                  key={shot.shotId}
                  className="shot-item"
                  onClick={() => setSelectedShot(shot)}
                >
                  <img src={shot.afterThumbnail} alt={shot.shotId} className="shot-mini" />
                  <span className="shot-item-name">
                    镜头{shot.shotId.replace('shot-', '')}
                  </span>
                  <span className="shot-status">待确认</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="panel-actions">
        <button className="action-btn primary">
          <Check size={14} />
          全部接受
        </button>
        <button className="action-btn secondary">
          <List size={14} />
          逐个确认
        </button>
        <button className="action-btn secondary">
          <RotateCcw size={14} />
          回退全部
        </button>
      </div>
    </div>
  );
};

export default BatchImpactList;
