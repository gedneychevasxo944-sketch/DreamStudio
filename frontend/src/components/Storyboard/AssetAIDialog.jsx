import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Send, Bot, User, Check, Trash2, Image } from 'lucide-react';
import ChatConversation, { UserMessage, SimpleAssistantMessage } from '../ChatConversation';
import { chatApi } from '../../services/api';
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
  onUpdatePrompt,    // (prompt: string) => void - 回填 prompt 到编辑区
  onUpdatePreview,   // (imageUrl: string) => void - 更新预览图
  messages: externalMessages,
  onMessagesChange,
  hasAutoSent,       // 外部传入的已自动发送状态
  onHasAutoSentChange, // (value: boolean) => void - 通知外部状态变化
}) => {
  const [internalMessages, setInternalMessages] = useState([]);
  const chatRef = useRef(null);
  const { currentProjectId } = useProjectStore();

  // 如果外部提供了 messages，使用外部的；否则使用内部的
  const messages = externalMessages !== undefined ? externalMessages : internalMessages;
  const setMessages = onMessagesChange || setInternalMessages;

  // 处理消息变更
  const handleMessagesChange = useCallback((newMessages) => {
    const prevMessages = Array.isArray(messages) ? messages : [];
    const wasAdded = newMessages.length > prevMessages.length &&
      newMessages[newMessages.length - 1]?.role === 'user';

    setMessages(newMessages);
    onMessagesChange?.(newMessages);

    // 如果是新加的用户消息（自动发送场景），触发 API 调用
    if (wasAdded && chatRef.current) {
      const lastMsg = newMessages[newMessages.length - 1];
      chatRef.current.sendMessage(lastMsg.content, true); // skipUserMessage=true
    }
  }, [messages, onMessagesChange, setMessages]);

  // 当面板打开时，如果有描述内容且尚未自动发送，自动发一条优化请求
  // 使用 asset.id 作为 key 来追踪，避免跨资产的问题
  const autoSentKeyRef = useRef(null);
  useEffect(() => {
    // 只有面板打开、有描述、且尚未为此资产自动发送过，才触发
    if (isOpen && asset?.description && autoSentKeyRef.current !== asset.id) {
      autoSentKeyRef.current = asset.id;
      onHasAutoSentChange?.(true);
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: `优化以下描述，保持风格一致：\n${asset.description}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      const newMsgs = [...(Array.isArray(messages) ? messages : []), userMessage];
      handleMessagesChange(newMsgs);
    }
  }, [isOpen, asset?.id, asset?.description]);

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

  // 处理图片应用 - 回填 prompt 和更新预览图
  const handleApplyImage = (imageBlock) => {
    // 从消息中提取文本作为新的 prompt
    const msgList = Array.isArray(messages) ? messages : [];
    const lastAssistantMsg = msgList.filter(m => m.role === 'assistant').pop();
    const promptText = lastAssistantMsg?.result?.trim() || asset?.prompt || '';

    // 直接使用 AI 返回的图片，不需要再调用生成接口
    onUpdatePrompt?.(promptText);
    onUpdatePreview?.(imageBlock.imageUrl);
    // 不再调用 onGenerate，因为 AI 已经生成了图片
  };

  // 处理图片取消 - 清除预览图
  const handleCancelImage = (imageBlock) => {
    onUpdatePreview?.(null);
  };

  // 底部操作栏 - 仅在没有图片确认时显示
  const renderFooter = () => {
    // 如果最后一条消息有图片 block，不显示底部操作栏
    const msgList = Array.isArray(messages) ? messages : [];
    const lastAssistantMsg = msgList.filter(m => m.role === 'assistant').pop();
    if (lastAssistantMsg?.imageBlock) {
      return null;
    }

    return (
      <div className="ai-assistant-actions">
        <button className="action-btn secondary" onClick={onClose}>
          关闭
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
        responseType="image"
        renderFooter={renderFooter}
        onApplyImage={handleApplyImage}
        onCancelImage={handleCancelImage}
      />
    </div>
  );
};

// 保持导出名称兼容
const AssetAIDialog = AssetAIAssistantPanel;
export default AssetAIDialog;
