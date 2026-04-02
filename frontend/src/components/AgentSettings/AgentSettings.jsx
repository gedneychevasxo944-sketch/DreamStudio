import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Play, RotateCcw, Key, MessageSquare, Sparkles, Zap,
  Package, Upload, MessageCircle, Globe, Cpu, Settings2, Eye, EyeOff,
  Thermometer, Sliders, Clock, Database, Shield, Trash2, Copy, Check,
  ChevronDown, ChevronUp, Plus, Search, Download, Wrench, Brain, Lock, Unlock
} from 'lucide-react';
import './AgentSettings.css';

// 模拟skill数据
const mockSkills = [
  { id: '1', name: '文生图优化', description: '优化图像生成提示词', version: '1.2.0', installed: true },
  { id: '2', name: '剧本分析', description: '分析剧本结构和情感曲线', version: '2.0.1', installed: false },
  { id: '3', name: '物理模拟', description: '模拟真实物理效果', version: '1.5.0', installed: false },
];

// 官方智能体默认配置
const OFFICIAL_AGENT_DEFAULTS = {
  producer: {
    initialPrompt: `你是一位资深制片人，负责把控整个AI视频制作项目的方向和质量。

核心职责：
1. 评估用户想法的可行性，包括技术难度、资源需求和预期效果
2. 制定项目时间表和里程碑
3. 协调各个智能体之间的工作流程
4. 确保最终交付物符合质量标准

评估维度：
- 创意可行性（1-10分）
- 技术实现难度（1-10分）
- 资源需求评估
- 预期完成时间`,
    selfEvolutionPrompt: `基于过往项目经验，持续优化项目评估准确度和协调能力。`
  },
  director: {
    initialPrompt: `你是一位专业导演，负责将剧本转化为视觉语言。

核心职责：
1. 分析剧本并设计分镜
2. 规划镜头语言和叙事节奏
3. 指导视觉风格和美学方向
4. 确保故事情感的有效传达

设计原则：
- 每镜头不超过8秒
- 保持视觉连贯性
- 动量匹配（镜头间运动流畅）
- 安全构图法则`,
    selfEvolutionPrompt: `根据项目反馈，不断优化镜头设计和叙事技巧。`
  },
  writer: {
    initialPrompt: `你是一位编剧，负责创作引人入胜的故事和对话。

核心职责：
1. 将用户想法转化为完整剧本
2. 设计角色和情节发展
3. 创作符合场景需求的对话
4. 确保故事结构的完整性

创作原则：
- 三幕结构
- 情感曲线设计
- 角色动机清晰
- 场景转换自然`,
    selfEvolutionPrompt: `学习优秀剧本特点，持续提升创作能力。`
  },
  artist: {
    initialPrompt: `你是一位美术指导，负责视觉风格和艺术设计。

核心职责：
1. 设计整体视觉风格
2. 创建角色和环境概念
3. 制定色彩和光影方案
4. 确保视觉一致性

设计原则：
- 风格统一性
- 色彩心理学应用
- 构图平衡
- 细节丰富度`,
    selfEvolutionPrompt: `追踪视觉趋势，持续更新设计语言。`
  },
  tech: {
    initialPrompt: `你是一位技术专家，负责实现和优化技术方案。

核心职责：
1. 评估技术可行性
2. 优化渲染和生成流程
3. 解决技术难题
4. 提升系统性能

技术栈：
- AI生成模型
- 渲染引擎
- 自动化流程
- 质量控制`,
    selfEvolutionPrompt: `跟进最新技术发展，持续优化实现方案。`
  },
  auditor: {
    initialPrompt: `你是一位审核员，负责质量控制和合规检查。

核心职责：
1. 审核内容质量和准确性
2. 检查合规性和安全性
3. 提供改进建议
4. 确保交付标准

审核维度：
- 内容准确性
- 安全合规性
- 质量标准
- 一致性检查`,
    selfEvolutionPrompt: `积累审核经验，提升判断准确性。`
  }
};

