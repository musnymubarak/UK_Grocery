import React from 'react';
import HeroSlider from './HeroSlider';
import BannerStrip from './BannerStrip';
import ProductCarousel from './ProductCarousel';
import CategoryGrid from './CategoryGrid';
import PromoGrid from './PromoGrid';
import type { HomeSection } from '../../types';

interface Props {
  section: HomeSection;
}

/**
 * Dispatches a resolved server section to its renderer by `type`.
 * Unknown types are ignored (return null) for graceful degradation — newer
 * server section types simply do not render on older clients.
 */
const SectionRenderer: React.FC<Props> = ({ section }) => {
  switch (section.type) {
    case 'hero_slider':
      return <HeroSlider section={section} />;
    case 'banner_strip':
      return <BannerStrip section={section} />;
    case 'product_carousel':
      return <ProductCarousel section={section} />;
    case 'category_grid':
      return <CategoryGrid section={section} />;
    case 'promo_grid':
      return <PromoGrid section={section} />;
    default:
      return null;
  }
};

export default SectionRenderer;
