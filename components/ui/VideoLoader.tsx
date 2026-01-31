import React from 'react';

interface VideoLoaderProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

const VideoLoader: React.FC<VideoLoaderProps> = ({ className, width, height }) => {
  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <video
        src="/SCENE2.webm"
        autoPlay
        loop
        muted
        playsInline
        width={width}
        height={height}
        className="object-contain border-none outline-none shadow-none mix-blend-multiply"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          background: 'transparent',
          clipPath: 'inset(2px)', // Crop 2px from edges to remove potential border artifacts
        }}
      />
    </div>
  );
};

export default VideoLoader;
