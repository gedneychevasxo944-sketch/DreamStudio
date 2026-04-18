/**
 * 全局事件总线
 * 用于三层架构（对话层、故事板层、节点层）之间的通信
 */

// 事件类型常量
export const EVENT_TYPES = {
  // 焦点变化
  FOCUS_CHANGED: 'focusChanged',

  // 资产生成
  ASSET_GENERATED: 'assetGenerated',
  ASSET_UPDATED: 'assetUpdated',
  ASSET_DELETED: 'assetDeleted',

  // 子图更新
  SUBGRAPH_UPDATED: 'subgraphUpdated',
  SUBGRAPH_RUN_START: 'subgraphRunStart',
  SUBGRAPH_RUN_COMPLETE: 'subgraphRunComplete',
  SUBGRAPH_SYNC_STATUS_CHANGED: 'subgraphSyncStatusChanged',

  // 工作流同步
  WORKFLOW_SYNCED: 'workflowSynced',
  WORKFLOW_MODIFIED: 'workflowModified',

  // 模板更新通知 (T078)
  TEMPLATE_UPDATED: 'templateUpdated',

  // 故事板更新
  STORYBOARD_UPDATED: 'storyboardUpdated',

  // 层切换
  LAYER_SWITCHED: 'layerSwitched',

  // 系统消息
  SYSTEM_MESSAGE: 'systemMessage',
};

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  // 订阅事件
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // 返回取消订阅函数
    return () => {
      this.off(eventType, callback);
    };
  }

  // 取消订阅
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  // 触发事件
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, error);
        }
      });
    }
  }

  // 清除所有监听器（用于测试）
  clear() {
    this.listeners.clear();
  }
}

// 单例
export const eventBus = new EventBus();

// 便捷方法
export const emitEvent = (eventType, data) => eventBus.emit(eventType, data);
export const subscribe = (eventType, callback) => eventBus.on(eventType, callback);
export const unsubscribe = (eventType, callback) => eventBus.off(eventType, callback);
