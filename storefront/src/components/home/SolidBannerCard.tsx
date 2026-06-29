import React from 'react';
import { Star, Bike, Truck, Tag, Gift, Car, LucideIcon } from 'lucide-react';
import type { SectionItem } from '../../types';

interface Props {
  item: SectionItem;
}

const getIcon = (name?: string | null): LucideIcon | null => {
  switch (name?.toLowerCase()) {
    case 'star': return Star;
    case 'bike': return Bike;
    case 'moped': return Car;
    case 'delivery': return Truck;
    case 'tag': return Tag;
    case 'rewards': return Gift;
    default: return null;
  }
};

const SolidBannerCard: React.FC<Props> = ({ item }) => {
  const bgColor = item.bg_color || '#005eb8';
  const textColor = item.text_color || '#ffffff';
  const btnColor = item.button_color || '#e53935';
  const IconComponent = getIcon(item.icon_name);

  // Convert hex to rgb for opacity handling (simple fallback if needed, but css works fine)
  // We can use standard inline styles for dynamic colors.

  return (
    <div 
      className="w-full h-full flex flex-row items-center p-4 md:p-8"
      style={{ backgroundColor: bgColor }}
    >
      {IconComponent && (
        <div 
          className="mr-6 shrink-0 rounded-full p-4 flex items-center justify-center"
          style={{ backgroundColor: `${textColor}1A` }} // 1A is ~10% opacity in hex
        >
          <IconComponent color={textColor} size={40} strokeWidth={1.5} />
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-center">
        {item.badge && (
          <div className="mb-2 w-fit">
            <span 
              className="px-2 py-1 text-[10px] md:text-xs font-extrabold uppercase rounded"
              style={{ backgroundColor: textColor, color: bgColor }}
            >
              {item.badge}
            </span>
          </div>
        )}
        
        {item.title && (
          <h2 
            className="text-[20px] xs:text-2xl md:text-headline-lg-mobile font-extrabold tracking-tight mb-2 line-clamp-2"
            style={{ color: textColor }}
          >
            {item.title}
          </h2>
        )}
        
        {item.subtitle && (
          <p 
            className="text-sm md:text-base font-medium line-clamp-2"
            style={{ color: `${textColor}E6` }} // E6 is ~90% opacity
          >
            {item.subtitle}
          </p>
        )}
      </div>

      {item.button_text && (
        <div className="ml-4 shrink-0">
          <button 
            className="px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold text-xs md:text-sm transition-transform hover:scale-105"
            style={{ backgroundColor: btnColor, color: '#ffffff' }}
          >
            {item.button_text}
          </button>
        </div>
      )}
    </div>
  );
};

export default SolidBannerCard;
