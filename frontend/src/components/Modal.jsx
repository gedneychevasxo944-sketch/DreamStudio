import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Clock, ChevronRight, RefreshCw, Sparkles, Eye, FileText, Video, Music, Layers } from 'lucide-react';
import './Modal.css';

const sampleNodeDetail = {
  id: 'screenwriter',
  name: '编剧',
  type: 'produce',
  status: 'active',
  metrics: {
    frames: 1892,
    fps: 24,
    progress: 65,
    cpu: 45,
    memory: 62
  },
  currentTask: '正在生成第三幕对话',
  logs: [
    { time: '14:30:01', level: 'info', message: '开始解析剧本结构' },
    { time: '14:30:05', level: 'info', message: '检测到情感曲线异常' },
    { time: '14:30:08', level: 'warning', message: '建议增加情感铺垫' },
    { time: '14:30:12', level: 'info', message: '正在重新生成对白' }
  ]
};

const sampleDiffData = {
  left: {
    title: '生成初稿',
    content: `【场景：雨中告别】

主角站在码头边，雨水打湿了他的衣服。

"我必须离开。"他施法了，两人开始了打斗。

镜头推向女主角，她眼中含泪。

动起来！`,
    issues: [
      { line: 3, text: '他施法了', type: 'vague', original: '施法', replacement: '指尖过处，墨色如游龙般划破空气' },
      { line: 3, text: '打斗', type: 'weak', original: '打斗', replacement: '激烈交锋' },
      { line: 5, text: '镜头推向', type: 'camera', original: '镜头推向', replacement: '希区柯克式变焦推进' },
      { line: 7, text: '动起来', type: 'vague', original: '动起来', replacement: '向左方30°抽离、螺旋状坍塌' }
    ]
  },
  right: {
    title: '审核修改意见',
    content: `【场景：雨中告别 - 情感铺垫版】

主角站在废弃码头边，远处的工厂烟囱吐着白烟。雨势渐大，打湿了他的驼色大衣。

"我必须离开。"主角指尖过处，墨色如游龙般划破空气，与对手激烈交锋，剑光如雪。

镜头希区柯克式变焦推进至女主角面部，她眼中含泪，泪珠顺着脸颊缓缓滑落。

向观众视角方向，即向左方30°抽离、螺旋状坍塌，揭示背后还有另一名角色。`,
    changes: [
      { line: 1, original: '码头边', revised: '废弃码头边，远处的工厂烟囱吐着白烟', type: 'expansion' },
      { line: 2, original: '衣服', revised: '驼色大衣', type: 'specific' },
      { line: 3, original: '"我必须离开。"他施法了，两人开始了打斗。', revised: '"我必须离开。"主角指尖过处，墨色如游龙般划破空气，与对手激烈交锋，剑光如雪。', type: 'cinematic' },
      { line: 4, original: '镜头推向女主角', revised: '镜头希区柯克式变焦推进至女主角面部', type: 'camera' },
      { line: 5, original: '她眼中含泪', revised: '她眼中含泪，泪珠顺着脸颊缓缓滑落', type: 'emotion' },
      { line: 6, original: '动起来！', revised: '向观众视角方向，即向左方30°抽离、螺旋状坍塌，揭示背后还有另一名角色。', type: 'cinematic' }
    ]
  }
};

const sampleWarnings = [
  { type: 'trail', message: '尾迹冗余检测到3处', severity: 'warning', segment: '6-8s' },
  { type: 'action', message: '动作拆解不完整', severity: 'error', segment: '2-4s' },
  { type: 'camera', message: '运镜术语已升维', severity: 'success', segment: '4-6s' }
];

