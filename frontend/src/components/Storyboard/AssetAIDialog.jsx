import { useState, useRef } from 'react';
import { X, Sparkles, Send, Bot, User, Check, Trash2, Image } from 'lucide-react';
import ChatConversation, { UserMessage, SimpleAssistantMessage } from '../ChatConversation';
import { useProjectStore } from '../../stores/projectStore';
import './AssetAIDialog.css';

/**
 * AssetAIAssistantPanel - 角色/场景/道具的 AI 对话面板
 *
 * 固定在右侧展示，类似剧本阶段的助手面板
 * 用于优化资产的 prompt，对话后可选择：
 * - 立即生成图片
 * - 仅保存修改
 * - 取消
 */
const AssetAIAssistantPanel = ({
  isOpen,
  onClose,
  asset,
  onGenerate,
  messages: externalMessages,
  onMessagesChange,
}) => {
  const [internalMessages, setInternalMessages] = useState([]);
  const chatRef = useRef(null);
  const { currentProjectId } = useProjectStore();

  // 如果外部提供了 messages，使用外部的；否则使用内部的
  const messages = externalMessages !== undefined ? externalMessages : internalMessages;
  const setMessages = onMessagesChange || setInternalMessages;

  // 根据阶段类型获取标题
  const getTitle = () => {
    switch (asset?.type) {
      case 'character':
        return '优化角色描述';
      case 'scene':
        return '优化场景描述';
      case 'prop':
        return '优化道具描述';
      default:
        return '优化描述';
    }
  };

  // 获取当前资产标签
  const getAssetLabel = () => {
    const typeMap = {
      character: '当前角色',
      scene: '当前场景',
      prop: '当前道具',
    };
    return typeMap[asset?.type] || '当前资产';
  };

  // 头部内容
  const headerContent = (
    <div className="ai-assistant-header">
      <div className="header-left">
        <div className="header-title">
          <Sparkles size={16} className="sparkle-icon" />
          <span>{getTitle()}</span>
        </div>
        <div className="header-asset-label">
          {getAssetLabel()}：{asset?.name || '未命名'}
        </div>
      </div>
      <button className="close-btn" onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );

  // 输入框 placeholder
  const placeholder = '描述你想要的风格、氛围、特点，AI 会帮你生成更好的描述词';

  // 底部操作栏
  const renderFooter = () => {
    if (messages.length === 0) return null;

    return (
      <div className="ai-assistant-actions">
        <button className="action-btn secondary" onClick={onClose}>
          取消
        </button>
        <button className="action-btn primary" onClick={() => onGenerate?.(asset?.id)}>
          <Image size={14} />
          立即生成图片
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="asset-ai-assistant-panel">
      <ChatConversation
        ref={chatRef}
        agentId={4}
        projectId={currentProjectId}
        messages={messages}
        onMessagesChange={setMessages}
        headerContent={headerContent}
        placeholder={placeholder}
        inputMode="textarea"
        renderFooter={renderFooter}
      />
    </div>
  );
};

// 保持导出名称兼容
const AssetAIDialog = AssetAIAssistantPanel;
export default AssetAIDialog;
