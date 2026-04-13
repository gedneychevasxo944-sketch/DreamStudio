import { useState } from 'react';
import { Lock, Unlock, ChevronDown, ChevronUp, Settings, Play, AlertTriangle, Cpu, MessageSquare, Package, Sliders, Plus, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../stores';

const ConfigTab = ({ node, onNodeUpdate }) => {
  const [agentSettingsExpanded, setAgentSettingsExpanded] = useState(false);

  if (!node) {
    return (
      <div className="workspace-tab-content empty">
        <div className="empty-state">
          <Settings size={32} />
          <p>选择一个节点查看配置</p>
        </div>
      </div>
    );
  }

  // 更新节点数据
  const updateNodeData = (data) => {
    onNodeUpdate?.(node.id, data);
  };

  // 获取当前智能体配置
  const agentConfig = node.data?.agentConfig || {
    modelProvider: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    initialPrompt: '',
    installedSkills: []
  };

  // 任务参数配置（根据节点类型）
  const getConfigFields = () => {
    switch (node.type) {
      case 'content': // 编剧
        return [
          { label: '故事类型', value: node.data?.storyType || '未设置', type: 'select', options: ['剧情片', '喜剧', '悬疑', '科幻'] },
          { label: '风格', value: node.data?.style || '现实主义', type: 'select', options: ['现实主义', '浪漫主义', '超现实主义'] },
          { label: '集数', value: node.data?.episodes || 1, type: 'number' },
          { label: '每集时长', value: node.data?.duration || '45分钟', type: 'text' },
        ];
      case 'visual': // 美术
        return [
          { label: '视觉风格', value: node.data?.visualStyle || '写实', type: 'select', options: ['写实', '动漫', '水墨', '赛博朋克'] },
          { label: '色彩风格', value: node.data?.colorStyle || '暖色调', type: 'select', options: ['暖色调', '冷色调', '高饱和', '低饱和'] },
          { label: '分辨率', value: node.data?.resolution || '1080p', type: 'select', options: ['720p', '1080p', '2K', '4K'] },
        ];
      case 'director': // 分镜
        return [
          { label: '镜头语言', value: node.data?.shotStyle || '标准', type: 'select', options: ['标准', '电影感', '快速剪辑'] },
          { label: '画幅比例', value: node.data?.aspectRatio || '16:9', type: 'select', options: ['16:9', '2.35:1', '1:1', '9:16'] },
        ];
      case 'technical': // 提示词工程师
        return [
          { label: '启用', value: node.data?.enabled !== false, type: 'boolean' },
        ];
      case 'videoGen': // 视频生成
        return [
          { label: '生成模型', value: node.data?.model || 'VideoGen V2', type: 'select', options: ['VideoGen V1', 'VideoGen V2', 'VideoGen V3'] },
          { label: '生成时长', value: node.data?.duration || '5秒', type: 'select', options: ['3秒', '5秒', '10秒'] },
          { label: '帧率', value: node.data?.fps || 30, type: 'number' },
        ];
      default:
        return [
          { label: '启用', value: node.data?.enabled !== false, type: 'boolean' },
        ];
    }
  };

  // 渲染任务参数配置
  const renderTaskConfig = () => {
    const configFields = getConfigFields();
    const isLocked = node.data?.isLocked || false;

    return (
      <div className="config-section task-config">
        <div className="section-header">
          <span className="section-title">任务参数</span>
        </div>
        <div className="config-fields">
          {configFields.map((field, idx) => (
            <div key={idx} className={`config-field ${isLocked ? 'disabled' : ''}`}>
              <label className="config-label">{field.label}</label>
              {field.type === 'select' ? (
                <select className="config-select" value={field.value} disabled={isLocked} readOnly>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'boolean' ? (
                <label className="config-toggle">
                  <input type="checkbox" checked={field.value} disabled={isLocked} readOnly />
                  <span className="toggle-slider"></span>
                </label>
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  className="config-input"
                  value={field.value}
                  min={0}
                  disabled={isLocked}
                  readOnly
                />
              ) : (
                <input
                  type="text"
                  className="config-input"
                  value={field.value}
                  disabled={isLocked}
                  readOnly
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染智能体设置
  const renderAgentConfig = () => {
    const isLocked = node.data?.isLocked || false;

    const updateAgentConfig = (key, value) => {
      if (isLocked) return;
      updateNodeData({
        agentConfig: {
          ...agentConfig,
          [key]: value
        }
      });
    };

    return (
      <div className="config-section agent-config">
        <button
          className="section-header collapsible"
          onClick={() => setAgentSettingsExpanded(!agentSettingsExpanded)}
        >
          <span className="section-title">智能体设置</span>
          <span className="section-badge">模型 · Prompt · Skill</span>
          {agentSettingsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {agentSettingsExpanded && (
          <div className="agent-settings-body">
            {/* 模型设置 */}
            <div className="agent-settings-group">
              <div className="group-title">
                <Cpu size={14} />
                <span>模型</span>
              </div>
              <div className="config-field">
                <label className="config-label">提供商</label>
                <select
                  className="config-select"
                  value={agentConfig.modelProvider}
                  onChange={(e) => updateAgentConfig('modelProvider', e.target.value)}
                  disabled={isLocked}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="azure">Azure OpenAI</option>
                </select>
              </div>
              <div className="config-field">
                <label className="config-label">模型名称</label>
                <input
                  type="text"
                  className="config-input"
                  value={agentConfig.modelName}
                  onChange={(e) => updateAgentConfig('modelName', e.target.value)}
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* 生成参数 */}
            <div className="agent-settings-group">
              <div className="group-title">
                <Sliders size={14} />
                <span>生成参数</span>
              </div>
              <div className="config-field">
                <label className="config-label">Temperature: {agentConfig.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={agentConfig.temperature}
                  onChange={(e) => updateAgentConfig('temperature', parseFloat(e.target.value))}
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* Prompt设置 */}
            <div className="agent-settings-group">
              <div className="group-title">
                <MessageSquare size={14} />
                <span>Prompt</span>
              </div>
              <div className="config-field">
                <label className="config-label">查看/编辑</label>
                <button className="config-action-btn" disabled={isLocked}>
                  查看/编辑 →
                </button>
              </div>
            </div>

            {/* Skills设置 */}
            <div className="agent-settings-group">
              <div className="group-title">
                <Package size={14} />
                <span>Skills</span>
              </div>
              <div className="skills-list">
                {agentConfig.installedSkills?.map(skill => (
                  <div key={skill.id} className="skill-item">
                    <span className="skill-name">{skill.name}</span>
                    <button
                      className="skill-remove"
                      onClick={() => {
                        const newSkills = agentConfig.installedSkills.filter(s => s.id !== skill.id);
                        updateAgentConfig('installedSkills', newSkills);
                      }}
                      disabled={isLocked}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button className="skill-add" disabled={isLocked}>
                  <Plus size={14} />
                  安装Skill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const isLocked = node.data?.isLocked || false;
  const isPropagationLocked = node.data?.lockedByPropagation;

  const toggleLock = () => {
    const store = useWorkflowStore.getState();
    if (isLocked) {
      store.unlockNodeAndUpstream(node.id);
    } else {
      store.lockNodeAndUpstream(node.id);
    }
  };

  // 渲染自动生成配置（仅技术节点）
  const renderAutoGenConfig = () => {
    if (node.type !== 'technical') return null;

    const autoGenConfig = node.data?.autoGenConfig || { mode: 'manual', count: 0 };

    const setMode = (mode) => {
      updateNodeData({ autoGenConfig: { ...autoGenConfig, mode } });
    };

    const setCount = (count) => {
      updateNodeData({ autoGenConfig: { ...autoGenConfig, count } });
    };

    return (
      <div className="config-section auto-gen-config">
        <div className="section-header">
          <Play size={14} />
          <span>自动生成视频节点</span>
          <span className={`config-badge ${autoGenConfig.mode}`}>
            {autoGenConfig.mode === 'auto' ? '自动' : '手动'}
          </span>
        </div>
        <div className="auto-gen-body">
          <div className="config-row">
            <label className="config-label">生成模式：</label>
            <div className="config-options">
              <button
                className={`config-option ${autoGenConfig.mode === 'manual' ? 'active' : ''}`}
                onClick={() => setMode('manual')}
              >
                手动
              </button>
              <button
                className={`config-option ${autoGenConfig.mode === 'auto' ? 'active' : ''}`}
                onClick={() => setMode('auto')}
              >
                自动
              </button>
            </div>
          </div>
          {autoGenConfig.mode === 'auto' && (
            <div className="config-row">
              <label className="config-label">生成数量：</label>
              <div className="config-input-group">
                <input
                  type="number"
                  className="config-number-input"
                  value={autoGenConfig.count || ''}
                  placeholder="全部"
                  min="0"
                  onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                />
                <span className="config-hint">0 = 全部</span>
              </div>
            </div>
          )}
          <div className="config-row">
            <label className="config-label">提示词数量：</label>
            <span className="config-value">{node.data?.prompts?.length || 0} 个</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="workspace-tab-content config-tab">
      <div className="config-header">
        <span className="config-title">节点配置</span>
        <span className="config-node-type">{node.name}</span>
      </div>

      {/* 锁定控制 */}
      <div className="lock-control">
        <div className="lock-status">
          {isLocked ? (
            <>
              <Lock size={16} className="lock-icon locked" />
              <span>
                {isPropagationLocked
                  ? `已被下游节点锁定`
                  : '节点已锁定'}
              </span>
            </>
          ) : (
            <>
              <Unlock size={16} className="lock-icon unlocked" />
              <span>节点未锁定</span>
            </>
          )}
        </div>
        {isPropagationLocked ? (
          <div className="propagation-hint">
            <AlertTriangle size={14} />
            <span>需从下游解锁</span>
          </div>
        ) : (
          <button
            className={`lock-toggle-btn ${isLocked ? 'locked' : ''}`}
            onClick={toggleLock}
          >
            {isLocked ? (
              <>
                <Unlock size={14} />
                <span>解锁节点</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>锁定节点</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 任务参数 - 默认展开 */}
      {renderTaskConfig()}

      {/* 分隔线 */}
      <div className="config-divider" />

      {/* 智能体设置 - 默认折叠 */}
      {renderAgentConfig()}

      {/* 自动生成配置（技术节点专用） */}
      {renderAutoGenConfig()}

      <div className="config-actions">
        <button className="config-save-btn" disabled={isLocked}>保存配置</button>
        <button className="config-reset-btn" disabled={isLocked}>重置</button>
      </div>
    </div>
  );
};

export default ConfigTab;
