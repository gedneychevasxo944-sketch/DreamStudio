import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Loader2, Sparkles } from 'lucide-react';
import './UploadModal.css';

/**
 * UploadModal - 上传弹窗组件
 *
 * 支持两种方式（根据 stage 决定）：
 * - 上传文件（所有阶段）
 * - 粘贴文本（仅 SCRIPT 阶段）
 *
 * Props:
 * - isOpen: 是否打开
 * - onClose: 关闭回调
 * - onUpload: 上传文件回调 (file, options) => void
 *   - options.enableAI: boolean - 是否启用 AI 解析
 * - onTextSubmit: 提交文本回调 (text) => void
 * - accept: 接受的文件类型 'script' | 'image' | 'video' | 'all'
 * - title: 弹窗标题
 * - stage: 当前阶段，用于决定显示哪些选项
 */
function UploadModal({
  isOpen,
  onClose,
  onUpload,
  onTextSubmit,
  accept = 'script',
  title = '上传剧本',
  stage = null,
}) {
  // stage 判断
  const isScriptStage = stage === 'script';
  const isAssetStage = ['character', 'scene', 'prop'].includes(stage);

  // 是否显示 AI 解析选项（角色/场景/道具阶段）
  const showAIOption = isAssetStage;
  // 是否显示粘贴文本 tab（仅剧本阶段）
  const showTextTab = isScriptStage;

  const [mode, setMode] = useState('upload'); // 'upload' | 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragover, setIsDragover] = useState(false);
  const [scriptText, setScriptText] = useState('');
  const [enableAI, setEnableAI] = useState(true); // AI 解析开关
  const fileInputRef = useRef(null);

  // 根据不同阶段获取 AI 解析提示文字
  const getAIHintText = () => {
    switch (stage) {
      case 'character':
        return '将自动识别图片中的角色信息，并反推生成 prompt';
      case 'scene':
        return '将自动识别图片中的场景信息，并反推生成 prompt';
      case 'prop':
        return '将自动识别图片中的道具信息，并反推生成 prompt';
      default:
        return '将自动识别图片内容并进行处理';
    }
  };

  // 根据 accept 类型获取文件类型
  const getAcceptedTypes = () => {
    switch (accept) {
      case 'image':
        return '.jpg,.jpeg,.png,.gif,.webp,.svg';
      case 'video':
        return '.mp4,.webm,.mov,.avi';
      case 'all':
        return '.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.avi';
      case 'script':
      default:
        return '.txt,.pdf';
    }
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    // 模拟上传进度
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(uploadInterval);
          return prev;
        }
        return prev + 15;
      });
    }, 100);

    try {
      // 如果启用了 AI 解析，先模拟上传完成，再模拟 AI 解析
      if (enableAI && showAIOption) {
        await onUpload?.(selectedFile, { enableAI: true });
        clearInterval(uploadInterval);
        setUploadProgress(100);

        // 模拟 AI 解析进度
        setTimeout(() => {
          setIsUploading(false); // 结束上传状态
          // AI 解析进度会在 onUpload 内部处理
        }, 300);
      } else {
        await onUpload?.(selectedFile, { enableAI: false });
        clearInterval(uploadInterval);
        setUploadProgress(100);
        setTimeout(() => {
          resetState();
        }, 300);
      }
    } catch (error) {
      clearInterval(uploadInterval);
      alert('上传失败: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理文本提交
  const handleTextSubmit = async () => {
    if (!scriptText.trim()) return;

    try {
      await onTextSubmit?.(scriptText.trim());
      resetState();
    } catch (error) {
      alert('提交失败: ' + error.message);
    }
  };

  // 重置状态
  const resetState = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setScriptText('');
    setMode('upload');
    setEnableAI(true);
    setParseProgress(0);
  };

  // 拖拽上传
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragover(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="upload-modal-wrapper">
          {/* 遮罩层 */}
          <motion.div
            className="upload-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 弹窗 */}
          <motion.div
            className="upload-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 头部 */}
            <div className="upload-modal-header">
              <h2>{title}</h2>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* 模式切换 */}
            <div className="mode-tabs">
              <button
                className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
                onClick={() => setMode('upload')}
              >
                <Upload size={16} />
                上传文件
              </button>
              {showTextTab && (
                <button
                  className={`mode-tab ${mode === 'text' ? 'active' : ''}`}
                  onClick={() => setMode('text')}
                >
                  <FileText size={16} />
                  粘贴文本
                </button>
              )}
            </div>

            {/* 内容 */}
            <div className="upload-modal-content">
              {mode === 'upload' ? (
                <>
                  <div
                    className={`upload-zone ${isDragover ? 'dragover' : ''} ${selectedFile ? 'has-file' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragover(true); }}
                    onDragLeave={() => setIsDragover(false)}
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={getAcceptedTypes()}
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />

                    {selectedFile ? (
                      <div className="selected-file">
                        <FileText size={36} className="file-icon" />
                        <div className="file-info">
                          <span className="file-name">{selectedFile.name}</span>
                          <span className="file-size">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          className="remove-file-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon-wrapper">
                          <Upload size={40} className="upload-icon" />
                        </div>
                        <p className="upload-hint">
                          {accept === 'image'
                            ? '拖拽图片到此处'
                            : '拖拽文件到此处'}
                        </p>
                        <p className="upload-or">或</p>
                        <p className="upload-action">点击选择文件</p>
                        <p className="upload-formats">
                          {accept === 'image'
                            ? '支持 .jpg, .png, .webp, .svg 格式'
                            : '支持 .txt, .pdf 格式'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* AI 解析选项 - 仅图片上传时显示 */}
                  {showAIOption && !isUploading && (
                    <div className="ai-parse-option">
                      <label className="ai-parse-toggle">
                        <input
                          type="checkbox"
                          checked={enableAI}
                          onChange={(e) => setEnableAI(e.target.checked)}
                        />
                        <span className="toggle-switch"></span>
                        <span className="toggle-label">
                          <Sparkles size={14} />
                          AI 解析图片
                        </span>
                      </label>
                      <p className="ai-parse-hint">
                        {enableAI
                          ? getAIHintText()
                          : '仅上传图片，不进行 AI 解析'}
                      </p>
                    </div>
                  )}

                  {/* 上传进度 */}
                  {isUploading && (
                    <div className="upload-progress">
                      <div className="upload-progress-bar">
                        <div
                          className={`upload-progress-bar-fill ${enableAI && showAIOption ? 'ai-progress' : ''}`}
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="upload-progress-text">
                        <span>
                          {enableAI && showAIOption ? 'AI 解析中...' : '上传中...'}
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-input-zone">
                    <textarea
                      className="script-text-input"
                      placeholder="在此粘贴剧本内容..."
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      rows={12}
                    />
                    <div className="text-input-hint">
                      支持直接粘贴剧本文本，AI 将自动处理
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 底部操作 */}
            <div className="upload-modal-footer">
              <button className="btn-secondary" onClick={onClose}>
                取消
              </button>
              {mode === 'upload' ? (
                <button
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      上传
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleTextSubmit}
                  disabled={!scriptText.trim()}
                >
                  <FileText size={16} />
                  提交剧本
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default UploadModal;
