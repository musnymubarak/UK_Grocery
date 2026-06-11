import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SectionAction } from '../types';

/**
 * Returns a handler that maps a server-driven SectionAction to a client
 * navigation, matching the backend contract:
 *   category -> /aisle/{value}
 *   product  -> /product/{value}
 *   search   -> /search?q={value}
 *   offers   -> /offers
 *   url      -> window.open(value, '_blank')
 *   none     -> no-op
 */
export function useSectionAction() {
  const navigate = useNavigate();

  return useCallback(
    (action?: SectionAction | null) => {
      if (!action) return;
      const value = action.value || '';

      switch (action.type) {
        case 'category':
          if (value) navigate(`/aisle/${value}`);
          break;
        case 'product':
          if (value) navigate(`/product/${value}`);
          break;
        case 'search':
          navigate(`/search?q=${encodeURIComponent(value)}`);
          break;
        case 'offers':
          navigate('/offers');
          break;
        case 'url':
          if (value) window.open(value, '_blank', 'noopener,noreferrer');
          break;
        case 'none':
        default:
          break;
      }
    },
    [navigate]
  );
}

export default useSectionAction;
