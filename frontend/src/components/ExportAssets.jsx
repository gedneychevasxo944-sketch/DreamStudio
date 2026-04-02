import { useState } from 'react';
import { Package, Loader2, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';
import './ExportAssets.css';

const ExportAssets = ({ projectName = '未命名项目', assets = {} }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 模拟资产数据
  const defaultAssets = {
    proposal: {
      name: '项目立项书',
      status: 'verified',
      content: '项目可行性分析：95分\n目标时长：3分钟\n风格关键词：赛博朋克、未来都市、霓虹灯光'
    },
    script: {
      name: '分场剧本',
      status: 'verified',
      content: '场景一：开场 - 雨夜霓虹街道\n场景二：追逐 - 空中飞车追逐战\n场景三：高潮 - 摩天大楼对决'
    },
    visualAssets: [
      { name: '主角概念设计', type: 'image', prompt: 'cyberpunk protagonist, neon lighting...' },
      { name: '场景氛围参考', type: 'image', prompt: 'futuristic cityscape, rain, neon signs...' }
    ],
    storyboard: {
      name: 'AI分镜总表',
      scenes: [
        { id: 1, duration: '0-5s', action: '开场推进', prompt: 'wide shot, cyberpunk city...' },
        { id: 2, duration: '5-15s', action: '追逐戏', prompt: 'aerial view, flying cars...' }
      ]
    },
    prompts: {
      name: '视频提示词包',
      content: `[场景1] 0-5s\n主体：赛博朋克主角\n动作：雨中行走\n环境：霓虹街道\n\n[场景2] 5-15s\n主体：飞行汽车\n动作：高速追逐\n环境：未来都市上空`
    },
    finalVideo: {
      name: '最终成片',
      status: 'verified',
      url: 'video.mp4'
    }
  };

  const projectAssets = { ...defaultAssets, ...assets };

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const zip = new JSZip();
      const folderName = projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const rootFolder = zip.folder(folderName);

      // 01_项目立项书
      if (projectAssets.proposal) {
        rootFolder.file('01_项目立项书.txt', projectAssets.proposal.content);
      }

      // 02_分场剧本
      if (projectAssets.script) {
        rootFolder.file('02_分场剧本.txt', projectAssets.script.content);
      }

      // 03_美术资产
      const visualFolder = rootFolder.folder('03_美术资产');
      if (projectAssets.visualAssets) {
        projectAssets.visualAssets.forEach((asset) => {
          visualFolder.file(`${asset.name}_提示词.txt`, asset.prompt);
        });
      }

      // 04_AI分镜总表
      if (projectAssets.storyboard) {
        let storyboardContent = '场景ID, 时间, 动作描述, 提示词\n';
        projectAssets.storyboard.scenes.forEach(scene => {
          storyboardContent += `${scene.id}, ${scene.duration}, ${scene.action}, ${scene.prompt}\n`;
        });
        rootFolder.file('04_AI分镜总表.csv', storyboardContent);
      }

      // 05_视频提示词包
      if (projectAssets.prompts) {
        rootFolder.file('05_视频提示词包.txt', projectAssets.prompts.content);
      }

      // 06_最终成片（占位文件）
      if (projectAssets.finalVideo) {
        rootFolder.file('06_最终成片.mp4.placeholder', '最终成片文件请从资产库下载');
      }

      // 生成 README
      const readmeContent = `# ${projectName}

## 项目资产清单

本项目包含以下已核验资产：

1. **项目立项书** - 包含可行性分析和项目规划
2. **分场剧本** - 完整的场景分解和动作描述
3. **美术资产** - 参考图和对应的提示词
4. **AI分镜总表** - 分镜执行表（CSV格式）
5. **视频提示词包** - 完整的提示词公式
6. **最终成片** - 渲染完成的视频文件

## 使用说明

- 所有文本文件均为 UTF-8 编码
- 美术资产文件夹包含提示词文本文件
- AI分镜总表可用 Excel 打开编辑

生成时间：${new Date().toLocaleString('zh-CN')}
`;
      rootFolder.file('README.md', readmeContent);

      // 生成 ZIP
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // 下载文件
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName}_资产包.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 显示成功状态
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setIsExporting(false);
      }, 2000);

    } catch (error) {
      console.error('导出失败:', error);
      setIsExporting(false);
    }
  };

  return (
    <button 
      className={`export-assets-btn ${isExporting ? 'loading' : ''} ${exportSuccess ? 'success' : ''}`}
      onClick={handleExport}
      disabled={isExporting}
      title="导出全套已核验资产 (.zip)"
    >
      {isExporting ? (
        <>
          <Loader2 size={14} className="spinning" />
          <span>打包中...</span>
        </>
      ) : exportSuccess ? (
        <>
          <CheckCircle size={14} />
          <span>已导出</span>
        </>
      ) : (
        <>
          <Package size={14} />
          <span>导出资产</span>
        </>
      )}
    </button>
  );
};

export default ExportAssets;
