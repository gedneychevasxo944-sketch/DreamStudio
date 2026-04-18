import { create } from 'zustand';

/**
 * Chat Store - 对话状态管理
 * 管理对话助手的状态、上下文和消息
 */

// 上下文类型
const CONTEXT_TYPES = {
  PROJECT: 'project',
  ASSET: 'asset',
  WORKFLOW: 'workflow',
  NODE: 'node',
};

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// localStorage key for floating preferences
const FLOAT_PREFS_KEY = 'dreamstudio_chat_float_prefs';

// 从 localStorage 加载浮窗偏好
const loadFloatPrefs = () => {
  try {
    const stored = localStorage.getItem(FLOAT_PREFS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// 保存浮窗偏好到 localStorage
const saveFloatPrefs = (prefs) => {
  try {
    localStorage.setItem(FLOAT_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save float prefs:', e);
  }
};

// 初始化浮窗偏好 - 清除旧数据避免位置错误
const initialFloatPrefs = null; // loadFloatPrefs();

const useChatStore = create((set, get) => ({
  // 当前会话
  currentSession: null,

  // 所有会话 Map: contextKey -> ChatSession
  sessions: {},

  // 浮窗状态 - 默认关闭
  isFloatingOpen: false,
  floatingPosition: initialFloatPrefs?.floatingPosition || { x: 100, y: 100 },
  floatingSize: initialFloatPrefs?.floatingSize || { width: 360, height: 480 },
  isDocked: null, // 暂时禁用吸附功能

  // 当前上下文
  contextType: null,
  contextId: null,
  contextName: null,

  // 加载状态
  isLoading: false,

  // 推荐操作
  recommendations: [],

  // ==================== 上下文切换 ====================

  /**
   * 切换对话上下文
   * @param {string} type - 上下文类型
   * @param {string} [id] - 上下文 ID
   * @param {string} [name] - 上下文名称
   */
  switchContext: (type, id = null, name = null) => {
    const { contextType, contextId } = get();

    // 如果上下文没变，不做处理
    if (type === contextType && id === contextId) {
      return;
    }

    // 生成 contextKey 用于查找/创建会话
    const contextKey = getContextKey(type, id);

    // 获取或创建会话
    let session = get().sessions[contextKey];
    if (!session) {
      session = createSession(type, id, name);
      set((state) => ({
        sessions: { ...state.sessions, [contextKey]: session },
      }));
    }

    set({
      contextType: type,
      contextId: id,
      contextName: name,
      currentSession: session,
      recommendations: [],
    });

    // 触发事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat-context-change', {
        detail: { type, id, name }
      }));
    }
  },

  // ==================== 浮窗控制 ====================

  toggleFloating: () => {
    set((state) => ({ isFloatingOpen: !state.isFloatingOpen }));
  },

  openFloating: () => {
    set({ isFloatingOpen: true });
  },

  closeFloating: () => {
    set({ isFloatingOpen: false });
  },

  setFloatingPosition: (position) => {
    set({ floatingPosition: position, isDocked: null });
    saveFloatPrefs({ ...get(), floatingPosition: position, isDocked: null });
  },

  setFloatingSize: (size) => {
    set({ floatingSize: size });
    saveFloatPrefs({ ...get(), floatingSize: size });
  },

  dockFloating: (edge) => {
    set({ isDocked: edge });
    saveFloatPrefs({ ...get(), isDocked: edge });
  },

  undockFloating: () => {
    set({ isDocked: null });
    saveFloatPrefs({ ...get(), isDocked: null });
  },

  // ==================== 消息操作 ====================

  /**
   * 发送消息
   * @param {string} content - 消息内容
   * @param {Array} [attachments] - 附件
   */
  sendMessage: async (content, attachments = []) => {
    const { currentSession, contextType, contextId } = get();

    if (!currentSession) {
      console.warn('No current session to send message to');
      return;
    }

    const userMessage = createMessage('user', content, attachments);

    // 添加用户消息
    set((state) => {
      const session = state.currentSession;
      const updatedSession = {
        ...session,
        messages: [...session.messages, userMessage],
        updatedAt: new Date().toISOString(),
      };
      return {
        currentSession: updatedSession,
        sessions: {
          ...state.sessions,
          [getContextKey(session.contextType, session.contextId)]: updatedSession,
        },
      };
    });

    // 模拟 AI 回复（实际应该调用 AI 服务）
    set({ isLoading: true });

    try {
      // TODO: 调用 AI 服务
      // const response = await aiService.chat(sessionId, content, attachments);

      // 模拟延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟 AI 回复
      const aiMessage = createMessage(
        'assistant',
        getSimulatedResponse(content, contextType, get().contextName),
        [],
        getSimulatedRecommendations(contextType)
      );

      // 添加 AI 消息
      set((state) => {
        const session = state.currentSession;
        const updatedSession = {
          ...session,
          messages: [...session.messages, aiMessage],
          updatedAt: new Date().toISOString(),
        };
        return {
          currentSession: updatedSession,
          sessions: {
            ...state.sessions,
            [getContextKey(session.contextType, session.contextId)]: updatedSession,
          },
          isLoading: false,
          recommendations: aiMessage.recommendations || [],
        };
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ isLoading: false });

      // 添加错误消息
      const errorMessage = createMessage('assistant', '抱歉，发生了错误。请稍后重试。', []);
      set((state) => {
        const session = state.currentSession;
        const updatedSession = {
          ...session,
          messages: [...session.messages, errorMessage],
          updatedAt: new Date().toISOString(),
        };
        return {
          currentSession: updatedSession,
          sessions: {
            ...state.sessions,
            [getContextKey(session.contextType, session.contextId)]: updatedSession,
          },
        };
      });
    }
  },

  // ==================== 推荐操作 ====================

  onRecommendationClick: (text) => {
    get().sendMessage(text);
  },

  clearRecommendations: () => {
    set({ recommendations: [] });
  },
}));

