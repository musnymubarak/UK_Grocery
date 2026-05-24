import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { 
  Eye, EyeOff, LogIn, Facebook, Apple, 
  UserPlus, Gift, Zap, Tag, ChevronRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailPref, setEmailPref] = useState(false);
  const [smsPref, setSmsPref] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'login-page-bg-override';
    style.innerHTML = `
      .bg-background {
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('login-page-bg-override');
      if (el) el.remove();
    };
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, googleLogin, register, error, clearError } = useAuth();

  const isSignUp = searchParams.get('mode') === 'signup';
  const redirectTo = searchParams.get('redirect') || '/browse';

  const setMode = (mode: 'login' | 'signup') => {
    clearError();
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mode', mode);
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !agreeTerms) {
      toast.error('Please agree to our terms and conditions');
      return;
    }

    setSubmitting(true);
    clearError();
    try {
      if (isSignUp) {
        await register(`${firstName} ${lastName}`.trim(), email, password, phone);
      } else {
        await login(email, password);
      }
      navigate(redirectTo);
    } catch {
      // Error is already set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    alert(`Login with ${provider} will be available soon! We are setting up the secure OAuth connection.`);
  };

  const heroSrc = isSignUp ? "/images/registration_hero.png" : "/images/login_hero.png";

  return (
    <Layout title={isSignUp ? "Create Account" : "Login"} showBack fullWidth>
      <div className="bg-white">
        
        {/* Main Content Body */}
        <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16 flex items-center justify-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            
            {/* Left Column: Form (7 cols on large desktop) */}
            <div className="lg:col-span-6 w-full max-w-md mx-auto">
              
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">
                  {isSignUp ? 'Create Account' : 'Login to your account'}
                </h2>
                <p className="text-[#64748B] font-medium mt-2">
                  {isSignUp ? 'Checkout quickly and use your loyalty points' : 'Checkout quickly and earn member rewards'}
                </p>
              </div>

              {/* Login/Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp ? (
                  <div className="space-y-5">
                    {/* First Name Input */}
                    <div className="relative mt-2">
                      <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-semibold text-gray-500">First Name</label>
                      <input 
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="First Name"
                        className="w-full bg-white border border-[#c4c6cf] rounded-lg px-4 py-3 focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8] transition-all outline-none text-base font-medium text-text-main placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Last Name Input */}
                    <div className="relative mt-2">
                      <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-semibold text-gray-500">Last Name</label>
                      <input 
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Last Name"
                        className="w-full bg-white border border-[#c4c6cf] rounded-lg px-4 py-3 focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8] transition-all outline-none text-base font-medium text-text-main placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Email Input */}
                    <div className="relative mt-2">
                      <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-semibold text-gray-500">Email</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full bg-white border border-[#c4c6cf] rounded-lg px-4 py-3 focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8] transition-all outline-none text-base font-medium text-text-main placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative mt-2">
                      <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-semibold text-gray-500">Phone Number</label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full bg-white border border-[#c4c6cf] rounded-lg px-4 py-3 focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8] transition-all outline-none text-base font-medium text-text-main placeholder:text-gray-400"
                        required
                      />
                    </div>
                    
                    {/* Password Input */}
                    <div className="pt-2">
                      <p className="text-center lg:text-left font-bold text-[#1E293B] mb-4">Create Secure Password</p>
                      <div className="relative mt-2">
                        <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-semibold text-gray-500">Password</label>
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full bg-white border border-[#c4c6cf] rounded-lg px-4 py-3 pr-12 focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8] transition-all outline-none text-base font-medium text-text-main placeholder:text-gray-400"
                          required
                          minLength={6}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Marketing Preferences */}
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <p className="font-bold text-[#1E293B] text-sm">Marketing Preferences</p>
                      <p className="text-xs font-medium text-gray-500 -mt-2">How would you like us to keep in touch with you?</p>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={emailPref}
                            onChange={e => setEmailPref(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-[#005eb8] focus:ring-[#005eb8] cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-gray-600 group-hover:text-text-main transition-colors">Email</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={smsPref}
                            onChange={e => setSmsPref(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-[#005eb8] focus:ring-[#005eb8] cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-gray-600 group-hover:text-text-main transition-colors">SMS</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer group pt-2 border-t border-gray-100">
                          <input 
                            type="checkbox" 
                            checked={agreeTerms}
                            onChange={e => setAgreeTerms(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-[#005eb8] focus:ring-[#005eb8] cursor-pointer mt-0.5"
                            required
                          />
                          <span className="text-xs font-medium text-gray-500 leading-relaxed">
                            Agree to our <button type="button" onClick={() => navigate('/terms')} className="text-[#005eb8] font-bold hover:underline">terms and conditions</button> and <button type="button" onClick={() => navigate('/privacy')} className="text-[#005eb8] font-bold hover:underline">privacy policy</button>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Email Input */}
                    <div className="relative mt-2">
                      <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-semibold text-gray-500">Email</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full bg-white border border-[#c4c6cf] rounded-lg px-4 py-3 focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8] transition-all outline-none text-base font-medium text-text-main placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative mt-2">
                      <label className="absolute -top-2 left-3 px-1 bg-white text-xs font-semibold text-gray-500">Password</label>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-white border border-[#c4c6cf] rounded-lg px-4 py-3 pr-12 focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8] transition-all outline-none text-base font-medium text-text-main placeholder:text-gray-400"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-error/5 border border-error/10 rounded-2xl text-error text-sm font-bold flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                    {error}
                  </div>
                )}

                {/* Primary Action Button */}
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#005eb8] hover:bg-[#004b9c] text-white py-3.5 rounded-lg font-bold text-base transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-sm shadow-[#005eb8]/10"
                >
                  {submitting ? 'Please wait...' : (
                    <>
                      <span>{isSignUp ? 'Create Account' : 'Login'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Social Logins as Outlines */}
              <div className="space-y-3 mt-4">
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('Facebook')}
                  className="w-full border border-gray-300 py-3 rounded-lg font-bold text-[#1E293B] hover:bg-gray-50 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Facebook size={18} fill="#1877F2" className="text-[#1877F2]" />
                  <span className="text-sm">Login with Facebook</span>
                </button>
                
                {/* Custom styled Google button that triggers the hidden native one */}
                <button 
                  type="button"
                  onClick={() => {
                    const googleBtn = googleBtnRef.current?.querySelector('[role="button"]') as HTMLElement | null;
                    if (googleBtn) googleBtn.click();
                  }}
                  className="w-full border border-gray-300 py-3 rounded-lg font-bold text-[#1E293B] hover:bg-gray-50 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  <span className="text-sm">Login with Google</span>
                </button>
                {/* Hidden native Google button for auth flow */}
                <div ref={googleBtnRef} className="hidden">
                  <GoogleLogin
                    onSuccess={credentialResponse => {
                      if (credentialResponse.credential) {
                        googleLogin(credentialResponse.credential)
                          .then(() => navigate(redirectTo))
                          .catch(() => {});
                      }
                    }}
                    onError={() => {
                      toast.error('Google Login Failed');
                    }}
                    useOneTap
                  />
                </div>
              </div>

              {/* Bottom Forgotten Password / Create Account links */}
              <div className="text-center mt-6 space-y-4">
                {!isSignUp ? (
                  <>
                    <button type="button" className="text-xs font-semibold text-gray-500 hover:text-[#005eb8] transition-colors underline underline-offset-4">
                      Forgotten your password?
                    </button>
                    <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-400">Don't have an account?</span>
                      <button 
                        onClick={() => setMode('signup')}
                        className="text-sm font-bold text-[#005eb8] hover:underline"
                      >
                        Create Account
                      </button>
                    </div>
                  </>
                ) : (
                  <button 
                    onClick={() => setMode('login')}
                    className="text-sm font-bold text-[#005eb8] hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    Already have an account? Login <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Hero Image (hidden on small screen, grid-span-6 on large) */}
            <div className="hidden lg:flex lg:col-span-6 items-stretch min-h-[600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? 'reg-img' : 'login-img'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full"
                >
                  <img 
                    src={heroSrc} 
                    alt="Hero" 
                    className="w-full h-full object-cover rounded-2xl shadow-lg"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>


      </div>
    </Layout>
  );
}
