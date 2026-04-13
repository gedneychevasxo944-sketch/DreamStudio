import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot } from 'lucide-react';
import ChatConversation from './ChatConversation';
import { COMPONENT_TYPE, ASSISTANT_AGENT_ID } from '../constants/ComponentType';
import { useProjectStore, useWorkflowStore } from '../stores';
import { uiLogger } from '../utils/logger';
import './Console.css';

const Console = ({ onLoadWorkflow, pendingChatMessage, onPendingChatMessageSent, messages, onMessagesChange, onPlanReceived }) => {
  const chatRef = useRef(null);
  const hasSentPendingMessage = useRef(false);

  // 从 projectStore 获取当前项目上下文
  const currentProjectId = useProjectStore(state => state.currentProjectId);
  const currentVersion = useProjectStore(state => state.currentVersion);
  const canvasNodes = useWorkflowStore(state => state.nodes);
  const addNode = useWorkflowStore(state => state.addNode);
  const deleteNode = useWorkflowStore(state => state.deleteNode);
  const updateNodeData = useWorkflowStore(state => state.updateNodeData);

  // 处理待发送的聊天消息（从主页输入）
  useEffect(() => {
    if (pendingChatMessage && !hasSentPendingMessage.current) {
      hasSentPendingMessage.current = true;
      if (chatRef.current?.sendMessage) {
        chatRef.current.sendMessage(pendingChatMessage);
      }
      onPendingChatMessageSent?.();
    }
  }, [pendingChatMessage, onPendingChatMessageSent]);

  const handleWorkflowCreated = useCallback((nodes, edges) => {
    onLoadWorkflow?.(nodes, edges);
  }, [onLoadWorkflow]);

  // 处理应用提案
  const handleApplyProposal = useCallback((proposal) => {
    if (!proposal || !proposal.changes) return;

    proposal.changes.forEach(change => {
      switch (change.action) {
        case 'add_node':
          // 添加新节点
          addNode({
            id: `node_${Date.now()}`,
            type: change.nodeType || 'visual',
            name: change.nodeName,
            position: change.position || { x: 200, y: 200 },
            data: {
              label: change.nodeName,
              description: change.description,
              status: 'ready'
            }
          });
          break;

        case 'remove_node':
          // 删除节点 - 找到节点ID
          if (change.nodeName) {
            const nodeToRemove = canvasNodes.find(n => n.name === change.nodeName);
            if (nodeToRemove) {
              deleteNode(nodeToRemove.id);
            }
          }
          break;

        case 'update_config':
          // 更新节点配置
          if (change.nodeName) {
            const nodeToUpdate = canvasNodes.find(n => n.name === change.nodeName);
            if (nodeToUpdate) {
              updateNodeData(nodeToUpdate.id, {
                [change.field]: change.newValue
              });
            }
          }
          break;

        default:
          uiLogger.warn('[Console] Unknown proposal action:', change.action);
      }
    });
  }, [canvasNodes, addNode, deleteNode, updateNodeData]);

  return (
    <div className="console-chat">
      <div className="console-header-simple">
        <Bot size={18} />
        <span>智能助理</span>
      </div>

      <ChatConversation
        ref={chatRef}
        agentId={ASSISTANT_AGENT_ID}
        projectId={currentProjectId}
        projectVersion={currentVersion?.version}
        messages={messages}
        onMessagesChange={onMessagesChange}
        placeholder="输入消息..."
        disabledPlaceholder="生成完成后可对话"
        onWorkflowCreated={handleWorkflowCreated}
        onApplyProposal={handleApplyProposal}
        onPlanReceived={onPlanReceived}
      />
    </div>
  );
};

export default Console;