// ============ 辅助函数 ============

function getContextKey(type, id) {
  if (!id) return `global_${type}`;
  return `${type}_${id}`;
}

function createSession(type, id, name) {
  return {
    id: generateId(),
    contextType: type,
    contextId: id,
    contextName: name,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMessage(role, content, attachments = [], recommendations = []) {
  return {
    id: generateId(),
    role,
    content,
    attachments,
    recommendations,
    createdAt: new Date().toISOString(),
  };
}

// 模拟 AI 回复（后续替换为真实 AI 服务）
function getSimulatedResponse(content, contextType, contextName) {
  const responses = {
    project: contextName
      ? `好的，我来帮你规划这个项目。你可以告诉我想要创作什么类型的故事？`
      : `你好！我是你的 AI 创作助手。告诉我你想要创作什么内容？`,
    asset: contextName
      ? `了解，我来帮你处理"${contextName}"。你想要如何修改或者生成新的内容？`
      : `了解，我来帮你处理这个资产。你想要如何修改？`,
    workflow: `好的，我可以帮你编辑这个工作流。你想要增加节点、修改配置还是执行工作流？`,
    node: contextName
      ? `好的，我来帮你调整"${contextName}"节点的配置。你想要修改哪些参数？`
      : `好的，我来帮你调整这个节点的配置。`,
    null: `你好！我是你的 AI 创作助手。告诉我你想要创作什么内容？`,
  };

  return responses[contextType] || responses.null;
}

function getSimulatedRecommendations(contextType) {
  const recommendations = {
    project: ['帮我规划项目结构', '开始创作', '查看教程'],
    asset: ['修改这个资产', '生成新的变体', '添加到故事板'],
    workflow: ['增加一个节点', '执行工作流', '保存为模板'],
    node: ['调整参数', '测试运行', '复制节点'],
    null: ['生成角色', '生成分镜', '上传剧本'],
  };

  return recommendations[contextType] || recommendations.null;
}

export { CONTEXT_TYPES };
export { useChatStore };  // named export for consistency
export default useChatStore;
