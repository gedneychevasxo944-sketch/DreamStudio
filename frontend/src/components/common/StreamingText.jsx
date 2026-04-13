import { useState, useEffect, useRef } from 'react';

/**
 * 流式文本组件
 * @param {string} text - 完整文本
 * @param {boolean} isStreaming - 是否正在流式输出
 * @param {Object} options - 配置选项
 * @param {string} options.className - 非流式时的 className
 * @param {boolean} options.showCursor - 流式时是否显示闪烁光标
 */
const StreamingText = ({ text, isStreaming, options = {} }) => {
  const {
    className = '',
    showCursor = false,
  } = options;

  const [displayText, setDisplayText] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayText(text);
      return;
    }

    indexRef.current = 0;
    setDisplayText('');

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayText(prev => prev + text[indexRef.current]);
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, isStreaming]);

  if (isStreaming) {
    return (
      <span className={className}>
        {displayText}
        {showCursor && <span className="cursor">|</span>}
      </span>
    );
  }

  return <span className={className}>{displayText}</span>;
};

export default StreamingText;
