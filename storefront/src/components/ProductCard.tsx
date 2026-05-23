import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../CartContext';

interface ProductCardProduct {
  id: string;
  name: string;
  price: number;
  unit?: string;
  image?: string;
  description?: string;
  category?: string;
  stock?: number;
  is_age_restricted?: boolean;
  badge?: 'OFFER' | 'NEW' | null;
}

interface ProductCardProps {
  product: ProductCardProduct;
  key?: React.Key;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find((item) => item.id === product.id);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const productImage =
    product.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=001d3d&color=fff&size=400`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`ref-card-xl overflow-hidden flex flex-col ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
    >
      <Link to={`/product/${product.id}`} className="block relative h-44 sm:h-52 bg-surface-container-low w-full overflow-hidden">
        {product.badge && (
          <div
            className={`absolute top-2 left-2 text-on-primary font-label-bold font-semibold text-[10px] px-2 py-0.5 rounded-sm z-10 ${
              product.badge === 'NEW' ? 'bg-price-green' : 'bg-secondary'
            }`}
          >
            {product.badge}
          </div>
        )}
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-contain p-2"
          referrerPolicy="no-referrer"
        />
      </Link>

      <div className="p-3 flex flex-col flex-grow">
        <div className="text-price-display text-text-main mb-1">£{product.price.toFixed(2)}</div>
        <Link to={`/product/${product.id}`} className="block flex-grow">
          <h4 className="text-label-bold text-on-surface-variant line-clamp-2 mb-2">{product.name}</h4>
        </Link>
        {product.unit && (
          <p className="text-[11px] text-on-surface-variant -mt-1 mb-2">{product.unit}</p>
        )}

        {!isOutOfStock &&
          (cartItem ? (
            <div className="flex items-center justify-between bg-surface-container border border-outline-variant rounded-md p-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, -1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-dim transition-colors text-text-main"
              >
                <Minus size={14} />
              </button>
              <span className="text-label-bold font-semibold text-text-main">{cartItem.quantity}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, 1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-dim transition-colors text-text-main"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: productImage,
                  description: product.description || '',
                  unit: product.unit || 'each',
                  quantity: 1,
                  is_age_restricted: product.is_age_restricted,
                });
              }}
              className="w-full bg-action-red text-on-primary text-label-bold font-semibold py-2 rounded-md hover:bg-secondary-container transition-colors flex justify-center items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          ))}

        {isOutOfStock && (
          <span className="text-[10px] font-bold text-error uppercase tracking-widest bg-error-container px-2 py-1 rounded text-center">
            Sold Out
          </span>
        )}
      </div>
    </motion.div>
  );
};
