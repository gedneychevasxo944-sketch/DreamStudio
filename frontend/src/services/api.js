import { apiLogger } from '../utils/logger';
import { parseApiError, handleNetworkError, ErrorType } from '../utils/errorHandler';
import { AUTH_ERROR_MESSAGES } from '../constants/authConstants';
import { authStorage } from '../utils/authStorage';

// 使用相对路径，通过 Vite proxy 转发到后端
const API_BASE_URL = '/api';
const ADEPTIFY_BASE_URL = '/adeptify/v1';

/**
 * Java String.hashCode() 的 JavaScript 实现
 * 用于生成与后端一致的 sessionId
 */
function javaHashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Java's Integer.toHexString returns unsigned hex string
  const unsigned = hash >>> 0;
  return unsigned.toString(16);
}

// 检查是否是认证错误
function isAuthErrorLocal(errorMessage) {
  const result = AUTH_ERROR_MESSAGES.some(e => errorMessage && errorMessage.includes(e));
  apiLogger.debug('[Auth] isAuthError:', { errorMessage, result });
  return result;
}

// 处理认证错误，清除本地存储并提示用户
function handleAuthError(errorMessage) {
  apiLogger.info('[Auth] handleAuthError called:', errorMessage);
  if (!isAuthErrorLocal(errorMessage)) {
    apiLogger.debug('[Auth] Error not recognized as auth error:', errorMessage);
    return;
  }
  apiLogger.info('[Auth] Processing auth error:', errorMessage);
  try {
    authStorage.clearAuth();
    apiLogger.debug('[Auth] Cleared auth storage');
    // 设置标志让前端知道需要重新登录
    sessionStorage.setItem('authError', errorMessage || '登录已失效，请重新登录');
    apiLogger.debug('[Auth] Set sessionStorage authError');
    // 强制导航到首页 - 使用 replace 避免在历史记录中留下痕迹
    const redirectUrl = window.location.origin + '/';
    apiLogger.debug('[Auth] Redirecting to:', redirectUrl);
    window.location.replace(redirectUrl);
    apiLogger.debug('[Auth] Redirect called');
  } catch (e) {
    apiLogger.error('[Auth] Error in handleAuthError:', e);
    // 最后的后备方案
    window.location.href = '/';
  }
}

