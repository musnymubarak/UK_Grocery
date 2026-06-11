import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SmartTransparentImage from '../SmartTransparentImage';
import { useSectionAction } from '../../hooks/useSectionAction';
import type { HomeSection, SectionItem } from '../../types';

interface Props {
  section: HomeSection;
}

/**
 * Server-driven hero carousel. Refactor of the original hardcoded banner
 * carousel from Home.tsx — motion/react AnimatePresence fade, autoplay driven
 * by config.interval_ms, prev/next controls + dots, each slide clickable.
 */
const HeroSlider: React.FC<Props> = ({ section }) => {
  const items = (section.config.items as SectionItem[]) || [];
  const autoplay = section.config.autoplay ?? true;
  const intervalMs = section.config.interval_ms ?? 5000;
  const onAction = useSectionAction();

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!autoplay || items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoplay, intervalMs, items.length]);

  if (items.length === 0) return null;

  const active = items[current];

  return (
    <section className="relative">
      <div className="relative rounded-xl overflow-hidden h-[180px] md:h-[300px] lg:h-[400px] bg-surface-container group">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => onAction(active.action)}
          >
            {active.image_url && (
              <SmartTransparentImage
                src={active.image_url}
                alt={active.title || 'Banner'}
                className="w-full h-full"
              />
            )}
            {(active.title || active.subtitle) && (
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 via-black/10 to-transparent p-4 md:p-6">
                {active.title && (
                  <h2 className="text-on-primary text-[20px] md:text-2xl lg:text-headline-lg-mobile font-extrabold tracking-tight">
                    {active.title}
                  </h2>
                )}
                {active.subtitle && (
                  <p className="text-on-primary/90 text-sm md:text-body-md mt-1">{active.subtitle}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {items.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + items.length) % items.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-container-lowest border border-outline-variant rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % items.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-container-lowest border border-outline-variant rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? 'w-4 bg-action-red' : 'w-1.5 bg-surface-container-lowest/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;
