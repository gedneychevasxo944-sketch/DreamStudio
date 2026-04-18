import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Sparkles, Loader2, Image, Film } from 'lucide-react';
import './UploadModal.css';

/**
 * UploadModal - 上传弹窗组件
 *
 * Props:
 * - isOpen: 是否打开
 * - onClose: 关闭回调
 * - onUpload: 上传文件回调 (file, mode) => void
 * - onAIGenerate: AI生成回调 (topic) => void
 * - accept: 接受的文件类型 'script' | 'image' | 'video' | 'all'
 * - title: 弹窗标题
 */
function UploadModal({
  isOpen,
  onClose,
  onUpload,
  onAIGenerate,
  accept = 'script',
  title = '上传剧本',
}) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'ai'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processMode, setProcessMode] = useState('direct'); // 'direct' | 'ai' - T060
  const fileInputRef = useRef(null);

  // 根据 accept 类型获取文件类型
  const getAcceptedTypes = () => {
    switch (accept) {
      case 'image':
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      case 'video':
        return ['.mp4', '.webm', '.mov', '.avi'];
      case 'all':
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mov', '.avi'];
      case 'script':
      default:
        return ['.txt', '.pdf'];
    }
  };

  // 获取文件类型标签
  const getFileTypeLabel = () => {
    switch (accept) {
      case 'image':
        return '图片';
      case 'video':
        return '视频';
      case 'all':
        return '图片或视频';
      case 'script':
      default:
        return '剧本';
    }
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = getAcceptedTypes();
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validTypes.includes(ext)) {
        alert(`仅支持 ${validTypes.join(', ')} 格式`);
        return;
      }
      setSelectedFile(file);
    }
  };

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    // 模拟上传进度
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // T060: 传递 processMode（'direct' 或 'ai'）
      await onUpload?.(selectedFile, processMode);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        onClose?.();
        resetState();
      }, 500);
    } catch (error) {
      clearInterval(interval);
      alert('上传失败: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理 AI 生成
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);

    try {
      await onAIGenerate?.(aiTopic.trim());
      onClose?.();
      resetState();
    } catch (error) {
      alert('生成失败: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 重置状态
  const resetState = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setAiTopic('');
    setMode('upload');
    setProcessMode('direct');
  };

  // 拖拽上传
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validTypes = getAcceptedTypes();
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (validTypes.includes(ext)) {
        setSelectedFile(file);
      } else {
        alert(`仅支持 ${validTypes.join(', ')} 格式`);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
              <button
                className={`mode-tab ${mode === 'ai' ? 'active' : ''}`}
                onClick={() => setMode('ai')}
              >
                <Sparkles size={16} />
                AI 生成
              </button>
            </div>

            {/* 内容 */}
            <div className="upload-modal-content">
              {mode === 'upload' ? (
                <>
                  {/* T060: 处理模式选择 - 仅非脚本类型显示 */}
                  {accept !== 'script' && (
                    <div className="process-mode-selector">
                      <button
                        className={`process-mode-btn ${processMode === 'direct' ? 'active' : ''}`}
                        onClick={() => setProcessMode('direct')}
                      >
                        <Image size={16} />
                        直接展示
                      </button>
                      <button
                        className={`process-mode-btn ${processMode === 'ai' ? 'active' : ''}`}
                        onClick={() => setProcessMode('ai')}
                      >
                        <Sparkles size={16} />
                        AI 处理
                      </button>
                    </div>
                  )}

                  <div
                    className="upload-zone"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={getAcceptedTypes().join(',')}
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />

                    {selectedFile ? (
                      <div className="selected-file">
                        {selectedFile.type.startsWith('image/') ? <Image size={32} /> :
                         selectedFile.type.startsWith('video/') ? <Film size={32} /> :
                         <FileText size={32} />}
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
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={48} className="upload-icon" />
                        <p className="upload-hint">
                          拖拽文件到此处，或 <span className="link">点击选择</span>
                        </p>
                        <p className="upload-formats">支持 {getAcceptedTypes().join(', ')} 格式</p>
                      </>
                    )}

                    {isUploading && (
                      <div className="upload-progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                        <span className="progress-text">{uploadProgress}%</span>
                      </div>
                    )}
                  </div>

                  {/* T060: AI 处理模式说明 */}
                  {accept !== 'script' && processMode === 'ai' && (
                    <p className="process-mode-hint">
                      AI 将分析{getFileTypeLabel()}内容并生成描述，可用于故事板创作
                    </p>
                  )}
                </>
              ) : (
                <div className="ai-generate-zone">
                  <p className="ai-hint">
                    {accept === 'script'
                      ? '描述你想要创作的故事主题，AI 将帮你生成完整剧本'
                      : `描述你想要创作的${getFileTypeLabel()}内容，AI 将帮你生成素材描述`}
                  </p>
                  <textarea
                    className="ai-topic-input"
                    placeholder={accept === 'script'
                      ? '例如：讲述一个赛博朋克世界的黑客女侠，她需要在数据海洋中寻找失落的记忆...'
                      : '描述你想要创建的素材内容和风格...'}
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    rows={5}
                  />
                </div>
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
                  onClick={handleAIGenerate}
                  disabled={!aiTopic.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      开始生成
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UploadModal;
