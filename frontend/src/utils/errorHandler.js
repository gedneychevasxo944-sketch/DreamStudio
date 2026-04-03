/**
 * 统一错误处理工具
 * 提供 API 错误解析、业务异常分类、用户提示等功能
 */

import { warn, error as logError } from './logger';

/**
 * 错误类型枚举
 */
export const ErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',       // 网络错误
  SERVER_ERROR: 'SERVER_ERROR',         // 服务器错误
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 参数校验错误
  AUTH_ERROR: 'AUTH_ERROR',           // 认证错误
  PERMISSION_ERROR: 'PERMISSION_ERROR', // 权限错误
  NOT_FOUND: 'NOT_FOUND',             // 资源不存在
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',     // 未知错误
};

/**
 * 自定义业务异常类
 */
export class AppError extends Error {
  constructor(type, message, code = null, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
  }
}

/**
 * 解析 HTTP 错误状态码
 * @param {number} status - HTTP 状态码
 * @returns {ErrorType} 错误类型
 */
export const parseHttpStatus = (status) => {
  if (status === 401) return ErrorType.AUTH_ERROR;
  if (status === 403) return ErrorType.PERMISSION_ERROR;
  if (status === 404) return ErrorType.NOT_FOUND;
  if (status === 400) return ErrorType.VALIDATION_ERROR;
  if (status >= 500) return ErrorType.SERVER_ERROR;
  if (status >= 400) return ErrorType.VALIDATION_ERROR;
  return ErrorType.UNKNOWN_ERROR;
};

/**
 * 解析 API 响应错误
 * @param {Response} response - fetch Response 对象
 * @param {Object} data - 响应数据
 * @returns {AppError} 解析后的错误
 */
export const parseApiError = (response, data) => {
  const status = response?.status || 0;
  const errorType = parseHttpStatus(status);
  let message = '操作失败';
  let code = null;

  if (data?.message) {
    message = data.message;
  } else if (data?.msg) {
    message = data.msg;
  }

  if (data?.code) {
    code = data.code;
  }

  const error = new AppError(errorType, message, code);

  // 根据状态码添加更多信息
  if (status === 401) {
    error.details = '登录已过期，请重新登录';
    // 可以在这里触发登出逻辑
    // window.dispatchEvent(new CustomEvent('auth:logout'));
  } else if (status === 403) {
    error.details = '没有权限执行此操作';
  } else if (status === 404) {
    error.details = '请求的资源不存在';
  } else if (status >= 500) {
    error.details = '服务器异常，请稍后重试';
  }

  return error;
};

/**
 * 处理 fetch 错误
 * @param {Error} error - 网络错误
 * @returns {AppError} 包装后的错误
 */
export const handleNetworkError = (error) => {
  if (error?.name === 'AbortError') {
    return new AppError(ErrorType.NETWORK_ERROR, '请求已取消');
  }

  if (!navigator.onLine) {
    return new AppError(ErrorType.NETWORK_ERROR, '网络连接已断开');
  }

  return new AppError(
    ErrorType.NETWORK_ERROR,
    '网络异常，请检查网络连接',
    null,
    error?.message
  );
};

/**
 * 全局错误处理器
 * @param {Error|AppError} error - 错误对象
 * @param {Object} options - 配置选项
 * @param {boolean} options.showToast - 是否显示 toast 提示
 * @param {Function} options.onAuthError - 认证错误回调
 */
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    onAuthError = null,
    onServerError = null,
  } = options;

  const errorType = error?.type || ErrorType.UNKNOWN_ERROR;
  const errorMessage = error?.message || '操作失败';

  // 记录错误日志
  logError('[ErrorHandler]', errorType, errorMessage, error?.details || error);

  // 根据错误类型处理
  switch (errorType) {
    case ErrorType.AUTH_ERROR:
      if (showToast) {
        alert('登录已过期，请重新登录');
      }
      onAuthError?.();
      break;

    case ErrorType.PERMISSION_ERROR:
      if (showToast) {
        alert('没有权限执行此操作');
      }
      break;

    case ErrorType.NOT_FOUND:
      if (showToast) {
        alert('请求的资源不存在');
      }
      break;

    case ErrorType.SERVER_ERROR:
      if (showToast) {
        alert('服务器异常，请稍后重试');
      }
      onServerError?.();
      break;

    case ErrorType.NETWORK_ERROR:
      if (showToast) {
        alert('网络异常，请检查网络连接');
      }
      break;

    default:
      if (showToast) {
        alert(errorMessage);
      }
  }

  return error;
};

/**
 * 带错误处理的 async 函数包装
 * @param {Function} fn - 要执行的 async 函数
 * @param {Object} options - 选项
 * @returns {Promise} 包装后的 Promise
 */
export const withErrorHandler = (fn, options = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      throw error;
    }
  };
};

export default {
  ErrorType,
  AppError,
  parseHttpStatus,
  parseApiError,
  handleNetworkError,
  handleError,
  withErrorHandler,
};
