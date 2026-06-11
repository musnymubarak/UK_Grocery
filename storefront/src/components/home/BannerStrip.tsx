import React from 'react';
import { motion } from 'motion/react';
import SmartTransparentImage from '../SmartTransparentImage';
import { useSectionAction } from '../../hooks/useSectionAction';
import type { HomeSection, SectionItem } from '../../types';

interface Props {
  section: HomeSection;
}

/**
 * Horizontal row of full-width image banners with title/subtitle/badge overlay.
 * A single item renders full-width; multiple items render as a responsive grid.
 * Each banner is clickable -> action.
 */
const BannerStrip: React.FC<Props> = ({ section }) => {
  const items = (section.config.items as SectionItem[]) || [];
  const onAction = useSectionAction();

  if (items.length === 0) return null;

  return (
    <section>
      {(section.title || section.subtitle) && (
        <div className="mb-4">
          {section.title && <h3 className="text-headline-lg-mobile text-primary">{section.title}</h3>}
          {section.subtitle && (
            <p className="text-sm text-on-surface-variant mt-0.5">{section.subtitle}</p>
          )}
        </div>
      )}

      <div className={`grid gap-3 sm:gap-4 ${items.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {items.map((item, index) => (
          <motion.button
            key={index}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onAction(item.action)}
            className="group relative block w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container text-left h-[140px] md:h-[180px]"
          >
            {item.image_url && (
              <SmartTransparentImage
                src={item.image_url}
                alt={item.title || 'Banner'}
                className="w-full h-full"
              />
            )}

            {item.badge && (
              <span className="absolute top-3 left-3 z-10 bg-action-red text-on-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                {item.badge}
              </span>
            )}

            {(item.title || item.subtitle) && (
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/55 via-black/10 to-transparent p-4">
                {item.title && (
                  <h4 className="text-on-primary text-lg font-extrabold tracking-tight leading-tight">
                    {item.title}
                  </h4>
                )}
                {item.subtitle && (
                  <p className="text-on-primary/90 text-sm mt-0.5">{item.subtitle}</p>
                )}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default BannerStrip;
