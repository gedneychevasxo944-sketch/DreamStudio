import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Film } from 'lucide-react';
import './Marquee.css';

const MarqueeCard = ({ demo, onExpand }) => {
  return (
    <div className="marquee-card">
      <div className="marquee-thumbnail" onClick={() => onExpand(demo)}>
        <img src={demo.thumbnail} alt={demo.title} loading="lazy" />
        <div className="marquee-overlay">
          <div className="marquee-play-btn">
            <Play size={28} fill="currentColor" />
          </div>
        </div>
        <div className="marquee-duration">{demo.duration}</div>
        <div className="marquee-views">
          <Film size={11} />
          {demo.views} 次浏览
        </div>
      </div>
      <div className="marquee-info">
        <h4 className="marquee-title" title={demo.title}>{demo.title}</h4>
        <p className="marquee-description" title={demo.description}>{demo.description}</p>
        <div className="marquee-tags">
          {demo.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="marquee-tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Marquee = ({ demos, onExpand }) => {
  const [isPaused, setIsPaused] = useState(false);

  if (!demos || demos.length === 0) return null;

  // Duplicate demos for seamless loop
  const duplicatedDemos = [...demos, ...demos];

  return (
    <div
      className="marquee-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`marquee-track ${isPaused ? 'paused' : ''}`}>
        {duplicatedDemos.map((demo, index) => (
          <MarqueeCard
            key={`${demo.id}-${index}`}
            demo={demo}
            onExpand={onExpand}
          />
        ))}
      </div>
    </div>
  );
};

export default Marquee;