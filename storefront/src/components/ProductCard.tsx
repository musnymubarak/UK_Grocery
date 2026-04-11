import React from 'react';
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
}

interface ProductCardProps {
  product: ProductCardProduct;
  key?: React.Key;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartItem = cart.find(item => item.id === product.id);

  const productImage = product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=2C682E&color=fff&size=400`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col space-y-4"
    >
      <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-low transition-transform duration-500 group-hover:scale-[1.02]">
        <img 
          src={productImage} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />

        {cartItem ? (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-primary text-on-primary rounded-full px-4 py-2 gap-4 shadow-xl">
            <button 
              onClick={() => updateQuantity(product.id, -1)}
              className="active:scale-75 transition-transform"
            >
              <Minus size={16} />
            </button>
            <span className="font-bold text-sm">{cartItem.quantity}</span>
            <button 
              onClick={() => updateQuantity(product.id, 1)}
              className="active:scale-75 transition-transform"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image: productImage,
              description: product.description || '',
              unit: product.unit || 'each',
              quantity: 1,
            })}
            className="absolute bottom-4 right-4 h-12 w-12 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all hover:bg-primary-container"
          >
            <Plus size={24} />
          </button>
        )}
      </div>
      
      <div className="flex flex-col space-y-1">
        <h3 className="font-headline font-bold text-lg leading-tight group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-secondary">
            {product.description}
          </p>
        )}
        <p className="font-headline font-extrabold text-xl mt-2 text-primary">
          £{product.price.toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
}
