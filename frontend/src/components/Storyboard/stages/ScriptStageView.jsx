import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles } from 'lucide-react';
import AssetDetailPanel from '../AssetDetailPanel';
import ScriptAssistantPanel from '../ScriptAssistantPanel';
import ScriptParser from '../ScriptParser';
import { STAGES } from '../../../stores/stageStore';

/**
 * ScriptStageView - 剧本阶段视图
 *
 * Props:
 * - scriptAsset: Asset - 当前剧本资产
 * - scriptAssistantOpen: boolean - 助手面板是否打开
 * - onOpenScriptAssistant: () => void
 * - onCloseScriptAssistant: () => void
 * - onUpdateAsset: (id, updates) => void
 * - onAIParse: () => void
 * - isParsing: boolean
 * - showScriptParser: boolean
 * - parseResult: object
 * - onParseConfirm: (result) => void
 * - onParseCancel: () => void
 * - onParseRetry: () => void
 */
const ScriptStageView = ({
  scriptAsset,
  scriptAssistantOpen,
  onOpenScriptAssistant,
  onCloseScriptAssistant,
  onUpdateAsset,
  onAIParse,
  isParsing,
  showScriptParser,
  parseResult,
  onParseConfirm,
  onParseCancel,
  onParseRetry,
}) => {
  const isScriptEmpty = !scriptAsset?.content;

  // 剧本助手面板回调
  const handleScriptAccept = (content) => {
    onUpdateAsset(scriptAsset?.id || 'script-main', { content });
    onCloseScriptAssistant();
  };

  const handleScriptReject = () => {
    // 拒绝后可以继续对话，不需要关闭面板
  };

  return (
    <div className="script-stage-layout">
      {/* 左侧主区域 70% */}
      <div className="script-main-area">
        {/* 剧本引导提示 - 仅内容为空时显示 */}
        {isScriptEmpty && (
          <motion.div
            className="script-guidance"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="guidance-icon">💡</div>
            <div className="guidance-text">
              <strong>开始创作你的剧本</strong>
              <p>在下方编辑剧本，或让AI帮你生成 / 提取素材</p>
            </div>
          </motion.div>
        )}

        <AssetDetailPanel
          asset={scriptAsset || {
            id: 'script-main',
            type: STAGES.SCRIPT,
            name: '剧本',
            content: '',
          }}
          onUpdate={onUpdateAsset}
        />

        {/* 底部按钮栏 */}
        <div className="script-bottom-actions">
          <div className="left-actions">
            <button
              className="action-btn"
              onClick={onOpenScriptAssistant}
              disabled={isScriptEmpty}
            >
              <FileText size={16} className="icon" />
              生成目录
            </button>
            <button
              className="action-btn"
              onClick={onAIParse}
              disabled={isScriptEmpty || isParsing}
            >
              <Sparkles size={16} className="icon" />
              {isParsing ? '提取中...' : 'AI提取素材'}
            </button>
          </div>
          <div className="right-actions">
            <button
              className="action-btn primary"
              onClick={onOpenScriptAssistant}
            >
              <Sparkles size={16} className="icon" />
              AI生成剧本
            </button>
          </div>
        </div>
      </div>

      {/* 右侧助手面板 30% */}
      <AnimatePresence>
        {scriptAssistantOpen && (
          <div className="script-assistant-area">
            <ScriptAssistantPanel
              isOpen={scriptAssistantOpen}
              onClose={onCloseScriptAssistant}
              onAccept={handleScriptAccept}
              onReject={handleScriptReject}
              scriptContent={scriptAsset?.content || ''}
              agentId={3}
            />
          </div>
        )}
      </AnimatePresence>

      {/* T050: 剧本解析结果弹窗 */}
      <ScriptParser
        isOpen={showScriptParser}
        parseResult={parseResult}
        onConfirm={onParseConfirm}
        onCancel={onParseCancel}
        onRetry={onParseRetry}
      />
    </div>
  );
};

export default ScriptStageView;
