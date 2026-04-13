/**
 * 底部 Toast 兼容层
 * 统一使用 Toast.jsx 的 toast API，通过 position: 'bottom' 区分
 */
import { toast } from './Toast';

// 导出统一的 toast 对象（兼容旧代码调用方式）
export const bottomToast = {
  show: (opt) => toast.show({ ...opt, position: 'bottom' }),
  success: (msg) => toast.success(msg, { position: 'bottom' }),
  error: (msg) => toast.error(msg, { position: 'bottom' }),
  warning: (msg) => toast.warning(msg, { position: 'bottom' }),
};

// 导出兼容的容器组件（供 App.jsx 渲染使用）
// 实际渲染由 Toast.jsx 的 ToastContainer 统一处理
export const BottomToastContainer = () => null;

// 默认导出容器组件（供 App.jsx 的 default import 使用）
export default BottomToastContainer;