async function request(url, options = {}) {
  const token = authStorage.getToken();
  const userId = authStorage.getUserId();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(userId && { 'X-User-Id': userId }),
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  apiLogger.debug(`Request: ${options.method || 'GET'} ${url}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });
  } catch (error) {
    apiLogger.error('Network error:', error);
    throw handleNetworkError(error);
  }

  if (!response.ok) {
    let errorData;
    let errorText = '';
    try {
      errorData = await response.json();
    } catch {
      // JSON解析失败，尝试获取文本响应
      errorText = await response.text().catch(() => '');
      errorData = errorText ? { message: errorText } : {};
    }
    apiLogger.error(`API Error: ${response.status}`, errorData);
    // 检查是否是认证错误 - 支持多种错误消息字段
    const errorMessage = errorData?.message || errorData?.msg || errorData?.error || errorText;
    if (errorMessage && isAuthErrorLocal(errorMessage)) {
      handleAuthError(errorMessage);
    }
    throw parseApiError(response, errorData);
  }

  const data = await response.json();
  apiLogger.debug(`Response: ${url}`, data);
  return data;
}

function createSSEConnection(url, onMessage, onError, onClose) {
  const token = authStorage.getToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  const eventSource = new EventSource(`${API_BASE_URL}${url}`, {
    headers,
  });

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch (e) {
      onMessage?.(event.data);
    }
  };

  eventSource.onerror = (error) => {
    onError?.(error);
  };

  eventSource.onclose = () => {
    onClose?.();
  };

  return {
    close: () => eventSource.close(),
  };
}

function createSSEConnectionForExecution(url, body, onMessage, onError) {
  const token = authStorage.getToken();
  const userId = authStorage.getUserId();
  const headers = {
    'Content-Type': 'application/json',
    ...(userId && { 'X-User-Id': userId }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  let closed = false;
  let reader = null;

  fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body,
  })
  .then(response => {
    if (!response.ok) {
      closed = true;
      response.json().then(errData => {
        const errorMessage = errData.message || `HTTP error! status: ${response.status}`;
        handleAuthError(errorMessage);
        onError?.({ message: errorMessage });
      }).catch(() => {
        const errorMessage = `HTTP error! status: ${response.status}`;
        handleAuthError(errorMessage);
        onError?.({ message: errorMessage });
      });
      return;
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = 'message';  // 持久化 eventType，跨 chunk 保持

    function read() {
      if (closed) return;

      reader.read().then(({ done, value }) => {
        if (done || closed) {
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                // 将 eventType 添加到 data 对象中
                const eventWithType = { ...data, type: eventType };
                if (eventType === 'message') {
                  onMessage?.(eventWithType);
                } else {
                  // 所有事件类型都通过 onMessage 传递
                  onMessage?.(eventWithType);
                }
              } catch (e) {
                apiLogger.warn('[SSE] Parse error:', e, 'dataStr:', dataStr);
              }
            }
          }
        }

        read();
      }).catch(error => {
        if (!closed) {
          onError?.(error);
        }
      });
    }

    read();
  })
  .catch(error => {
    if (!closed) {
      onError?.(error);
    }
  });

  return {
    close: () => {
      closed = true;
      if (reader) {
        reader.cancel();
      }
    },
  };
}

/**
 * Adeptify SSE 流式请求 (用于工作流执行)
 */
function createAdeptifySSEConnection(url, body, onMessage, onError) {
  const token = authStorage.getToken();
  const userId = authStorage.getUserId();
  const headers = {
    'Content-Type': 'application/json',
    ...(userId && { 'X-User-Id': userId }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  let closed = false;
  let reader = null;

  fetch(`${ADEPTIFY_BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body,
  })
  .then(response => {
    if (!response.ok) {
      closed = true;
      response.json().then(errData => {
        const errorMessage = errData.message || `HTTP error! status: ${response.status}`;
        handleAuthError(errorMessage);
        onError?.({ message: errorMessage });
      }).catch(() => {
        const errorMessage = `HTTP error! status: ${response.status}`;
        handleAuthError(errorMessage);
        onError?.({ message: errorMessage });
      });
      return;
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = 'message';

    function read() {
      if (closed) return;

      reader.read().then(({ done, value }) => {
        if (done || closed) {
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                const eventWithType = { ...data, eventType: eventType };
                onMessage?.(eventWithType);
              } catch (e) {
                apiLogger.warn('[SSE] Parse error:', e, 'dataStr:', dataStr);
              }
            }
          }
        }

        read();
      }).catch(error => {
        if (!closed) {
          onError?.(error);
        }
      });
    }

    read();
  })
  .catch(error => {
    if (!closed) {
      onError?.(error);
    }
  });

  return {
    close: () => {
      closed = true;
      if (reader) {
        reader.cancel();
      }
    },
  };
}

export const authApi = {
  // 检查登录状态 - 验证token是否有效
  checkStatus: () => {
    return request('/auth/me');
  },

  register: (account, nickname, password, confirmPassword, verifyCode) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        account,
        name: nickname,
        password,
        verifyCode,
      }),
    });
  },

  login: (account, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        account,
        password,
      }),
    });
  },

  sendVerifyCode: (account) => {
    return request('/auth/sendVerifyCode', {
      method: 'POST',
      body: JSON.stringify({
        account,
      }),
    });
  },
};

