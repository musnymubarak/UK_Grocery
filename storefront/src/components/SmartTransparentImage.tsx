import React, { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const SmartTransparentImage: React.FC<Props> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Clean letter fallback
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-xl`}>
        <span className="text-3xl font-bold text-gray-400">
          {alt.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {/* Skeleton shimmer while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl" />
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`h-full w-full object-contain transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default SmartTransparentImage;
