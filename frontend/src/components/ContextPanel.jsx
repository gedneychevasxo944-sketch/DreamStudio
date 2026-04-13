import { Check, ChevronRight, Sparkles, FileText, Image, Video, Puzzle, Bot } from 'lucide-react';
import './ContextPanel.css';

const ContextPanel = ({ rawInput, attachments, brief, plan, onConfirm, onCancel, onBuildOwn }) => (
  <div className="context-panel">
    {rawInput && (
      <div className="context-section">
        <div className="section-label">原始输入</div>
        <div className="section-content raw-input">
          <FileText size={14} />
          <p>{rawInput}</p>
        </div>
      </div>
    )}

    {attachments && attachments.length > 0 && (
      <div className="context-section">
        <div className="section-label">已上传资料</div>
        <div className="section-content attachments">
          {attachments.map((att, idx) => (
            <div key={idx} className="attachment-item">
              {att.type === 'image' && <Image size={14} />}
              {att.type === 'video' && <Video size={14} />}
              <span>{att.name}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {brief && (
      <div className="context-section">
        <div className="section-label">Brief 整理</div>
        <div className="section-content brief">
          <p>{brief}</p>
        </div>
      </div>
    )}

    <div className="context-actions">
      {plan ? (
        <>
          <button className="context-btn primary" onClick={onConfirm}>
            <Check size={16} />
            采用此方案
          </button>
          <button className="context-btn secondary" onClick={onBuildOwn}>
            <Puzzle size={16} />
            自己搭建
          </button>
        </>
      ) : (
        <button className="context-btn secondary" onClick={onBuildOwn}>
          <Puzzle size={16} />
          自己搭建
        </button>
      )}
      <button className="context-btn danger" onClick={onCancel}>
        取消
      </button>
    </div>
  </div>
);

export default ContextPanel;
