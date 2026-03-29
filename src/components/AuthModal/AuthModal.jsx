import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, UserPlus, Loader2 } from 'lucide-react';
import { authApi } from '../../services/api';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // 登录表单
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 注册表单
  const [registerAccount, setRegisterAccount] = useState('');
  const [registerNickname, setRegisterNickname] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerVerifyCode, setRegisterVerifyCode] = useState('');

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 重置表单
  const resetForms = () => {
    setLoginAccount('');
    setLoginPassword('');
    setRegisterAccount('');
    setRegisterNickname('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
    setRegisterVerifyCode('');
    setError('');
  };

  // 切换登录/注册
  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForms();
  };

  // 发送验证码
  const handleSendVerifyCode = async () => {
    if (!registerAccount) {
      setError('请输入账号');
      return;
    }
    setSendingCode(true);
    try {
      await authApi.sendVerifyCode(registerAccount);
      setCountdown(60);
      setError('');
    } catch (err) {
      setError(err.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  // 登录
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginAccount || !loginPassword) {
      setError('请填写账号和密码');
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.login(loginAccount, loginPassword);
      if (response.code === 200 && response.data) {
        const user = {
          id: response.data.id,
          account: response.data.account,
          name: response.data.name,
          avatar: response.data.avatar,
        };
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.id);
        localStorage.setItem('user', JSON.stringify(user));
        onLoginSuccess(user);
        onClose();
        resetForms();
      } else {
        setError(response.message || '登录失败');
      }
    } catch (err) {
      setError(err.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerAccount || !registerNickname || !registerPassword) {
      setError('请填写所有必填项');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.register(
        registerAccount,
        registerNickname,
        registerPassword,
        registerConfirmPassword,
        registerVerifyCode
      );
      if (response.code === 200) {
        // 注册成功，自动登录
        const loginResponse = await authApi.login(registerAccount, registerPassword);
        if (loginResponse.code === 200 && loginResponse.data) {
          const user = {
            id: loginResponse.data.id,
            account: loginResponse.data.account,
            name: loginResponse.data.name,
            avatar: loginResponse.data.avatar,
          };
          localStorage.setItem('token', loginResponse.data.token);
          localStorage.setItem('userId', loginResponse.data.id);
          localStorage.setItem('user', JSON.stringify(user));
          onLoginSuccess(user);
          onClose();
          resetForms();
        }
      } else {
        setError(response.message || '注册失败');
      }
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <h2>{isLogin ? '登录' : '注册'}</h2>
          <p>{isLogin ? '欢迎回来，继续你的创作之旅' : '创建账号，开启AI电影制作'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {isLogin ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-input-group">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="text"
                placeholder="邮箱或手机号"
                value={loginAccount}
                onChange={(e) => setLoginAccount(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="auth-input-group">
              <Lock size={18} className="auth-input-icon" />
              <input
                type="password"
                placeholder="密码"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : '登录'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-input-group">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="text"
                placeholder="邮箱或手机号 *"
                value={registerAccount}
                onChange={(e) => setRegisterAccount(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="auth-input-group">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                placeholder="昵称 *"
                value={registerNickname}
                onChange={(e) => setRegisterNickname(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="auth-input-group">
              <Lock size={18} className="auth-input-icon" />
              <input
                type="password"
                placeholder="密码 *"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="auth-input-group">
              <Lock size={18} className="auth-input-icon" />
              <input
                type="password"
                placeholder="确认密码 *"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="auth-input-group verify-code-group">
              <input
                type="text"
                placeholder="验证码"
                value={registerVerifyCode}
                onChange={(e) => setRegisterVerifyCode(e.target.value)}
                disabled={loading}
                className="verify-code-input"
              />
              <button
                type="button"
                className="send-code-btn"
                onClick={handleSendVerifyCode}
                disabled={sendingCode || countdown > 0 || loading}
              >
                {sendingCode ? (
                  <Loader2 size={14} className="spin" />
                ) : countdown > 0 ? (
                  `${countdown}s`
                ) : (
                  '获取验证码'
                )}
              </button>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : '注册'}
            </button>
          </form>
        )}

        <div className="auth-modal-footer">
          {isLogin ? (
            <p>
              还没有账号？
              <button className="auth-switch-btn" onClick={toggleMode}>
                立即注册
              </button>
            </p>
          ) : (
            <p>
              已有账号？
              <button className="auth-switch-btn" onClick={toggleMode}>
                立即登录
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
