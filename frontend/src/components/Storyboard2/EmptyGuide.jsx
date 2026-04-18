import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, Plus } from 'lucide-react';
import { useStageStore, STAGES } from '../../stores';
import UploadModal from './UploadModal';
import './EmptyGuide.css';

/**
 * EmptyGuide - 空白故事板引导组件
 *
 * 当项目为空时显示，引导用户选择起点：
 * - 上传剧本
 * - AI 生成剧本
 * - 从空白开始
 */
function EmptyGuide({ onComplete }) {
  const { currentStage, setCurrentStage } = useStageStore();
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 处理选择
  const handleSelect = (option) => {
    if (option === 'upload') {
      setShowUploadModal(true);
    } else if (option === 'ai') {
      // AI 生成剧本 - 切换到剧本阶段，后续通过对话生成
      setCurrentStage(STAGES.SCRIPT);
      onComplete?.();
    } else if (option === 'blank') {
      // 从空白开始
      setCurrentStage(STAGES.SCRIPT);
      onComplete?.();
    }
  };

  // 处理文件上传
  const handleUpload = async (file, mode) => {
    console.log('[EmptyGuide] Upload file:', file.name, 'mode:', mode);
    // TODO: 调用实际的上传 API
    // 模拟上传完成后切换到剧本阶段
    setCurrentStage(STAGES.SCRIPT);
  };

  // 处理 AI 生成
  const handleAIGenerate = async (topic) => {
    console.log('[EmptyGuide] AI generate topic:', topic);
    // TODO: 调用实际的 AI 生成 API
    // 模拟生成完成后切换到剧本阶段
    setCurrentStage(STAGES.SCRIPT);
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
                <Upload size={24} />
              </div>
              <div className="option-text">
                <span className="option-title">上传剧本</span>
                <span className="option-desc">支持 .txt, .pdf 格式</span>
              </div>
            </motion.button>

            {/* AI 生成 */}
            <motion.button
              className="guide-option"
              onClick={() => handleSelect('ai')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="option-icon ai">
                <Sparkles size={24} />
              </div>
              <div className="option-text">
                <span className="option-title">AI 生成剧本</span>
                <span className="option-desc">描述你的想法，AI 帮你创作</span>
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
                <Plus size={24} />
              </div>
              <div className="option-text">
                <span className="option-title">从空白开始</span>
                <span className="option-desc">手动创建剧本和资产</span>
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

      {/* 上传弹窗 */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        onAIGenerate={handleAIGenerate}
      />
    </>
  );
}

export default EmptyGuide;
