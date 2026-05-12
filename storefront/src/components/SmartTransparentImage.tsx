import React, { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const SmartTransparentImage: React.FC<Props> = ({ src, alt, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transparentSrc, setTransparentSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setTransparentSrc(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setTransparentSrc(src);
        setIsLoaded(true);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setTransparentSrc(src);
        setIsLoaded(true);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const r_bg = data[0];
      const g_bg = data[1];
      const b_bg = data[2];

      if ((r_bg + g_bg + b_bg) / 3 > 200) {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const diff = Math.abs(r - r_bg) + Math.abs(g - g_bg) + Math.abs(b - b_bg);
          const isNearWhite = r > 245 && g > 245 && b > 245;

          if (diff < 40 || isNearWhite) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setTransparentSrc(canvas.toDataURL());
      } else {
        setTransparentSrc(src);
      }
      setIsLoaded(true);
    };
    img.onerror = () => {
      setTransparentSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {/* Skeleton placeholder while loading */}
      {!isLoaded && (
        <div className={`${className} animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] rounded-xl`} />
      )}
      {transparentSrc && (
        <img 
          src={transparentSrc} 
          alt={alt} 
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(alt) + '&background=E2E8F0&color=64748B';
          }}
        />
      )}
    </>
  );
};

export default SmartTransparentImage;
