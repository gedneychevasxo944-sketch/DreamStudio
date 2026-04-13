/**
 * 认证信息存储工具
 */

const AUTH_KEYS = {
  TOKEN: 'token',
  USER_ID: 'userId',
  USER: 'user',
};

export const authStorage = {
  getToken: () => localStorage.getItem(AUTH_KEYS.TOKEN),
  getUserId: () => localStorage.getItem(AUTH_KEYS.USER_ID),
  getUser: () => {
    const userStr = localStorage.getItem(AUTH_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  setAuth: (token, userId, user) => {
    localStorage.setItem(AUTH_KEYS.TOKEN, token);
    localStorage.setItem(AUTH_KEYS.USER_ID, userId);
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
  },

  clearAuth: () => {
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER_ID);
    localStorage.removeItem(AUTH_KEYS.USER);
  },
};