export const homePageApi = {
  // 创建项目（只传标题，后端创建空项目）
  createProject: (title) => {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        title,
      }),
    });
  },

  getProjects: () => {
    return request('/projects');
  },

  getRecentProjects: (limit = 10) => {
    return request(`/projects?limit=${limit}`);
  },

  getProject: (projectId) => {
    return request(`/projects/${projectId}`);
  },

  saveProject: (projectId, title, config) => {
    const configStr = typeof config === 'string' ? config : JSON.stringify(config);
    return request(`/projects/${projectId}/save`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        config: configStr,
      }),
    });
  },

  updateProject: (projectId, data) => {
    return request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteProject: (projectId) => {
    return request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  getTemplates: () => {
    return request('/templates');
  },

  forkTemplate: (templateId) => {
    return request(`/projects/${templateId}/fork`, {
      method: 'POST',
    });
  },

  getVersions: (projectId) => {
    return request(`/projects/${projectId}/versions`);
  },

  getVersion: (projectId, versionNumber) => {
    return request(`/projects/${projectId}/versions/${versionNumber}`);
  },

  restoreVersion: (projectId, versionNumber) => {
    return request(`/projects/${projectId}/versions/${versionNumber}/restore`, {
      method: 'POST',
    });
  },

  deleteVersion: (projectId, versionNumber) => {
    return request(`/projects/${projectId}/versions/${versionNumber}`, {
      method: 'DELETE',
    });
  },
};

/**
 * SSE 流式请求基础函数
 * @param {string} url - 请求 URL
 * @param {Object} options - 请求选项
 * @param {Object} callbacks - 回调函数
 * @returns {Object} 包含 close 方法的对象
 */
function createSSEStream(url, options, callbacks) {
  const { body, extraHeaders = {} } = options;
  const token = authStorage.getToken();
  const userId = authStorage.getUserId();
  const headers = {
    'Content-Type': 'application/json',
    ...(userId && { 'X-User-Id': userId }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...extraHeaders,
  };

  let closed = false;
  let reader = null;

  fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body,
  })
    .then(response => {
      if (!response.ok) {
        closed = true;
        response.json().then(errData => {
          const errorMessage = errData.message || `HTTP error! status: ${response.status}`;
          handleAuthError(errorMessage);
          callbacks.onError?.({ message: errorMessage });
        }).catch(() => {
          const errorMessage = `HTTP error! status: ${response.status}`;
          handleAuthError(errorMessage);
          callbacks.onError?.({ message: errorMessage });
        });
        return;
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventType = 'message';

      function read() {
        if (closed) return;

        reader.read().then(({ done, value }) => {
          if (done || closed) return;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              eventType = trimmed.slice(6).trim();
            } else if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr) continue;
              try {
                const data = JSON.parse(dataStr);
                const eventWithType = { ...data, eventType };
                callbacks.onEvent?.(eventType, eventWithType, data);
              } catch (e) {
                apiLogger.warn('[SSE] Parse error:', e, 'dataStr:', dataStr);
              }
            }
          }

          read();
        }).catch(error => {
          if (!closed) callbacks.onError?.({ message: error.message });
        });
      }

      read();
    })
    .catch(error => {
      if (!closed) callbacks.onError?.({ message: error.message });
    });

  return {
    close: () => {
      closed = true;
      if (reader) reader.cancel();
    },
  };
}

/**
 * Adeptify SSE 流式请求
 */
