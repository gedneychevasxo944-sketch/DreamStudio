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
  const { projectId, projectVersion, agentId, agentName, message, nodeId, generation } = params;

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
    nodeId,
  });

  let closed = false;
  let reader = null;
  let currentGeneration = generation;

  closed = false;

  fetch(`${API_BASE_URL}/v1/agents/${agentId}/chat/stream`, {
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
                // 保留原始 type 字段，同时存储 eventType
                const eventWithType = { ...data, eventType };

                switch (eventType) {
                  case 'init':
                    callbacks.onInit?.(eventWithType);
                    break;
                  case 'thinking':
                    callbacks.onThinking?.(eventWithType);
                    break;
                  case 'status':
                    callbacks.onStatus?.(eventWithType);
                    break;
                  case 'result':
                    callbacks.onResult?.(eventWithType);
                    break;
                  case 'data':
                    callbacks.onData?.(eventWithType);
                    break;
                  case 'complete':
                    callbacks.onComplete?.(eventWithType);
                    break;
                  case 'error':
                    callbacks.onError?.(eventWithType);
                    break;
                  default:
                    if (data.step) {
                      callbacks.onThinking?.(eventWithType);
                    } else if (data.resultType !== undefined || data.result !== undefined) {
                      callbacks.onResult?.(eventWithType);
                    } else if (data.workflowCreated) {
                      callbacks.onWorkflowCreated?.(eventWithType.workflowNodes, eventWithType.workflowEdges);
                    } else {
                      callbacks.onMessage?.(eventWithType);
                    }
                }
              } catch (e) {
                console.error('[Chat API] Parse error:', e, 'dataStr was:', dataStr);
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
    close: (options = {}) => {
      const { checkGeneration, gen } = options;
      if (checkGeneration && gen !== currentGeneration) {
        return;
      }
      closed = true;
      if (reader) {
        reader.cancel();
      }
    },
    generation: currentGeneration,
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

  /**
   * 获取节点的历史对话
   */
  getNodeChatHistory: (projectId, nodeId) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/chat-history`);
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
    const dag = {
      nodes: nodes.map(node => ({
        nodeId: node.id,
        agentId: node.agentId,
        agentCode: node.agentCode || node.type,
        inputParam: node.data || {}
      })),
      edges: connections.map(conn => ({
        fromNodeId: conn.from,
        toNodeId: conn.to
      }))
    };

    const body = JSON.stringify({
      dag,
      edges: connections.map(conn => ({
        fromNodeId: conn.from,
        toNodeId: conn.to
      })),
      upstreamContext
    });

    return createSSEConnectionForExecution(
      `/v1/workflows/executions/stream?projectId=${projectId}`,
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
    const token = getToken();
    const userId = getUserId();
    const headers = {
      'Content-Type': 'application/json',
      ...(userId && { 'X-User-Id': userId }),
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    let closed = false;
    let reader = null;

    fetch(`${API_BASE_URL}/v1/agents/${agentId}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    })
      .then(response => {
        if (!response.ok) {
          closed = true;
          response.json().then(errData => {
            const errorMessage = errData.message || `HTTP error! status: ${response.status}`;
            handleAuthError(errorMessage);
            callbacks.onError?.({ message: errorMessage });
          }).catch(() => {
            callbacks.onError?.({ message: `HTTP error! status: ${response.status}` });
          });
          return;
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function read() {
          if (closed) return;
          reader.read().then(({ done, value }) => {
            if (done || closed) return;

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
                    case 'init': callbacks.onInit?.(data); break;
                    case 'thinking': callbacks.onThinking?.(data); break;
                    case 'result': callbacks.onResult?.(data); break;
                    case 'complete': callbacks.onComplete?.(data); break;
                    case 'error': callbacks.onError?.(data); break;
                    default: callbacks.onMessage?.(data);
                  }
                } catch (e) {
                  console.error('[agentApi chat] Parse error:', e);
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
 * 资产 API
 */
export const assetApi = {
  // 获取节点资产
  getNodeAssets: (projectId, nodeId, currentOnly = false) => {
    return request(`/v1/projects/${projectId}/nodes/${nodeId}/assets?currentOnly=${currentOnly}`);
  },

  // 获取项目全部资产
  getProjectAssets: (projectId, currentOnly = false) => {
    return request(`/v1/projects/${projectId}/assets?currentOnly=${currentOnly}`);
  },

  // 激活资产
  activateAsset: (projectId, assetId) => {
    return request(`/v1/projects/${projectId}/assets/${assetId}/activate`, {
      method: 'POST',
    });
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
  assetApi,
  proposalApi,
};
