import React from 'react';
import { motion } from 'motion/react';
import SmartTransparentImage from '../SmartTransparentImage';
import { useSectionAction } from '../../hooks/useSectionAction';
import type { HomeSection, SectionItem } from '../../types';

interface Props {
  section: HomeSection;
}

// Promo grids are usually 2-3 wide. Base is 2 columns on mobile.
const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

/**
 * Grid of promotional cards (image / title / subtitle / badge + action).
 * Respects config.columns responsively.
 */
const PromoGrid: React.FC<Props> = ({ section }) => {
  const items = (section.config.items as SectionItem[]) || [];
  const columns = section.config.columns ?? 2;
  const gridClass = COLUMN_CLASSES[columns] ?? COLUMN_CLASSES[2];
  const onAction = useSectionAction();

  if (items.length === 0) return null;

  return (
    <section>
      {(section.title || section.subtitle) && (
        <div className="flex justify-between items-end mb-4">
          <div>
            {section.title && <h3 className="text-headline-lg-mobile text-primary">{section.title}</h3>}
            {section.subtitle && (
              <p className="text-sm text-on-surface-variant mt-0.5">{section.subtitle}</p>
            )}
          </div>
        </div>
      )}

      <div className={`grid ${gridClass} gap-3 sm:gap-4`}>
        {items.map((item, index) => (
          <motion.button
            key={index}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
            onClick={() => onAction(item.action)}
            className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-action-blue hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              {item.image_url && (
                <SmartTransparentImage
                  src={item.image_url}
                  alt={item.title || 'Promotion'}
                  className="h-full w-full"
                />
              )}
              {item.badge && (
                <span className="absolute top-2 left-2 z-10 bg-action-red text-on-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                  {item.badge}
                </span>
              )}
            </div>

            {(item.title || item.subtitle) && (
              <div className="flex flex-col gap-0.5 px-3 py-2.5">
                {item.title && (
                  <span className="text-label-bold text-text-main leading-tight line-clamp-2 group-hover:text-action-blue transition-colors">
                    {item.title}
                  </span>
                )}
                {item.subtitle && (
                  <span className="text-xs text-on-surface-variant line-clamp-2">{item.subtitle}</span>
                )}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default PromoGrid;
