/**
 * 认证相关常量
 */

export const AUTH_ERROR_MESSAGES = [
  '用户不存在',
  '用户未登录',
  '登录已过期',
  '认证失败',
  '请重新登录',
  '没有访问权限',
];

/**
 * 检查错误消息是否是认证错误
 */
export const isAuthError = (errorMessage) => {
  return AUTH_ERROR_MESSAGES.some(e => errorMessage && errorMessage.includes(e));
};
