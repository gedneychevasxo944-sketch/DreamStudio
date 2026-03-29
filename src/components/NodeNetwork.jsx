import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle, ArrowRight, Activity, Lock, Target, TrendingUp, Eye, Layers, Sparkles, Shield } from 'lucide-react';
import './NodeNetwork.css';

const nodeGroups = [
  {
    id: 'production',
    name: '制片组',
    nameEn: 'Production',
    icon: Target,
    nodes: [
      {
        id: 'producer',
        name: '制片人',
        type: 'produce',
        status: 'active',
        data: {
          feasibilityScore: 7.2,
          targetDuration: 90,
          currentDuration: 72,
          budgetUtilization: 68
        }
      },
      {
        id: 'producer-audit',
        name: '制片审核',
        type: 'audit',
        status: 'approved',
        data: {
          feasibilityScore: 7.2,
          targetDuration: 90,
          status: 'compliant'
        }
      }
    ]
  },
  {
    id: 'content',
    name: '内容组',
    nameEn: 'Content',
    icon: Layers,
    nodes: [
      {
        id: 'screenwriter',
        name: '编剧',
        type: 'produce',
        status: 'active',
        data: {
          actProgress: { act1: 100, act2: 75, act3: 30 },
          emotionKeywords: ['剑拔弩张', '凄美寂寥', '暗流涌动'],
          tensionLevel: 8.5
        }
      },
      {
        id: 'screenwriter-audit',
        name: '编剧审核',
        type: 'audit',
        status: 'interception',
        data: {
          actProgress: { act1: 100, act2: 75, act3: 30 },
          warning: '第三幕情感铺垫不足',
          riskLevel: 'medium'
        }
      }
    ]
  },
  {
    id: 'director',
    name: '导演组',
    nameEn: 'Director',
    icon: Eye,
    nodes: [
      {
        id: 'director',
        name: '导演',
        type: 'produce',
        status: 'waiting',
        data: {
          intensityRadar: [7, 8, 6, 9, 7, 8],
          momentumMatch: null
        }
      },
      {
        id: 'director-audit',
        name: '导演审核',
        type: 'audit',
        status: 'waiting',
        data: {
          intensityRadar: [],
          momentumMatch: null
        }
      }
    ]
  },
  {
    id: 'visual',
    name: '视觉组',
    nameEn: 'Visual',
    icon: Sparkles,
    nodes: [
      {
        id: 'artist',
        name: '美术',
        type: 'produce',
        status: 'active',
        data: {
          constructionProgress: { spaceContainer: 100, mainBody: 85, microDetails: 40 },
          lockedSeed: 123456,
          styleConsistency: 94
        }
      },
      {
        id: 'artist-audit',
        name: '美术审核',
        type: 'audit',
        status: 'active',
        data: {
          constructionProgress: { spaceContainer: 100, mainBody: 85, microDetails: 40 },
          lockedSeed: 123456,
          verificationStatus: 'passed'
        }
      }
    ]
  },
  {
    id: 'technical',
    name: '技术组',
    nameEn: 'Technical',
    icon: Shield,
    nodes: [
      {
        id: 'engineer',
        name: '技术',
        type: 'produce',
        status: 'active',
        data: {
          formulaModules: { module1: true, module2: true, module3: true, module4: true, module5: true, module6: false, module7: false },
          highWeightTermsUsage: 87
        }
      },
      {
        id: 'engineer-audit',
        name: '技术审核',
        type: 'audit',
        status: 'approved',
        data: {
          formulaModules: { module1: true, module2: true, module3: true, module4: true, module5: true, module6: true, module7: true },
          highWeightTermsUsage: 95,
          verificationStatus: 'verified'
        }
      }
    ]
  }
];

const Waveform = ({ active }) => {
  const [data, setData] = useState(Array(16).fill(0));

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1), Math.random() * 0.8 + 0.2];
        return newData;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="waveform">
      {data.map((value, idx) => (
        <motion.div
          key={idx}
          className="wave-bar"
          initial={{ height: 4 }}
          animate={{ height: value * 20 + 4 }}
          transition={{ duration: 0.08 }}
        />
      ))}
    </div>
  );
};

const RadarChart = ({ values }) => {
  const maxValue = 10;
  const points = values.map((val, idx) => {
    const angle = (idx * 60 - 90) * (Math.PI / 180);
    const radius = (val / maxValue) * 40;
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle)
    };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="radar-chart">
      <svg viewBox="0 0 100 100">
        {[25, 50, 75, 100].map(r => (
          <polygon
            key={r}
            points="50,50 L50,50 L50,50 L50,50 L50,50 L50,50"
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth="0.5"
          />
        ))}
        <polygon
          points={polygonPoints}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="var(--accent-blue)"
          strokeWidth="1"
        />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="2" fill="var(--accent-cyan)" />
        ))}
      </svg>
      <div className="radar-labels">
        {['强度', '节奏', '张力', '动量', '情绪', '视觉'].map((label, idx) => (
          <span key={idx} className="radar-label">{label}</span>
        ))}
      </div>
    </div>
  );
};