const AgentSettings = ({ agent, onClose, onSave, onDuplicate }) => {
  const [activeTab, setActiveTab] = useState('model');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState(false);
  const [isDuplicated, setIsDuplicated] = useState(false);

  // 判断是否为官方智能体
  const isOfficial = agent?.category === '官方认证' && !isDuplicated;

  // 获取官方默认配置
  const officialDefaults = useMemo(() => {
    if (!agent?.type) return null;
    return OFFICIAL_AGENT_DEFAULTS[agent.type] || null;
  }, [agent?.type]);

  // 表单状态
  const [settings, setSettings] = useState({
    // 模型设置
    modelProvider: 'openai',
    modelName: 'gpt-4',
    apiKey: '',
    apiBase: '',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,

    // Prompt设置 - 官方智能体使用默认值且不可修改
    initialPrompt: officialDefaults?.initialPrompt || agent?.initialPrompt || '',
    selfEvolutionPrompt: officialDefaults?.selfEvolutionPrompt || agent?.selfEvolutionPrompt || '',
    autoOptimize: !isOfficial,
    optimizationInterval: 'daily',

    // 高级设置
    timeout: 30000,
    retryCount: 3,
    contextWindow: 10,
    streaming: true,
    cacheEnabled: true,

    // 已安装skills
    installedSkills: ['1'],
  });

  const handleSave = () => {
    const saveData = {
      ...settings,
      // 官方智能体保存时保留原始prompt
      initialPrompt: isOfficial ? (officialDefaults?.initialPrompt || settings.initialPrompt) : settings.initialPrompt,
      selfEvolutionPrompt: isOfficial ? (officialDefaults?.selfEvolutionPrompt || settings.selfEvolutionPrompt) : settings.selfEvolutionPrompt,
    };
    onSave?.(saveData);
  };

  const handleDuplicate = () => {
    setIsDuplicated(true);
    onDuplicate?.(agent);
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    setTestOutput('');

    // 模拟测试响应
    const responses = [
      '收到指令，正在分析...',
      '根据当前配置，我将这样处理...',
      '这是基于您的prompt生成的结果...',
    ];

    for (let i = 0; i < responses.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setTestOutput(prev => prev + responses[i] + '\n');
    }

    setIsTesting(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSkill = (skillId) => {
    setSettings(prev => ({
      ...prev,
      installedSkills: prev.installedSkills.includes(skillId)
        ? prev.installedSkills.filter(id => id !== skillId)
        : [...prev.installedSkills, skillId]
    }));
  };

  const tabs = [
    { id: 'model', label: '模型设置', icon: Cpu },
    { id: 'prompt', label: 'Prompt设置', icon: MessageSquare },
    { id: 'skills', label: 'Skill管理', icon: Package },
    { id: 'advanced', label: '高级设置', icon: Settings2 },
  ];

  // 简化的动画配置 - 使用更流畅的过渡
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.15 }
    },
    exit: { 
      opacity: 0, 
      x: -10,
      transition: { duration: 0.1 }
    }
  };

  return (
    <div className="agent-settings-overlay" onClick={onClose}>
      <motion.div
        className="agent-settings-modal"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="settings-header">
          <div className="header-left">
            <div className="agent-icon" style={{ backgroundColor: agent?.color || '#3b82f6' }}>
              <Brain size={20} />
            </div>
            <div className="agent-info">
              <h3>{agent?.name || '智能体配置'}</h3>
              <div className="agent-meta">
                <span className="agent-type">{agent?.category || '自定义智能体'}</span>
                {isOfficial && (
                  <span className="official-badge">
                    <Lock size={12} />
                    官方 - 只读
                  </span>
                )}
                {isDuplicated && (
                  <span className="custom-badge">
                    <Unlock size={12} />
                    已复制 - 可编辑
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="header-actions">
            {isOfficial && (
              <button className="duplicate-btn" onClick={handleDuplicate}>
                <Copy size={16} />
                复制并编辑
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="settings-body">
          {/* 左侧导航 */}
          <div className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 中间配置区 */}
          <div className="settings-content">
            <AnimatePresence mode="wait">
              {/* 模型设置 */}
              {activeTab === 'model' && (
                <motion.div
                  key="model"
                  className="settings-section"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h4 className="section-title">
                    <Key size={16} />
                    API配置
                  </h4>

                  <div className="form-group">
                    <label>模型提供商</label>
                    <select
                      value={settings.modelProvider}
                      onChange={(e) => setSettings({ ...settings, modelProvider: e.target.value })}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="azure">Azure OpenAI</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>模型名称</label>
                    <input
                      type="text"
                      value={settings.modelName}
                      onChange={(e) => setSettings({ ...settings, modelName: e.target.value })}
                      placeholder="例如: gpt-4"
                    />
                  </div>

                  <div className="form-group">
                    <label>API Key</label>
                    <div className="input-with-action">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.apiKey}
                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                        placeholder="输入您的API Key"
                      />
                      <button
                        className="action-btn"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>API Base URL (可选)</label>
                    <input
                      type="text"
                      value={settings.apiBase}
                      onChange={(e) => setSettings({ ...settings, apiBase: e.target.value })}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>

                  <h4 className="section-title">
                    <Sliders size={16} />
                    生成参数
                  </h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Temperature: {settings.temperature}</label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                      />
                      <div className="range-labels">
                        <span>精确</span>
                        <span>平衡</span>
                        <span>创意</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Max Tokens</label>
                      <input
                        type="number"
                        value={settings.maxTokens}
                        onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                        min="1"
                        max="8192"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Top P</label>
                      <input
                        type="number"
                        value={settings.topP}
                        onChange={(e) => setSettings({ ...settings, topP: parseFloat(e.target.value) })}
                        min="0"
                        max="1"
                        step="0.1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Frequency Penalty</label>
                      <input
                        type="number"
                        value={settings.frequencyPenalty}
                        onChange={(e) => setSettings({ ...settings, frequencyPenalty: parseFloat(e.target.value) })}
                        min="-2"
                        max="2"
                        step="0.1"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Prompt设置 */}
              {activeTab === 'prompt' && (
                <motion.div
                  key="prompt"
                  className="settings-section"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {isOfficial && (
                    <div className="readonly-notice">
                      <Lock size={16} />
                      <span>官方智能体的Prompt为只读，点击右上角"复制并编辑"创建可修改的副本</span>
                    </div>
                  )}

                  <h4 className="section-title">
                    <MessageSquare size={16} />
                    初始 Prompt
                  </h4>

                  <div className={`prompt-editor ${isOfficial ? 'readonly' : ''}`}>
                    <div className="editor-toolbar">
                      <button className="toolbar-btn" onClick={() => copyToClipboard(settings.initialPrompt)}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? '已复制' : '复制'}
                      </button>
                      {!isOfficial && (
                        <button className="toolbar-btn" onClick={() => setSettings({ ...settings, initialPrompt: '' })}>
                          <Trash2 size={14} />
                          清空
                        </button>
                      )}
                    </div>
                    <textarea
                      className="prompt-textarea"
                      value={settings.initialPrompt}
                      onChange={(e) => !isOfficial && setSettings({ ...settings, initialPrompt: e.target.value })}
                      placeholder="输入智能体的初始prompt..."
                      rows={8}
                      readOnly={isOfficial}
                    />
                    <div className="char-count">{settings.initialPrompt.length} 字符</div>
                  </div>

                  <h4 className="section-title">
                    <Sparkles size={16} />
                    自我进化 Prompt
                    {!isOfficial && (
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.autoOptimize}
                          onChange={(e) => setSettings({ ...settings, autoOptimize: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    )}
                  </h4>

                  <div className={`prompt-editor ${isOfficial ? 'readonly' : ''}`}>
                    <div className="editor-toolbar">
                      {!isOfficial && (
                        <button className="toolbar-btn" onClick={() => setSettings({ ...settings, selfEvolutionPrompt: settings.initialPrompt })}>
                          <RotateCcw size={14} />
                          重置为初始
                        </button>
                      )}
                    </div>
                    <textarea
                      className="prompt-textarea"
                      value={settings.selfEvolutionPrompt}
                      onChange={(e) => !isOfficial && setSettings({ ...settings, selfEvolutionPrompt: e.target.value })}
                      placeholder="智能体将根据此prompt进行自我优化..."
                      rows={6}
                      disabled={!settings.autoOptimize || isOfficial}
                      readOnly={isOfficial}
                    />
                  </div>

                  {!isOfficial && settings.autoOptimize && (
                    <div className="form-group">
                      <label>优化频率</label>
                      <select
                        value={settings.optimizationInterval}
                        onChange={(e) => setSettings({ ...settings, optimizationInterval: e.target.value })}
                      >
                        <option value="realtime">实时</option>
                        <option value="hourly">每小时</option>
                        <option value="daily">每天</option>
                        <option value="weekly">每周</option>
                        <option value="manual">手动触发</option>
                      </select>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Skill管理 */}
              {activeTab === 'skills' && (
                <motion.div
                  key="skills"
                  className="settings-section"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h4 className="section-title">
                    <Package size={16} />
                    已安装 Skills
                  </h4>

                  <div className="skills-list">
                    {mockSkills.filter(s => settings.installedSkills.includes(s.id)).map(skill => (
                      <div key={skill.id} className="skill-card installed">
                        <div className="skill-info">
                          <span className="skill-name">{skill.name}</span>
                          <span className="skill-version">v{skill.version}</span>
                        </div>
                        <span className="skill-desc">{skill.description}</span>
                        <button className="skill-action" onClick={() => toggleSkill(skill.id)}>
                          卸载
                        </button>
                      </div>
                    ))}
                  </div>

                  <h4 className="section-title">
                    <Download size={16} />
                    安装新 Skill
                  </h4>

                  <div className="install-methods">
                    <button className="install-method" onClick={() => window.open('/skill-market', '_blank')}>
                      <Globe size={20} />
                      <span>Skill市场</span>
                      <small>浏览全局Skill市场</small>
                    </button>

                    <button className="install-method">
                      <Upload size={20} />
                      <span>本地上传</span>
                      <small>上传本地Skill文件</small>
                    </button>

                    <button className="install-method">
                      <MessageCircle size={20} />
                      <span>对话安装</span>
                      <small>通过自然语言描述安装</small>
                    </button>
                  </div>

                  <div className="available-skills">
                    <div className="section-subtitle" onClick={() => setExpandedSkills(!expandedSkills)}>
                      <span>可用 Skills</span>
                      {expandedSkills ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {expandedSkills && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {mockSkills.filter(s => !settings.installedSkills.includes(s.id)).map(skill => (
                          <div key={skill.id} className="skill-card">
                            <div className="skill-info">
                              <span className="skill-name">{skill.name}</span>
                              <span className="skill-version">v{skill.version}</span>
                            </div>
                            <span className="skill-desc">{skill.description}</span>
                            <button className="skill-action install" onClick={() => toggleSkill(skill.id)}>
                              <Plus size={14} />
                              安装
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 高级设置 */}
              {activeTab === 'advanced' && (
                <motion.div
                  key="advanced"
                  className="settings-section"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h4 className="section-title">
                    <Clock size={16} />
                    性能设置
                  </h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label>请求超时 (ms)</label>
                      <input
                        type="number"
                        value={settings.timeout}
                        onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
                        min="1000"
                        step="1000"
                      />
                    </div>

                    <div className="form-group">
                      <label>重试次数</label>
                      <input
                        type="number"
                        value={settings.retryCount}
                        onChange={(e) => setSettings({ ...settings, retryCount: parseInt(e.target.value) })}
                        min="0"
                        max="5"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>上下文窗口大小</label>
                    <input
                      type="number"
                      value={settings.contextWindow}
                      onChange={(e) => setSettings({ ...settings, contextWindow: parseInt(e.target.value) })}
                      min="1"
                      max="50"
                    />
                    <small>保留的对话轮数</small>
                  </div>

                  <h4 className="section-title">
                    <Database size={16} />
                    功能开关
                  </h4>

                  <div className="toggle-list">
                    <label className="toggle-item">
                      <div className="toggle-info">
                        <span>流式输出</span>
                        <small>实时返回生成结果</small>
                      </div>
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.streaming}
                          onChange={(e) => setSettings({ ...settings, streaming: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </div>
                    </label>

                    <label className="toggle-item">
                      <div className="toggle-info">
                        <span>响应缓存</span>
                        <small>缓存相同请求的响应</small>
                      </div>
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.cacheEnabled}
                          onChange={(e) => setSettings({ ...settings, cacheEnabled: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </div>
                    </label>
                  </div>

                  <h4 className="section-title">
                    <Shield size={16} />
                    安全设置
                  </h4>

                  <div className="form-group">
                    <label>内容过滤级别</label>
                    <select defaultValue="medium">
                      <option value="low">宽松 - 仅过滤危险内容</option>
                      <option value="medium">标准 - 过滤不当内容</option>
                      <option value="high">严格 - 过滤所有敏感内容</option>
                    </select>
                  </div>

                  <div className="danger-zone">
                    <h4 className="section-title danger">
                      <Trash2 size={16} />
                      危险区域
                    </h4>
                    <button className="danger-btn">
                      重置所有设置为默认
                    </button>
                    <button className="danger-btn">
                      清除所有对话历史
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 右侧预览测试区 */}
          <div className="settings-preview">
            <h4 className="preview-title">
              <Play size={16} />
              预览测试
            </h4>

            <div className="preview-input-area">
              <textarea
                className="preview-input"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="输入测试指令..."
                rows={4}
              />
              <button
                className="test-btn"
                onClick={handleTest}
                disabled={isTesting || !testInput.trim()}
              >
                {isTesting ? (
                  <>
                    <Zap size={14} className="spinning" />
                    测试中...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    运行测试
                  </>
                )}
              </button>
            </div>

            <div className="preview-output">
              <div className="output-header">
                <span>输出结果</span>
                {testOutput && (
                  <button className="clear-btn" onClick={() => setTestOutput('')}>
                    清空
                  </button>
                )}
              </div>
              <div className="output-content">
                {testOutput ? (
                  <pre>{testOutput}</pre>
                ) : (
                  <div className="output-placeholder">
                    <Wrench size={24} />
                    <span>测试结果将显示在这里</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={16} />
            保存配置
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AgentSettings;
