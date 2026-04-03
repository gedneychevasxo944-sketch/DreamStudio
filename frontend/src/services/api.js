import { apiLogger } from '../utils/logger';
import { parseApiError, handleNetworkError, ErrorType } from '../utils/errorHandler';

const API_BASE_URL = 'http://localhost:8080/api';

const getToken = () => localStorage.getItem('token');
const getUserId = () => localStorage.getItem('userId');

// 检查是否是认证错误
function isAuthError(errorMessage) {
  const authErrors = ['用户不存在', '用户未登录', '登录已过期', '认证失败', '请重新登录', '没有访问权限'];
  const result = authErrors.some(e => errorMessage && errorMessage.includes(e));
  console.log('[Auth] isAuthError:', { errorMessage, result, authErrors });
  return result;
}

// 处理认证错误，清除本地存储并提示用户
function handleAuthError(errorMessage) {
  console.log('[Auth] handleAuthError called:', errorMessage);
  if (!isAuthError(errorMessage)) {
    console.log('[Auth] Error not recognized as auth error:', errorMessage);
    return;
  }
  console.log('[Auth] Processing auth error:', errorMessage);
  try {
    // 清除所有可能存储的登录信息
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    console.log('[Auth] Cleared localStorage');
    // 设置标志让前端知道需要重新登录
    sessionStorage.setItem('authError', errorMessage || '登录已失效，请重新登录');
    console.log('[Auth] Set sessionStorage authError');
    // 强制导航到首页 - 使用 replace 避免在历史记录中留下痕迹
    const redirectUrl = window.location.origin + '/';
    console.log('[Auth] Redirecting to:', redirectUrl);
    window.location.replace(redirectUrl);
    console.log('[Auth] Redirect called');
  } catch (e) {
    console.error('[Auth] Error in handleAuthError:', e);
    // 最后的后备方案
    window.location.href = '/';
  }
}

async function request(url, options = {}) {
  const token = getToken();
  const userId = getUserId();

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
    if (errorMessage && isAuthError(errorMessage)) {
      handleAuthError(errorMessage);
    }
    throw parseApiError(response, errorData);
  }

  const data = await response.json();
  apiLogger.debug(`Response: ${url}`, data);
  return data;
}

function createSSEConnection(url, onMessage, onError, onClose) {
  const token = getToken();
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
  const token = getToken();
  const userId = getUserId();
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

    function read() {
      if (closed) return;

      reader.read().then(({ done, value }) => {
        if (done || closed) {
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        let eventType = 'message';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (eventType === 'message' || eventType === 'data') {
                  onMessage?.(data);
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
 * 发送聊天消息并处理 SSE 流式响应
 * @param {Object} params - 请求参数
 * @param {string} params.projectId - 项目ID
 * @param {string} params.projectVersion - 项目版本
 * @param {string} params.agentId - 智能体ID
 * @param {string} params.agentName - 智能体名称
 * @param {string} params.message - 消息内容
 * @param {Object} callbacks - 回调函数
 * @param {Function} callbacks.onThinking - 思考步骤回调 (data) => void
 * @param {Function} callbacks.onResult - 结果回调 (data) => void
 * @param {Function} callbacks.onWorkflowCreated - 工作流创建回调 (nodes, edges) => void
 * @param {Function} callbacks.onComplete - 完成回调 (data) => void
 * @param {Function} callbacks.onError - 错误回调 (data) => void
 * @returns {Object} 包含 close 方法的对象
 */
export function sendChatMessageStream(params, callbacks) {
  const { projectId, projectVersion, agentId, agentName, message } = params;

  const token = getToken();
  const userId = getUserId();
  const headers = {
    'Content-Type': 'application/json',
    ...(userId && { 'X-User-Id': userId }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const body = JSON.stringify({
    projectId,
    projectVersion,
    agentId,
    agentName: agentId,
    message: message.trim(),
  });

  let closed = false;
  let reader = null;

  fetch(`${API_BASE_URL}/workspace/chat`, {
    method: 'POST',
    headers,
    body,
  })
    .then(response => {
      if (!response.ok) {
        closed = true;
        // Try to parse error response from backend
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

      function read() {
        if (closed) return;

        reader.read().then(({ done, value }) => {
          if (done || closed) {
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          let eventType = 'message';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              eventType = trimmed.slice(6).trim();
            } else if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              try {
                const data = JSON.parse(dataStr);

                switch (eventType) {
                  case 'init':
                    callbacks.onInit?.(data);
                    break;
                  case 'thinking':
                    callbacks.onThinking?.(data);
                    break;
                  case 'status':
                    callbacks.onStatus?.(data);
                    break;
                  case 'result':
                    callbacks.onResult?.(data);
                    break;
                  case 'data':
                    callbacks.onData?.(data);
                    break;
                  case 'complete':
                    callbacks.onComplete?.(data);
                    break;
                  case 'error':
                    callbacks.onError?.(data);
                    break;
                  default:
                    // 处理老格式数据
                    if (data.step) {
                      callbacks.onThinking?.(data);
                    } else if (data.resultType !== undefined || data.result !== undefined) {
                      callbacks.onResult?.(data);
                    } else if (data.workflowCreated) {
                      callbacks.onWorkflowCreated?.(data.workflowNodes, data.workflowEdges);
                    } else {
                      callbacks.onMessage?.(data);
                    }
                }
              } catch (e) {
                console.error('[Chat API] Parse error:', e);
              }
            }
          }

          read();
        }).catch(error => {
          if (!closed) {
            callbacks.onError?.({ message: error.message });
          }
        });
      }

      read();
    })
    .catch(error => {
      if (!closed) {
        callbacks.onError?.({ message: error.message });
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

export const chatApi = {
  /**
   * 发送聊天消息并处理 SSE 流式响应
   */
  sendMessageStream: (params, callbacks) => {
    return sendChatMessageStream(params, callbacks);
  },

  /**
   * 获取对话历史
   */
  getChatHistory: (projectId, version = null, agentId = null) => {
    let url = `/workspace/chat?project_id=${projectId}`;
    if (version) url += `&version=${version}`;
    if (agentId) url += `&agent_id=${agentId}`;
    return request(url);
  },
};

export const workSpaceApi = {
  getAgents: () => {
    return request('/workspace/agents');
  },

  getWorkflows: () => {
    return request('/workflows');
  },

  executeWorkflow: (projectId, executionId, projectVersion, nodes, connections, onMessage, onError) => {
    const dag = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        config: node.data || {}
      })),
      edges: connections.map(conn => ({
        from: conn.from,
        to: conn.to
      }))
    };

    const body = JSON.stringify({
      executionId,
      projectVersion,
      dag
    });

    return createSSEConnectionForExecution(
      `/workspace/projects/${projectId}/execute`,
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

export default {
  authApi,
  homePageApi,
  workSpaceApi,
  chatApi,
};
