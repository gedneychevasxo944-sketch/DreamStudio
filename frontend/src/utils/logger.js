/**
 * 统一日志工具
 * 按环境控制日志级别：开发环境输出 debug，生产环境自动降级
 */

const isDevelopment = import.meta.env.DEV;

/**
 * 日志级别
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/**
 * 当前日志级别
 * 开发环境: DEBUG
 * 生产环境: WARN
 */
const currentLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;

/**
 * 格式化日志消息
 * @param {string} prefix - 日志前缀
 * @param  {...any} args - 日志参数
 * @returns {string} 格式化后的消息
 */
const formatMessage = (prefix, ...args) => {
  const timestamp = new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `[${timestamp}] [${prefix}]`;
};

/**
 * Debug 级别日志
 * @param  {...any} args - 日志参数
 */
export const debug = (...args) => {
  if (currentLevel <= LogLevel.DEBUG) {
    console.debug(formatMessage('DEBUG', ...args), ...args.slice(1));
  }
};

/**
 * Info 级别日志
 * @param  {...any} args - 日志参数
 */
export const info = (...args) => {
  if (currentLevel <= LogLevel.INFO) {
    console.info(formatMessage('INFO', ...args), ...args.slice(1));
  }
};

/**
 * Warn 级别日志
 * @param  {...any} args - 日志参数
 */
export const warn = (...args) => {
  if (currentLevel <= LogLevel.WARN) {
    console.warn(formatMessage('WARN', ...args), ...args.slice(1));
  }
};

/**
 * Error 级别日志
 * @param  {...any} args - 日志参数
 */
export const error = (...args) => {
  if (currentLevel <= LogLevel.ERROR) {
    console.error(formatMessage('ERROR', ...args), ...args.slice(1));
  }
};

/**
 * 创建带前缀的 logger
 * @param {string} prefix - 日志前缀
 * @returns {Object} logger 对象
 */
export const createLogger = (prefix) => ({
  debug: (...args) => debug(prefix, ...args),
  info: (...args) => info(prefix, ...args),
  warn: (...args) => warn(prefix, ...args),
  error: (...args) => error(prefix, ...args),
});

/**
 * 模块专属 logger
 */
export const apiLogger = createLogger('API');
export const storeLogger = createLogger('STORE');
export const canvasLogger = createLogger('CANVAS');
export const chatLogger = createLogger('CHAT');

export default {
  debug,
  info,
  warn,
  error,
  createLogger,
  apiLogger,
  storeLogger,
  canvasLogger,
  chatLogger,
};
