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
}

interface ProductCardProps {
  product: ProductCardProduct;
  key?: React.Key;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find(item => item.id === product.id);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const productImage = product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E40AF&color=fff&size=400`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex items-center p-4 bg-white border-b border-outline-variant/30 ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
    >
      <div className="flex-1 min-w-0 pr-4 flex flex-col justify-between h-full">
        <div>
          <Link to={`/product/${product.id}`} className="block mb-1">
            <h3 className="font-bold text-sm md:text-base text-on-surface line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-on-surface-variant mb-3">
            {product.unit || 'each'}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-lg text-primary">
            £{product.price.toFixed(2)}
          </span>
          
          {!isOutOfStock && (
            cartItem ? (
              <div className="flex items-center bg-primary text-white rounded-full px-2 py-1 gap-3">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product.id, -1);
                  }}
                  className="active:scale-75 transition-transform"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-sm min-w-[12px] text-center">{cartItem.quantity}</span>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product.id, 1);
                  }}
                  className="active:scale-75 transition-transform"
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
                  });
                }}
                className="bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform hover:bg-primary-container"
              >
                <Plus size={14} /> Add
              </button>
            )
          )}
          {isOutOfStock && (
              <span className="text-xs font-bold text-error uppercase tracking-widest bg-error/10 px-2 py-1 rounded">Sold Out</span>
          )}
        </div>
      </div>
      
      <div className="w-20 h-20 shrink-0 bg-white p-1">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img 
            src={productImage} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply"
            referrerPolicy="no-referrer"
          />
        </Link>
      </div>
    </motion.div>
  );
}
