'use client';

import React, { useState } from 'react';

interface SequentialVideoLoaderProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

const SequentialVideoLoader: React.FC<SequentialVideoLoaderProps> = ({
  className,
  width = 300,
  height,
}) => {
  const [showSecondScene, setShowSecondScene] = useState(false);

  return (
    <div
      className={`flex items-center justify-center ${className || ''}`}
      style={{ background: 'transparent' }}
    >
      {!showSecondScene ? (
        <video
          key="scene1"
          src="/SCENE1.webm"
          autoPlay
          muted
          playsInline
          onEnded={() => setShowSecondScene(true)}
          width={width}
          height={height}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            background: 'transparent',
            display: 'block',
            clipPath: 'inset(2px)', // slight crop to remove edge artifacts
          }}
        />
      ) : (
        <video
          key="scene2"
          src="/SCENE2.webm"
          autoPlay
          muted
          playsInline
          loop
          width={width}
          height={height}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            background: 'transparent',
            display: 'block',
            clipPath: 'inset(2px)', // slight crop to remove edge artifacts
          }}
        />
      )}
    </div>
  );
};

export default SequentialVideoLoader;
