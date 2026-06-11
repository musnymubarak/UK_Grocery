import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import SmartTransparentImage from '../SmartTransparentImage';
import type { HomeSection, SectionCategory } from '../../types';

interface Props {
  section: HomeSection;
}

// Map server `columns` to a Tailwind grid-cols class. Tailwind needs literal
// class names, so we key them explicitly. Base is always 2 columns on mobile.
const COLUMN_CLASSES: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
};

/**
 * Server-driven category tile grid. Extracted from the original Home.tsx
 * "Categories Grid" section — modern image-forward tiles linking to /aisle/{id}.
 * Respects config.columns responsively.
 */
const CategoryGrid: React.FC<Props> = ({ section }) => {
  const categories = (section.config.items as SectionCategory[]) || [];
  const columns = section.config.columns ?? 6;
  const gridClass = COLUMN_CLASSES[columns] ?? COLUMN_CLASSES[6];

  const getCategoryImage = (cat: SectionCategory) =>
    cat.image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=001d3d&color=fff&size=400`;

  if (categories.length === 0) return null;

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
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
          >
            <Link
              to={`/aisle/${category.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest transition-all duration-200 hover:-translate-y-0.5 hover:border-action-blue hover:shadow-lg"
            >
              <div className="relative flex aspect-[5/4] items-center justify-center p-4">
                <SmartTransparentImage
                  src={getCategoryImage(category)}
                  alt={category.name}
                  className="h-full w-full object-contain drop-shadow-sm transition-transform duration-300 ease-out group-hover:scale-110"
                />
              </div>
              <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-outline-variant/60 px-3 py-2.5">
                <span className="text-label-bold text-text-main leading-tight line-clamp-2 group-hover:text-action-blue transition-colors">
                  {category.name}
                </span>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-on-surface-variant transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-action-blue"
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
