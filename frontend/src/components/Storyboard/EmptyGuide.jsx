import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus } from 'lucide-react';
import { useStageStore, STAGES } from '../../stores';
import UploadModal from './UploadModal';
import './EmptyGuide.css';

/**
 * EmptyGuide - 空白故事板引导组件
 *
 * 当项目为空时显示，引导用户选择起点：
 * - 上传剧本
 * - 从空白开始
 *
 * AI 生成剧本通过 FloatingAssistant 发起
 */
function EmptyGuide({ onComplete }) {
  const { setCurrentStage, addStageAsset, selectAsset } = useStageStore();
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 处理选择
  const handleSelect = (option) => {
    if (option === 'upload') {
      setShowUploadModal(true);
    } else if (option === 'blank') {
      // 从空白开始 - 创建空白剧本资产
      const newAsset = {
        id: `script-${Date.now()}`,
        type: STAGES.SCRIPT,
        name: '剧本',
        content: '',
        description: '',
      };
      addStageAsset(STAGES.SCRIPT, newAsset);
      selectAsset(newAsset.id);
      setCurrentStage(STAGES.SCRIPT);
      onComplete?.();
    }
  };

  // 处理文件上传
  const handleUpload = async (file) => {
    console.log('[EmptyGuide] Upload file:', file.name);
    // 创建剧本资产
    const newAsset = {
      id: `script-${Date.now()}`,
      type: STAGES.SCRIPT,
      name: file.name.replace(/\.[^/.]+$/, ''),
      content: '',
      description: '已上传剧本',
    };
    addStageAsset(STAGES.SCRIPT, newAsset);
    selectAsset(newAsset.id);
    setCurrentStage(STAGES.SCRIPT);
    setShowUploadModal(false);
    onComplete?.();
  };

  // 处理文本提交
  const handleTextSubmit = async (text) => {
    console.log('[EmptyGuide] Submit text, length:', text.length);
    // 创建剧本资产
    const newAsset = {
      id: `script-${Date.now()}`,
      type: STAGES.SCRIPT,
      name: '剧本',
      content: text,
      description: '粘贴剧本',
    };
    addStageAsset(STAGES.SCRIPT, newAsset);
    selectAsset(newAsset.id);
    setCurrentStage(STAGES.SCRIPT);
    setShowUploadModal(false);
    onComplete?.();
  };

  return (
    <>
      <motion.div
        className="empty-guide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="empty-guide-content">
          <h2 className="empty-guide-title">你想从哪里开始？</h2>
          <p className="empty-guide-subtitle">
            选择一种方式开启你的创作之旅
          </p>

          <div className="empty-guide-options">
            {/* 上传剧本 */}
            <motion.button
              className="guide-option"
              onClick={() => handleSelect('upload')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="option-icon upload">
                <Upload size={28} />
              </div>
              <div className="option-text">
                <span className="option-title">上传剧本</span>
                <span className="option-desc">支持文件上传或文本复制</span>
              </div>
            </motion.button>

            {/* 从空白开始 */}
            <motion.button
              className="guide-option"
              onClick={() => handleSelect('blank')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="option-icon blank">
                <Plus size={28} />
              </div>
              <div className="option-text">
                <span className="option-title">从空白开始</span>
                <span className="option-desc">支持手动或AI创作</span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* 装饰背景 */}
        <div className="empty-guide-bg">
          <div className="bg-gradient" />
          <div className="bg-grid" />
        </div>
      </motion.div>

      {/* 上传弹窗 - 支持上传文件和粘贴文本 */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        onTextSubmit={handleTextSubmit}
        accept="script"
        title="上传剧本"
      />
    </>
  );
}

export default EmptyGuide;
