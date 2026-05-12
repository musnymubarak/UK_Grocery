import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { 
  Eye, EyeOff, LogIn, Facebook, Mail, Apple, 
  UserPlus, Gift,Zap, Tag, ChevronRight, Phone
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  
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

  return (
    <Layout title={isSignUp ? "Create Account" : "Login"} showBack>
      <div className="min-h-screen bg-[#F1F5F9] pb-20">
        <AnimatePresence mode="wait">
          {/* Header Hero Image - Dynamic based on state */}
          <motion.div 
            key={isSignUp ? 'reg' : 'login'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-[280px] md:h-[350px] w-full overflow-hidden"
          >
            <img 
              src={isSignUp ? "/images/registration_hero.png" : "/images/login_hero.png"} 
              alt="Hero" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F1F5F9] via-transparent to-black/10"></div>
          </motion.div>
        </AnimatePresence>

        {/* Form Card */}
        <div className="max-w-xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 p-8 md:p-12">
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-[#1E293B] tracking-tight">
                {isSignUp ? 'Create Account' : 'Login to your account'}
              </h2>
              <p className="text-on-surface-variant font-medium mt-2">
                {isSignUp ? 'Checkout quickly and use your loyalty points' : 'Checkout quickly and earn member rewards'}
              </p>
            </div>

            {/* Social Logins as Primary Header on Signup */}
            <div className="space-y-3 mb-10">
              <button 
                type="button"
                onClick={() => handleSocialLogin('Facebook')}
                className="w-full border border-outline-variant/50 py-4 rounded-xl font-bold text-[#1E293B] hover:bg-surface-container-low transition-all flex items-center justify-center gap-3"
              >
                <Facebook size={20} fill="#1877F2" className="text-[#1877F2]" />
                Login with Facebook
              </button>
              <div className="google-login-container w-full flex justify-center">
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
                  theme="outline"
                  shape="pill"
                  width="100%"
                  text="continue_with"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-outline-variant/30"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Add Your Details</span>
              <div className="flex-1 h-px bg-outline-variant/30"></div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error/5 border border-error/10 rounded-2xl text-error text-sm font-bold flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp ? (
                <div className="space-y-5">
                  <input 
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full bg-white border border-outline-variant/50 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base font-medium"
                    required
                  />
                  <input 
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full bg-white border border-outline-variant/50 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base font-medium"
                    required
                  />
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-white border border-outline-variant/50 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base font-medium"
                    required
                  />
                  <input 
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full bg-white border border-outline-variant/50 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base font-medium"
                    required
                  />
                  
                  <div className="pt-4">
                    <p className="text-center font-black text-primary mb-5">Create Secure Password</p>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-white border border-outline-variant/50 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base font-medium pr-12"
                        required
                        minLength={6}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Marketing Preferences */}
                  <div className="pt-8">
                    <p className="text-center font-black text-primary mb-2">Marketing Preferences</p>
                    <p className="text-center text-xs font-medium text-on-surface-variant/60 mb-6">How would you like us to keep in touch with you?</p>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={emailPref}
                          onChange={e => setEmailPref(e.target.checked)}
                          className="w-6 h-6 rounded-full border-2 border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer"
                        />
                        <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">Email</span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={smsPref}
                          onChange={e => setSmsPref(e.target.checked)}
                          className="w-6 h-6 rounded-full border-2 border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer"
                        />
                        <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">SMS</span>
                      </label>
                      <label className="flex items-start gap-4 cursor-pointer group pt-2">
                        <input 
                          type="checkbox" 
                          checked={agreeTerms}
                          onChange={e => setAgreeTerms(e.target.checked)}
                          className="w-6 h-6 rounded-md border-2 border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer mt-0.5"
                          required
                        />
                        <span className="text-xs font-medium text-on-surface-variant leading-relaxed">
                          Agree to our <button type="button" onClick={() => navigate('/terms')} className="text-primary font-bold underline underline-offset-2">terms and conditions</button> and <button type="button" onClick={() => navigate('/privacy')} className="text-primary font-bold underline underline-offset-2">privacy policy</button>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-white border border-outline-variant/50 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base font-medium"
                    required
                  />
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-white border border-outline-variant/50 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base font-medium pr-12"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="text-center py-2">
                    <button type="button" className="text-sm font-bold text-on-surface-variant/60 hover:text-primary transition-colors underline underline-offset-4">
                      Forgotten your password?
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
              >
                {submitting ? 'Please wait...' : (
                  <>
                    <LogIn size={20} strokeWidth={3} /> {isSignUp ? 'Create Account' : 'Login'}
                  </>
                )}
              </button>
            </form>

            {/* Bottom Toggle Section */}
            <div className="mt-12 pt-10 border-t-2 border-dashed border-outline-variant/20 text-center">
              {!isSignUp ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-error/5 flex items-center justify-center text-error">
                        <Gift size={24} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-tighter leading-tight text-on-surface-variant">Refer Friends<br/>Get Rewards</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                        <Zap size={24} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-tighter leading-tight text-on-surface-variant">Checkout<br/>Quickly</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/5 flex items-center justify-center text-amber-500">
                        <Tag size={24} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-tighter leading-tight text-on-surface-variant">Great deals<br/>& offers</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMode('signup')}
                    className="w-full bg-white border-2 border-primary text-primary py-4 rounded-xl font-black text-lg hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={20} strokeWidth={3} /> Create Account
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setMode('login')}
                  className="w-full text-primary font-black flex items-center justify-center gap-2 hover:underline"
                >
                  Already have an account? Login <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
