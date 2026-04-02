const API_BASE_URL = 'http://localhost:8080/api';

const getToken = () => localStorage.getItem('token');
const getUserId = () => localStorage.getItem('userId');

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

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
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
      throw new Error(`HTTP error! status: ${response.status}`);
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
                console.log('[SSE] Parse error:', e, 'dataStr:', dataStr);
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
};
