import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '../ProductCard';
import { useSectionAction } from '../../hooks/useSectionAction';
import type { HomeSection } from '../../types';

interface Props {
  section: HomeSection;
}

/**
 * Section title + horizontally scrollable row of ProductCard for the resolved
 * product dicts in config.items. Optional "See all" -> see_all action.
 */
const ProductCarousel: React.FC<Props> = ({ section }) => {
  const items = (section.config.items as any[]) || [];
  const seeAll = section.config.see_all;
  const onAction = useSectionAction();

  if (items.length === 0) return null;

  return (
    <section>
      {(section.title || seeAll) && (
        <div className="flex justify-between items-end mb-4">
          <div>
            {section.title && <h3 className="text-headline-lg-mobile text-primary">{section.title}</h3>}
            {section.subtitle && (
              <p className="text-sm text-on-surface-variant mt-0.5">{section.subtitle}</p>
            )}
          </div>
          {seeAll && (
            <button
              type="button"
              onClick={() => onAction(seeAll)}
              className="flex items-center gap-0.5 text-sm font-semibold text-action-blue hover:text-primary transition-colors shrink-0"
            >
              {seeAll.label || 'See all'}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory hide-scrollbar">
        {items.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[260px] md:w-[200px] lg:w-[220px]"
          >
            <ProductCard
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit || 'each',
                image:
                  product.image_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=001d3d&color=fff&size=400`,
                description: product.description || '',
                category: product.category_id || '',
                stock: product.stock,
                is_age_restricted: product.is_age_restricted,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductCarousel;
