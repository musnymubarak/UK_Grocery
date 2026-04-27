import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, register, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      if (isSignUp) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/checkout');
    } catch {
      // Error is already set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="The Conservatory" showBack>
      <main className="flex-grow flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-surface-container-lowest rounded-lg shadow-[0_32px_64px_rgba(30,64,175,0.07)] p-8 md:p-10 z-10 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-primary-container/10 rounded-full mb-4 text-primary">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-7v4h2v-4h3l-4-4-4 4h3z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              {isSignUp ? 'Join our community for fresh daily groceries' : 'Sign in to continue to checkout'}
            </p>
          </div>

          <div className="flex p-1 bg-surface-container-high rounded-full mb-8">
            <button
              onClick={() => { setIsSignUp(false); clearError(); }}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 ${!isSignUp ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            >Login</button>
            <button
              onClick={() => { setIsSignUp(true); clearError(); }}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 ${isSignUp ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
            >Sign Up</button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {isSignUp && (
                <div className="group">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 px-1">Full Name</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-sm px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all outline-none text-sm"
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}
              <div className="group">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 px-1">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-surface-container-high border-none rounded-sm px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all outline-none text-sm"
                    placeholder="••••••••"
                    required
                    minLength={6}
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

            <div className="space-y-4 pt-2">
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-base shadow-[0_8px_24px_rgba(30,64,175,0.18)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.24)] active:scale-95 transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? 'Please wait...' : isSignUp ? 'Create Account' : 'Continue'}
              </button>
            </div>
          </form>
        </div>

        {/* Desktop Decorative Side */}
        <div className="hidden lg:block fixed top-0 right-0 w-1/3 h-full z-0">
          <div className="w-full h-full relative">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" 
              alt="Fresh Groceries" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-surface"></div>
            <div className="absolute bottom-12 left-12 right-12 p-8 bg-surface-container-lowest/80 backdrop-blur-md rounded-lg shadow-xl">
              <h3 className="text-2xl font-bold text-primary mb-2">The freshest groceries from UK's finest suppliers.</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Join 50,000+ families eating healthier every day with our curated grocery baskets.</p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