const TripleProgressBar = ({ progress }) => {
  const stages = [
    { key: 'spaceContainer', label: '空间容器', color: 'var(--accent-cyan)' },
    { key: 'mainBody', label: '主体构造', color: 'var(--accent-blue)' },
    { key: 'microDetails', label: '微观细节', color: 'var(--accent-silver)' }
  ];

  return (
    <div className="triple-progress">
      {stages.map((stage, idx) => (
        <div key={stage.key} className="progress-stage">
          <div className="stage-header">
            <span className="stage-label">{stage.label}</span>
            <span className="stage-value">{progress[stage.key]}%</span>
          </div>
          <div className="stage-bar">
            <motion.div
              className="stage-fill"
              style={{ background: stage.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress[stage.key]}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const ActProgressBar = ({ progress }) => {
  return (
    <div className="act-progress">
      <div className="act-bar">
        <motion.div
          className="act-fill act1"
          initial={{ width: 0 }}
          animate={{ width: `${progress.act1}%` }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          className="act-fill act2"
          initial={{ width: 0 }}
          animate={{ width: `${progress.act2}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        <motion.div
          className="act-fill act3"
          initial={{ width: 0 }}
          animate={{ width: `${progress.act3}%` }}
          transition={{ duration: 0.6, delay: 0.4 }}
        />
      </div>
      <div className="act-labels">
        <span>第一幕</span>
        <span>第二幕</span>
        <span>第三幕</span>
      </div>
    </div>
  );
};

const EmotionCloud = ({ keywords }) => {
  return (
    <div className="emotion-cloud">
      {keywords.map((word, idx) => (
        <motion.span
          key={word}
          className="emotion-tag"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.7 + idx * 0.1, scale: 1 }}
          transition={{ delay: idx * 0.2 }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const FormulaProgress = ({ modules }) => {
  const moduleLabels = ['主体', '动作', '场景', '氛围', '运镜', '音效', '情绪'];
  return (
    <div className="formula-progress">
      <div className="formula-modules">
        {moduleLabels.map((label, idx) => (
          <div
            key={idx}
            className={`module-block ${modules[`module${idx + 1}`] ? 'active' : ''}`}
            title={label}
          >
            {modules[`module${idx + 1}`] ? '✓' : idx + 1}
          </div>
        ))}
      </div>
      <div className="formula-completion">
        {Object.values(modules).filter(Boolean).length} / 7 模块就绪
      </div>
    </div>
  );
};

const ProductionCard = ({ node, onSelect }) => {
  const data = node.data;

  return (
    <motion.div
      className="status-card status-active production-card"
      onClick={() => onSelect(node)}
      whileHover={{ scale: 1.01 }}
    >
      <div className="card-indicator">
        <div className="indicator-light produce" />
      </div>
      <div className="card-content">
        <div className="card-header">
          <span className="card-name">{node.name}</span>
          <span className="feasibility-score">
            <Target size={10} />
            {data.feasibilityScore}/10
          </span>
        </div>
        <Waveform active={node.status === 'active'} />
        <div className="production-metrics">
          <div className="metric-row">
            <span className="metric-label">目标时长</span>
            <span className="metric-value">{data.targetDuration}s</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">当前</span>
            <span className="metric-value">{data.currentDuration}s</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">预算</span>
            <span className="metric-value">{data.budgetUtilization}%</span>
          </div>
        </div>
        <div className="duration-bar">
          <div className="duration-target" style={{ left: `${(data.currentDuration / data.targetDuration) * 100}%` }}>
            <div className="target-marker" />
          </div>
          <div className="duration-fill" style={{ width: `${(data.currentDuration / data.targetDuration) * 100}%` }} />
        </div>
      </div>
    </motion.div>
  );
};

const ScreenwriterCard = ({ node, onSelect }) => {
  const data = node.data;

  if (node.status === 'interception') {
    return (
      <motion.div
        className="status-card status-interception screenwriter-card"
        onClick={() => onSelect(node)}
      >
        <div className="ripple-container">
          <div className="ripple ripple-1" />
          <div className="ripple ripple-2" />
        </div>
        <div className="card-indicator">
          <div className="indicator-light produce" />
        </div>
        <div className="card-content">
          <div className="card-header">
            <span className="card-name">{node.name}</span>
            <span className="interception-badge">
              <AlertTriangle size={10} />
              修正中
            </span>
          </div>
          <div className="risk-warning">
            <Shield size={12} />
            <span>{data.warning}</span>
          </div>
          <ActProgressBar progress={data.actProgress} />
          <div className="risk-detail">
            <span className="risk-level">风险等级: {data.riskLevel}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="status-card status-active screenwriter-card"
      onClick={() => onSelect(node)}
      whileHover={{ scale: 1.01 }}
    >
      <div className="card-indicator">
        <div className="indicator-light produce" />
      </div>
      <div className="card-content">
        <div className="card-header">
          <span className="card-name">{node.name}</span>
          <span className="tension-level">
            <TrendingUp size={10} />
            张力 {data.tensionLevel}
          </span>
        </div>
        <Waveform active={node.status === 'active'} />
        <ActProgressBar progress={data.actProgress} />
        <EmotionCloud keywords={data.emotionKeywords} />
      </div>
    </motion.div>
  );
};

const DirectorCard = ({ node, onSelect }) => {
  const data = node.data;
  const isWaiting = node.status === 'waiting';

  return (
    <motion.div
      className={`status-card ${isWaiting ? 'status-waiting' : 'status-active'} director-card`}
      onClick={() => onSelect(node)}
      whileHover={!isWaiting ? { scale: 1.01 } : {}}
    >
      <div className="card-indicator">
        <div className={`indicator-light ${isWaiting ? 'waiting' : 'produce'}`} />
      </div>
      <div className="card-content">
        <div className="card-header">
          <span className="card-name">{node.name}</span>
          {!isWaiting && data.momentumMatch && (
            <span className={`momentum-status ${data.momentumMatch < 10 ? 'warning' : 'ok'}`}>
              动量校验 {data.momentumMatch}%
            </span>
          )}
        </div>
        {isWaiting ? (
          <div className="card-waiting">
            <span className="waiting-text">等待上游数据...</span>
          </div>
        ) : (
          <>
            <RadarChart values={data.intensityRadar} />
          </>
        )}
      </div>
    </motion.div>
  );
};

const ArtistCard = ({ node, onSelect }) => {
  const data = node.data;

  return (
    <motion.div
      className="status-card status-active artist-card"
      onClick={() => onSelect(node)}
      whileHover={{ scale: 1.01 }}
    >
      <div className="card-indicator">
        <div className="indicator-light produce" />
      </div>
      <div className="card-content">
        <div className="card-header">
          <span className="card-name">{node.name}</span>
          <span className="seed-badge">
            <Lock size={10} />
            Seed {data.lockedSeed}
          </span>
        </div>
        <Waveform active={node.status === 'active'} />
        <TripleProgressBar progress={data.constructionProgress} />
        <div className="consistency-meter">
          <span className="consistency-label">风格一致性</span>
          <div className="consistency-bar">
            <div className="consistency-fill" style={{ width: `${data.styleConsistency}%` }} />
          </div>
          <span className="consistency-value">{data.styleConsistency}%</span>
        </div>
      </div>
    </motion.div>
  );
};

const EngineerCard = ({ node, onSelect }) => {
  const data = node.data;

  return (
    <motion.div
      className={`status-card ${node.status === 'approved' ? 'status-approved' : 'status-active'} engineer-card`}
      onClick={() => onSelect(node)}
      whileHover={{ scale: 1.01 }}
    >
      <div className="card-indicator">
        <div className={`indicator-light ${node.status === 'approved' ? 'audit' : 'produce'}`} />
      </div>
      <div className="card-content">
        <div className="card-header">
          <span className="card-name">{node.name}</span>
          <span className="terms-usage">
            <Sparkles size={10} />
            {data.highWeightTermsUsage}%
          </span>
        </div>
        <FormulaProgress modules={data.formulaModules} />
      </div>
    </motion.div>
  );
};

const StatusCard = ({ node, onSelect }) => {
  const groupId = node.id.split('-')[0];

  switch (groupId) {
    case 'producer':
      return <ProductionCard node={node} onSelect={onSelect} />;
    case 'screenwriter':
      return <ScreenwriterCard node={node} onSelect={onSelect} />;
    case 'director':
      return <DirectorCard node={node} onSelect={onSelect} />;
    case 'artist':
      return <ArtistCard node={node} onSelect={onSelect} />;
    case 'engineer':
      return <EngineerCard node={node} onSelect={onSelect} />;
    default:
      return null;
  }
};

const NodeNetwork = ({ onNodeSelect }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <div className="node-network">
      <div className="network-header">
        <h2 className="network-title">协同心智区</h2>
        <span className="network-subtitle">Node Network</span>
      </div>

      <div className="network-flow">
        <div className="flow-line">
          <motion.div
            className="flow-particle"
            animate={{ x: [0, 280, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>

      <div className="node-groups">
        {nodeGroups.map((group, idx) => (
          <motion.div
            key={group.id}
            className={`node-group ${selectedGroup === idx ? 'selected' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setSelectedGroup(selectedGroup === idx ? null : idx)}
          >
            <div className="group-header">
              <span className="group-name">{group.name}</span>
              <span className="group-name-en">{group.nameEn}</span>
            </div>

            <div className="group-cards">
              {group.nodes.map((node) => (
                <StatusCard key={node.id} node={node} onSelect={onNodeSelect} />
              ))}
            </div>

            <div className="group-connector">
              <div className="connector-line" />
              <ArrowRight size={14} className="connector-icon" />
              <div className="connector-line" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="network-legend">
        <div className="legend-item">
          <div className="legend-dot produce" />
          <span>生产节点</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot audit" />
          <span>审核节点</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot interception" />
          <span>拦截修正</span>
        </div>
      </div>
    </div>
  );
};

export default NodeNetwork;