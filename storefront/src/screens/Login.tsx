import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/checkout');
  };

  return (
    <Layout title="The Conservatory" showBack>
      <main className="flex-grow flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-surface-container-lowest rounded-lg shadow-[0_32px_64px_rgba(44,104,46,0.08)] p-8 md:p-10 z-10 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-primary-container/10 rounded-full mb-4 text-primary">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-7v4h2v-4h3l-4-4-4 4h3z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight mb-2">Welcome Back</h2>
            <p className="text-on-surface-variant text-sm font-medium">Join our organic garden of fresh produce</p>
          </div>

          <div className="flex p-1 bg-surface-container-high rounded-full mb-8">
            <button className="flex-1 py-2 text-sm font-bold rounded-full bg-surface-container-lowest text-primary shadow-sm transition-all duration-300">Login</button>
            <button className="flex-1 py-2 text-sm font-bold rounded-full text-on-surface-variant hover:text-primary transition-all duration-300">Sign Up</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 px-1">Email Address</label>
                <input 
                  type="email"
                  className="w-full bg-surface-container-high border-none rounded-sm px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all outline-none text-sm"
                  placeholder="hello@conservatory.com"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 px-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-surface-container-high border-none rounded-sm px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all outline-none text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all" />
                <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-xs font-bold text-primary hover:underline underline-offset-4">Forgot Password?</a>
            </div>

            <div className="space-y-4 pt-2">
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-base shadow-[0_8px_24px_rgba(44,104,46,0.2)] hover:shadow-[0_12px_32px_rgba(44,104,46,0.3)] active:scale-95 transition-all duration-300"
              >
                Continue
              </button>
              <p className="text-center text-xs font-medium text-on-surface-variant leading-relaxed">
                You will continue to checkout after logging in
              </p>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-surface-container-high relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-lowest px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-outline">
              Or Social Login
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SocialButton icon="https://www.google.com/favicon.ico" label="Google" />
              <SocialButton icon="https://www.apple.com/favicon.ico" label="Apple" />
            </div>
          </div>
        </div>

        {/* Desktop Decorative Side */}
        <div className="hidden lg:block fixed top-0 right-0 w-1/3 h-full z-0">
          <div className="w-full h-full relative">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" 
              alt="Organic Garden" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-surface"></div>
            <div className="absolute bottom-12 left-12 right-12 p-8 bg-surface-container-lowest/80 backdrop-blur-md rounded-lg shadow-xl">
              <h3 className="text-2xl font-bold text-primary mb-2">The freshest produce from UK's finest organic farms.</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Join 50,000+ families eating healthier every day with our curated harvest baskets.</p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

function SocialButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/30 rounded-xl hover:bg-surface-container-low transition-colors active:scale-95 duration-200">
      <img src={icon} alt={label} className="w-4 h-4 opacity-70" referrerPolicy="no-referrer" />
      <span className="text-xs font-bold text-on-surface-variant">{label}</span>
    </button>
  );
}