const Modal = ({ type, data, onClose }) => {
  const [activeTab, setActiveTab] = useState('detail');
  const [diffView] = useState(sampleDiffData);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderIssueTag = (issue) => {
    if (issue.type === 'camera') {
      return (
        <motion.span
          className="issue-tag camera"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Sparkles size={10} />
          运镜术语升维
        </motion.span>
      );
    }
    return (
      <span className={`issue-tag ${issue.type}`}>
        模糊动词: "{issue.original}"
      </span>
    );
  };

  const renderTextWithIssues = (lineNumber, lineText, issues) => {
    if (!issues || issues.length === 0) {
      return <span>{lineText || ' '}</span>;
    }

    const lineIssues = issues.filter(i => i.line === lineNumber);
    if (lineIssues.length === 0) {
      return <span>{lineText || ' '}</span>;
    }

    let result = [];
    let lastIndex = 0;
    const text = lineText;

    lineIssues.forEach((issue, idx) => {
      const issueIndex = text.indexOf(issue.original, lastIndex);
      if (issueIndex === -1) return;

      if (issueIndex > lastIndex) {
        result.push(<span key={`text-${idx}`}>{text.slice(lastIndex, issueIndex)}</span>);
      }

      const isCameraTerm = issue.type === 'camera';
      result.push(
        <span key={`issue-${idx}`} className={`underline-wrapper ${isCameraTerm ? 'camera-term' : 'vague-term'}`}>
          <span className={isCameraTerm ? 'underline-golden' : 'underline-wave'}>
            {issue.original}
          </span>
          {isCameraTerm && (
            <motion.span
              className="camera-badge"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles size={8} />
              {issue.replacement}
            </motion.span>
          )}
        </span>
      );

      lastIndex = issueIndex + issue.original.length;
    });

    if (lastIndex < text.length) {
      result.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return result;
  };

  const renderNodeDetail = () => (
    <div className="modal-content">
      <div className="modal-header">
        <div className="header-info">
          <h3 className="modal-title">{sampleNodeDetail.name}</h3>
          <span className="modal-subtitle">节点详情</span>
        </div>
        <div className="header-status">
          <span className={`status-badge status-${sampleNodeDetail.status}`}>
            {sampleNodeDetail.status === 'active' ? '运行中' :
             sampleNodeDetail.status === 'approved' ? '已完成' : '等待中'}
          </span>
        </div>
      </div>

      <div className="modal-tabs">
        <button
          className={`tab-btn ${activeTab === 'detail' ? 'active' : ''}`}
          onClick={() => setActiveTab('detail')}
        >
          详情
        </button>
        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          日志
        </button>
        <button
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          指标
        </button>
      </div>

      <div className="modal-body">
        {activeTab === 'detail' && (
          <div className="detail-content">
            <div className="current-task">
              <span className="task-label">当前任务</span>
              <p className="task-text">{sampleNodeDetail.currentTask}</p>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">已处理帧数</span>
                <span className="metric-value">{sampleNodeDetail.metrics.frames.toLocaleString()}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">帧率</span>
                <span className="metric-value">{sampleNodeDetail.metrics.fps} fps</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">完成进度</span>
                <span className="metric-value">{sampleNodeDetail.metrics.progress}%</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">CPU占用</span>
                <span className="metric-value">{sampleNodeDetail.metrics.cpu}%</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">内存占用</span>
                <span className="metric-value">{sampleNodeDetail.metrics.memory}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-content">
            {sampleNodeDetail.logs.map((log, idx) => (
              <div key={idx} className={`log-item log-${log.level}`}>
                <span className="log-time">{log.time}</span>
                <span className={`log-level level-${log.level}`}>
                  {log.level === 'warning' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-content">
            <div className="metric-chart">
              <span className="chart-label">处理帧数趋势</span>
              <div className="chart-placeholder">
                {[45, 52, 48, 61, 55, 63, 58, 67, 72, 68, 75, 78].map((val, idx) => (
                  <div
                    key={idx}
                    className="chart-bar"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDiffView = () => (
    <div className="diff-content">
      <div className="diff-header">
        <div className="diff-title-left">
          <span className="title-label">生成初稿</span>
          <div className="issue-tags">
            {diffView.left.issues.map((issue, idx) => (
              <motion.span
                key={idx}
                className={`issue-tag ${issue.type}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                {issue.type === 'camera' ? (
                  <>
                    <Sparkles size={10} />
                    运镜术语升维
                  </>
                ) : (
                  <>模糊: "{issue.original}"</>
                )}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="diff-divider">
          <RefreshCw size={14} className="divider-icon" />
        </div>
        <div className="diff-title-right">
          <span className="title-label">审核修改意见</span>
          <div className="change-tags">
            {diffView.right.changes.map((change, idx) => (
              <span key={idx} className="change-tag">
                第{change.line}行 {change.type === 'camera' ? '运镜' : change.type === 'cinematic' ? '镜头' : '优化'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="diff-body">
        <div className="diff-panel left">
          <div className="panel-header error-header">
            <span>{diffView.left.title}</span>
            <span className="error-count">{diffView.left.issues.length} 处问题</span>
          </div>
          <div className="panel-content">
            <pre className="content-text">
              {diffView.left.content.split('\n').map((line, idx) => {
                const lineIssues = diffView.left.issues.filter(i => i.line === idx + 1);
                return (
                  <div key={idx} className={`text-line ${lineIssues.length > 0 ? 'has-issue' : ''}`}>
                    <span className="line-number">{idx + 1}</span>
                    <span className="line-content">
                      {renderTextWithIssues(idx + 1, line, diffView.left.issues)}
                    </span>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        <div className="diff-panel right">
          <div className="panel-header success-header">
            <span>{diffView.right.title}</span>
            <CheckCircle size={14} className="approved-icon" />
          </div>
          <div className="panel-content">
            <pre className="content-text">
              {diffView.right.content.split('\n').map((line, idx) => (
                <div key={idx} className="text-line">
                  <span className="line-number">{idx + 1}</span>
                  <span className="line-content highlight-text">
                    {line || ' '}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>

      <div className="diff-footer">
        <div className="diagnosis-axis">
          <div className="axis-label">诊断轴</div>
          <div className="axis-segments">
            <div className="axis-segment safe">
              <span className="segment-time">[0-2s]</span>
              <span className="segment-status ok">✓</span>
            </div>
            <div className="axis-segment warning">
              <span className="segment-time">[2-4s]</span>
              <span className="segment-status error">!</span>
              <span className="segment-msg">动作拆解</span>
            </div>
            <div className="axis-segment safe">
              <span className="segment-time">[4-6s]</span>
              <span className="segment-status camera">★</span>
              <span className="segment-msg">运镜升维</span>
            </div>
            <div className="axis-segment warning">
              <span className="segment-time">[6-8s]</span>
              <span className="segment-status warn">~</span>
              <span className="segment-msg">尾迹冗余</span>
            </div>
            <div className="axis-segment safe">
              <span className="segment-time">[尾迹]</span>
              <span className="segment-status ok">✓</span>
            </div>
          </div>
        </div>

        <div className="warnings-row">
          {sampleWarnings.map((warning, idx) => (
            <div key={idx} className={`warning-item ${warning.severity}`}>
              {warning.severity === 'success' ? (
                <CheckCircle size={12} />
              ) : warning.severity === 'error' ? (
                <AlertTriangle size={12} />
              ) : (
                <Clock size={12} />
              )}
              <span>[{warning.segment}]</span>
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      >
        <motion.div
          className={`modal-container ${type === 'nodeDetail' ? 'size-lg' : 'size-full'}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>

          {type === 'nodeDetail' && renderNodeDetail()}
          {type === 'diffView' && renderDiffView()}
          {type === 'assetDetail' && renderNodeDetail()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;