function createAdeptifySSEStream(url, body, callbacks) {
  const token = authStorage.getToken();
  const userId = authStorage.getUserId();
  const headers = {
    'Content-Type': 'application/json',
    ...(userId && { 'X-User-Id': userId }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  let closed = false;
  let reader = null;

  fetch(`${ADEPTIFY_BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body,
  })
    .then(response => {
      if (!response.ok) {
        closed = true;
        response.json().then(errData => {
          const errorMessage = errData.message || `HTTP error! status: ${response.status}`;
          handleAuthError(errorMessage);
          callbacks.onError?.({ message: errorMessage });
        }).catch(() => {
          const errorMessage = `HTTP error! status: ${response.status}`;
          handleAuthError(errorMessage);
          callbacks.onError?.({ message: errorMessage });
        });
        return;
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventType = 'message';

      function read() {
        if (closed) return;

        reader.read().then(({ done, value }) => {
          if (done || closed) return;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              eventType = trimmed.slice(6).trim();
            } else if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr) continue;
              try {
                const data = JSON.parse(dataStr);
                const eventWithType = { ...data, eventType };
                callbacks.onEvent?.(eventType, eventWithType, data);
              } catch (e) {
                apiLogger.warn('[SSE] Parse error:', e, 'dataStr:', dataStr);
              }
            }
          }

          read();
        }).catch(error => {
          if (!closed) callbacks.onError?.({ message: error.message });
        });
      }

      read();
    })
    .catch(error => {
      if (!closed) callbacks.onError?.({ message: error.message });
    });

  return {
    close: () => {
      closed = true;
      if (reader) reader.cancel();
    },
  };
}

/**
 * 发送聊天消息并处理 SSE 流式响应 (Adeptify 新接口)
 * @param {Object} params - 请求参数
 * @param {string} params.projectId - 项目ID
 * @param {string} params.sessionId - 会话ID (可选，不传则后端自动生成)
 * @param {string} params.contextType - 上下文类型: node | global | asset
 * @param {string} params.contextId - 上下文ID (如节点ID)
 * @param {string} params.characterId - 角色ID
 * @param {string} params.message - 消息内容
 * @param {Object} callbacks - 回调函数
 * @returns {Object} 包含 close 方法的对象
 */
export function sendChatMessageStream(params, callbacks) {
  const { projectId, sessionId, contextType, contextId, characterId, message, generation } = params;

  const body = JSON.stringify({
    sessionId: sessionId || null,
    projectId,
    account: authStorage.getUserId() || 'anonymous',
    contextType: contextType || 'global',
    contextId: contextId || 'default',
    message: {
      content: message.trim(),
      metadata: {
        attachments: [],
        context: {
          projectId: String(projectId),
          assetUrls: [],
          characterId: characterId,
        }
      }
    }
  });

  let closed = false;
  let currentGeneration = generation;
  let storedSessionId = sessionId;

  const sse = createAdeptifySSEStream('/chat/completions', body, {
    onEvent: (eventType, eventWithType, data) => {
      // 首次收到 message_start 时，存储返回的 sessionId
      if (eventType === 'message_start' && data.sessionId && !storedSessionId) {
        storedSessionId = data.sessionId;
        apiLogger.info('[Chat] SessionId assigned:', storedSessionId);
      }

      switch (eventType) {
        case 'message_start':
          callbacks.onInit?.(eventWithType);
          break;
        case 'thinking':
          callbacks.onThinking?.(eventWithType);
          break;
        case 'content':
          if (data.type === 'text') {
            // 文本内容，转为 result 格式
            callbacks.onResult?.({ ...data, resultType: 'text', result: data.delta });
          } else if (data.type === 'batch_action') {
            // 批量操作
            callbacks.onData?.(eventWithType);
          }
          break;
        case 'metadata':
          // token 统计，可忽略或传递给 onResult
          break;
        case 'message_end':
          callbacks.onComplete?.(eventWithType);
          break;
        case 'error':
          callbacks.onError?.(eventWithType);
          break;
        default:
          callbacks.onMessage?.(eventWithType);
      }
    },
    onError: callbacks.onError,
  });

  return {
    close: (options = {}) => {
      const { checkGeneration, gen } = options;
      if (checkGeneration && gen !== currentGeneration) {
        return;
      }
      closed = true;
      sse.close();
    },
    generation: currentGeneration,
    getSessionId: () => storedSessionId,
  };
}

export const chatApi = {
  /**
   * 发送聊天消息并处理 SSE 流式响应
   */
  sendMessageStream: (params, callbacks) => {
    return sendChatMessageStream(params, callbacks);
  },

  /**
   * 获取对话历史
   * 新接口：使用 ChatSession
   */
  getChatHistory: (projectId, version = null, agentId = null) => {
    // 生成与后端相同的 sessionId (全局对话)
    const raw = projectId + ":global:default";
    const sessionId = "sess_" + javaHashCode(raw);
    return request(`/v1/chat/sessions/${sessionId}/messages?limit=100`);
  },

  /**
   * 获取节点的历史对话
   * 新接口：使用 ChatSession
   */
  getNodeChatHistory: (projectId, nodeId) => {
    // 生成与后端相同的 sessionId (使用 Java 的 hashCode 算法)
    const raw = projectId + ":node:" + nodeId;
    const sessionId = "sess_" + javaHashCode(raw);
    return request(`/v1/chat/sessions/${sessionId}/messages?limit=100`);
  },
};

export const workSpaceApi = {
  getAgents: () => {
    return request('/workspace/agents');
  },

  getWorkflows: () => {
    return request('/workflows');
  },

  executeWorkflow: (projectId, executionId, projectVersion, nodes, connections, onMessage, onError, upstreamContext) => {
    // 新格式：Adeptify 工作流执行
    const body = JSON.stringify({
      edges: connections.map(conn => ({
        from: conn.from,
        to: conn.to
      })),
      nodes: nodes.map(node => ({
        nodeId: node.id,
        characterId: node.agentCode || node.type,
        input: node.data || {}
      }))
    });

    return createAdeptifySSEConnection(
      '/workflows/run',
      body,
      onMessage,
      onError
    );
  },

  sendMessage: (projectId, projectVersion, agentId, agentName, message, chatType) => {
    return request('/workspace/chat', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        projectVersion,
        agentId,
        agentName,
        message,
        chatType,
      }),
    });
  },

  getChatHistory: (projectId, version = null, agentId = null) => {
    let url = `/workspace/chat?project_id=${projectId}`;
    if (version) url += `&version=${version}`;
    if (agentId) url += `&agent_id=${agentId}`;
    return request(url);
  },

  createVersion: (projectId, data) => {
    return request(`/projects/${projectId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ========== 新的 API 对象 (对接文档接口) ==========

/**
 * 智能体 API
 */
export const agentApi = {
  // 6.1 搜索智能体列表
  search: (tags = [], pageNo = 1, pageSize = 10) => {
    return request('/v1/agents/search', {
      method: 'POST',
      body: JSON.stringify({ tags, pageNo, pageSize }),
    });
  },

  // 6.2 获取智能体详情
  getDetail: (agentId) => {
    return request(`/v1/agents/${agentId}`);
  },

  // 6.3 更新智能体
  update: (agentId, data) => {
    return request(`/v1/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // 6.4 智能体对话 (SSE)
  chat: (agentId, params, callbacks) => {
    const body = JSON.stringify(params);

    return createSSEStream(`/v1/agents/${agentId}/chat/stream`, { body }, {
      onEvent: (eventType, eventWithType, data) => {
        switch (eventType) {
          case 'init': callbacks.onInit?.(data); break;
          case 'thinking': callbacks.onThinking?.(data); break;
          case 'result': callbacks.onResult?.(data); break;
          case 'complete': callbacks.onComplete?.(data); break;
          case 'error': callbacks.onError?.(data); break;
          default: callbacks.onMessage?.(data);
        }
      },
      onError: callbacks.onError,
    });
  },
};

/**
 * 工作流 API
 */
export const workflowApi = {
  // 6.6 工作流执行 (SSE)
  execute: (projectId, nodes, connections, callbacks) => {
    const dag = {
      nodes: nodes.map(node => ({
        nodeId: node.id,
        agentId: node.agentId,
        agentCode: node.agentCode || node.type,
        inputParam: node.data || {}
      }))
    };

    const body = JSON.stringify({
      dag,
      edges: connections.map(conn => ({
        fromNodeId: conn.from,
        toNodeId: conn.to
      }))
    });

    return createSSEConnectionForExecution(
      `/v1/workflows/executions/stream${projectId ? `?projectId=${projectId}` : ''}`,
      body,
      callbacks.onMessage,
      callbacks.onError
    );
  },

  // 6.7 获取执行详情
  getExecutionDetail: (executionId) => {
    return request(`/v1/workflows/executions/${executionId}`);
  },
};

/**
 * 团队 API
 */
export const teamApi = {
  // 6.8 保存团队
  save: (teamData) => {
    return request('/v1/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  // 6.9 获取团队详情
  getDetail: (teamId) => {
    return request(`/v1/teams/${teamId}`);
  },

  // 6.10 搜索团队
  search: (tags = [], pageNo = 1, pageSize = 10) => {
    return request('/v1/teams/search', {
      method: 'POST',
      body: JSON.stringify({ tags, pageNo, pageSize }),
    });
  },
};

/**
 * 方案 API
 */
export const planApi = {
  // 获取方案列表
  getPlans: () => {
    return request('/v1/plans');
  },

  // 获取方案详情
  getPlan: (planId) => {
    return request(`/v1/plans/${planId}`);
  },
};

/**
 * 节点版本 API
 */
export const nodeVersionApi = {
  // 获取节点版本列表
  getVersions: (projectId, nodeId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/versions`);
  },

  // 获取当前版本
  getCurrentVersion: (projectId, nodeId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/versions/current`);
  },

  // 激活版本
  activateVersion: (projectId, nodeId, versionId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/versions/${versionId}/activate`, {
      method: 'POST',
    });
  },

  // 获取运行记录
  getHistory: (projectId, nodeId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/history`);
  },

  // 获取版本详情（含上游节点）
  getVersionDetailWithUpstream: (projectId, nodeId, versionId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/versions/${versionId}/detail-with-upstream`);
  },
};

/**
 * 提案 API
 */
export const proposalApi = {
  // 获取提案列表
  getProposals: (projectId, nodeId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/proposals`);
  },

  // 获取提案详情
  getProposalDetail: (projectId, nodeId, proposalId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/proposals/${proposalId}`);
  },

  // 应用提案
  applyProposal: (projectId, nodeId, proposalId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/proposals/${proposalId}/apply`, {
      method: 'POST',
    });
  },

  // 拒绝提案
  rejectProposal: (projectId, nodeId, proposalId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/proposals/${proposalId}/reject`, {
      method: 'POST',
    });
  },

  // 获取已应用的提案（用于前端临时展示）
  getAppliedProposal: (projectId, nodeId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/applied-proposal`);
  },
};

export default {
  authApi,
  homePageApi,
  workSpaceApi,
  chatApi,
  agentApi,
  workflowApi,
  teamApi,
  nodeVersionApi,
  proposalApi,
};
