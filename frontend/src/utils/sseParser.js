/**
 * SSE (Server-Sent Events) 解析工具
 * 负责处理 SSE 流式响应的解析
 */

/**
 * 解析 SSE 数据行
 * @param {string} line - 原始数据行
 * @returns {Object|null} 解析后的数据
 */
export function parseSSELine(line) {
  if (line.startsWith('event:')) {
    return { type: 'event', value: line.slice(6).trim() };
  }
  if (line.startsWith('data:')) {
    const dataStr = line.slice(5).trim();
    try {
      return { type: 'data', value: JSON.parse(dataStr) };
    } catch (e) {
      console.error('[SSE Parser] JSON parse error:', e, 'data:', dataStr);
      return { type: 'data', value: dataStr };
    }
  }
  return null;
}

/**
 * 创建 SSE 流式请求处理函数
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @param {Object} callbacks - 回调函数
 * @returns {Object} 包含 close 方法的对象
 */
export function createSSEStream(url, options, callbacks) {
  const {
    onThinking,
    onResult,
    onWorkflowCreated,
    onComplete,
    onError,
    onInit,
    onStatus,
    onData,
    onMessage,
  } = callbacks;

  let closed = false;
  let reader = null;
  let buffer = '';

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  fetch(url, {
    method: options.method || 'POST',
    headers,
    body: options.body,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
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
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              eventType = trimmed.slice(6).trim();
            } else if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              try {
                const data = JSON.parse(dataStr);

                // 根据事件类型调用对应回调
                switch (eventType) {
                  case 'init':
                    onInit?.(data);
                    break;

                  case 'thinking':
                    onThinking?.(data);
                    break;

                  case 'status':
                    onStatus?.(data);
                    break;

                  case 'result':
                    onResult?.(data);
                    break;

                  case 'data':
                    onData?.(data);
                    break;

                  case 'complete':
                    onComplete?.(data);
                    break;

                  case 'error':
                    onError?.(data);
                    break;

                  default:
                    // 默认 message 事件
                    if (data.step) {
                      // 老格式的思考步骤
                      onThinking?.(data);
                    } else if (data.resultType !== undefined || data.result !== undefined) {
                      // 老格式的结果
                      onResult?.(data);
                    } else if (data.workflowCreated) {
                      // 工作流创建
                      onWorkflowCreated?.(data);
                    } else {
                      onMessage?.(data);
                    }
                }

                // 通用消息回调
                if (eventType !== 'init' && eventType !== 'thinking' &&
                    eventType !== 'status' && eventType !== 'result' &&
                    eventType !== 'data' && eventType !== 'complete' &&
                    eventType !== 'error') {
                  onMessage?.(data, eventType);
                }
              } catch (e) {
                console.error('[SSE Parser] Parse error:', e, 'data:', dataStr);
              }
            }
          }

          read();
        }).catch((error) => {
          if (!closed) {
            console.error('[SSE Parser] Read error:', error);
            onError?.({ message: error.message });
          }
        });
      }

      read();
    })
    .catch((error) => {
      if (!closed) {
        console.error('[SSE Parser] Request error:', error);
        onError?.({ message: error.message });
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
 * 发送聊天消息并处理 SSE 流
 * @param {Object} params - 请求参数
 * @param {string} params.projectId - 项目ID
 * @param {string} params.projectVersion - 项目版本
 * @param {string} params.agentId - 智能体ID
 * @param {string} params.agentName - 智能体名称
 * @param {string} params.message - 消息内容
 * @param {Object} callbacks - 回调函数
 * @returns {Object} 包含 close 方法的对象
 */
export function sendChatMessageStream(params, callbacks) {
  const { projectId, projectVersion, agentId, agentName, message } = params;

  const url = '/api/workspace/chat';
  const body = JSON.stringify({
    projectId,
    projectVersion,
    agentId,
    agentName: agentId,
    message: message.trim(),
  });

  return createSSEStream(url, {
    method: 'POST',
    body,
  }, callbacks);
}

export default {
  parseSSELine,
  createSSEStream,
  sendChatMessageStream,
};
