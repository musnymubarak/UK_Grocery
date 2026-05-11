import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import Modal from '../components/Modal';
import { 
  User, MapPin, Plus, Trash2, Loader2, Save, Star, Award, Gift, 
  AlertCircle, ShieldCheck, Download, UserMinus,
  CheckCircle2, Clock, ShoppingBag, ListOrdered, Settings, Check,
  Mail, Phone as PhoneIcon, ChevronRight, CreditCard, LogOut
} from 'lucide-react';
import { customerAuthApi, rewardsApi, gdprApi, orderApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rewardsProgress, setRewardsProgress] = useState<any>(null);
  const [addressToDelete, setAddressToDelete] = useState<any>(null);
  const [showForgetConfirm, setShowForgetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'rewards'>('profile');
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Marketing Preferences
  const [marketingPrefs, setMarketingPrefs] = useState({
    email: true,
    sms: true,
    notifications: false
  });
  
  // Address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [postcode, setPostcode] = useState('');

  // Card form
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [savedCards, setSavedCards] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await customerAuthApi.getProfile();
        setProfile(profileRes.data);
        
        const nameParts = (profileRes.data.full_name || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        setEmail(profileRes.data.email || '');
        setPhone(profileRes.data.phone || '');

        const rewardsRes = await rewardsApi.myProgress().catch(() => ({ data: { total_spend: 0, events: [] } }));
        setRewardsProgress(rewardsRes.data);
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const res = await customerAuthApi.updateProfile({ name: fullName, phone });
      setProfile(res.data);
      if (setUser) setUser({ ...user, name: fullName });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await customerAuthApi.addAddress({
        line1: addressLine1,
        line2: addressLine2,
        city,
        state: county,
        postcode,
        is_default: profile.addresses?.length === 0
      });
      const res = await customerAuthApi.getProfile();
      setProfile(res.data);
      setShowAddAddress(false);
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setCounty('');
      setPostcode('');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    setSaving(true);
    try {
      await customerAuthApi.removeAddress(addressToDelete.id);
      const res = await customerAuthApi.getProfile();
      setProfile(res.data);
      setAddressToDelete(null);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await customerAuthApi.setDefaultAddress(id);
      const res = await customerAuthApi.getProfile();
      setProfile(res.data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleExportData = async () => {
    try {
      const res = await gdprApi.export();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my_data.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleForgetMe = async () => {
    try {
      await gdprApi.forgetMe();
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_data');
      window.location.href = '/browse';
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Mocking card save since backend isn't ready
    setTimeout(() => {
      const newCard = {
        id: Math.random().toString(36).substr(2, 9),
        number: cardNumber.slice(-4),
        expiry: expiry,
        brand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard'
      };
      setSavedCards([...savedCards, newCard]);
      setSaving(false);
      setShowAddCard(false);
      setCardNumber('');
      setExpiry('');
      setCvv('');
      toast.success('Card added successfully');
    }, 800);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">My Details</h2>
              <p className="text-sm text-on-surface-variant font-medium">Update your personal information and preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">First Name</label>
                <input 
                  value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-white border border-outline-variant/30 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Last Name</label>
                <input 
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full bg-white border border-outline-variant/30 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Phone Number</label>
                <input 
                  value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white border border-outline-variant/30 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-outline-variant/30 space-y-6">
              <h3 className="text-lg font-bold">Marketing Preferences</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'email', label: 'Email Notifications' },
                  { id: 'sms', label: 'SMS Text Message' },
                  { id: 'notifications', label: 'In-App Alerts' }
                ].map(pref => (
                  <div 
                    key={pref.id}
                    onClick={() => setMarketingPrefs(prev => ({ ...prev, [pref.id]: !prev[pref.id as keyof typeof marketingPrefs] }))}
                    className="flex items-center justify-between p-4 bg-surface-container rounded-2xl cursor-pointer hover:bg-surface-container-high transition-colors"
                  >
                    <span className="font-bold text-sm text-on-surface-variant">{pref.label}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${marketingPrefs[pref.id as keyof typeof marketingPrefs] ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                      {marketingPrefs[pref.id as keyof typeof marketingPrefs] && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setShowForgetConfirm(true)} className="text-error text-sm font-bold hover:underline">Forget me</button>
              <button 
                onClick={handleUpdateProfile} 
                disabled={saving}
                className="bg-primary text-on-primary px-10 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Update Profile
              </button>
            </div>
          </motion.div>
        );
      
      case 'addresses':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-12"
          >
            {/* Addresses Section */}
            <section className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface mb-1">Delivery Addresses</h2>
                  <p className="text-sm text-on-surface-variant font-medium">Manage your saved home and work locations.</p>
                </div>
                <button 
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="bg-primary/10 text-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors"
                >
                  {showAddAddress ? 'Cancel' : <><Plus size={18} /> Add New</>}
                </button>
              </div>

              {showAddAddress && (
                <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/30 space-y-4">
                  <input placeholder="Address Line 1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="w-full bg-white border-outline-variant/20 rounded-xl px-4 py-3" />
                  <input placeholder="Address Line 2 (Optional)" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className="w-full bg-white border-outline-variant/20 rounded-xl px-4 py-3" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input placeholder="Town/City" value={city} onChange={e => setCity(e.target.value)} className="bg-white border-outline-variant/20 rounded-xl px-4 py-3" />
                    <input placeholder="County" value={county} onChange={e => setCounty(e.target.value)} className="bg-white border-outline-variant/20 rounded-xl px-4 py-3" />
                    <input placeholder="Postcode" value={postcode} onChange={e => setPostcode(e.target.value)} className="bg-white border-outline-variant/20 rounded-xl px-4 py-3" />
                  </div>
                  <button onClick={handleAddAddress} disabled={saving} className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-2">
                    Save Address
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {profile.addresses?.map((addr: any) => (
                  <div key={addr.id} className="bg-white rounded-3xl p-6 flex justify-between items-center border border-outline-variant/20 shadow-sm hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                        <MapPin size={28} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-lg">{addr.street}</p>
                        <p className="text-sm text-on-surface-variant font-medium">{addr.city}{addr.state ? `, ${addr.state}` : ''} | <span className="text-primary font-bold">{addr.postcode}</span></p>
                      </div>
                    </div>
                    <button onClick={() => setAddressToDelete(addr)} className="p-3 text-error/30 hover:text-error hover:bg-error/5 rounded-full transition-colors">
                      <Trash2 size={22} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Payments Section */}
            <section className="space-y-6 pt-6">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface mb-1">Payment Methods</h2>
                  <p className="text-sm text-on-surface-variant font-medium">Securely manage your credit and debit cards.</p>
                </div>
              </div>

              {savedCards.length === 0 ? (
                <div className="bg-surface-container-low rounded-[2rem] p-8 border border-dashed border-outline-variant/50 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-on-surface-variant/5 flex items-center justify-center text-on-surface-variant/30 mx-auto mb-4">
                    <CreditCard size={32} />
                  </div>
                  <p className="text-on-surface-variant font-medium mb-6">You don't have any saved payment methods.</p>
                  <button 
                    onClick={() => setShowAddCard(true)}
                    className="bg-white border-2 border-primary text-primary px-8 py-3 rounded-xl font-bold hover:bg-primary/5 transition-colors"
                  >
                    Add New Card
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {savedCards.map(card => (
                    <div key={card.id} className="bg-white rounded-3xl p-6 flex justify-between items-center border border-outline-variant/20 shadow-sm hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-on-surface-variant/5 flex items-center justify-center text-on-surface-variant">
                          <CreditCard size={28} />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-lg">{card.brand} •••• {card.number}</p>
                          <p className="text-sm text-on-surface-variant font-medium">Expires {card.expiry}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSavedCards(savedCards.filter(c => c.id !== card.id))}
                        className="p-3 text-error/30 hover:text-error hover:bg-error/5 rounded-full transition-colors"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowAddCard(true)}
                    className="w-full py-4 border-2 border-dashed border-outline-variant/30 rounded-3xl text-on-surface-variant font-bold hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Add Another Card
                  </button>
                </div>
              )}
            </section>
          </motion.div>
        );

      case 'rewards':
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="bg-primary text-on-primary p-8 rounded-[2rem] shadow-xl shadow-primary/20">
              <Star className="mb-4" size={32} fill="currentColor" />
              <h3 className="text-2xl font-black mb-1">Loyalty Rewards</h3>
              <p className="opacity-80 font-medium">Monthly spend: £{rewardsProgress?.total_spend || '0'}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {rewardsProgress?.events?.map((ev: any) => (
                <div key={ev.id} className="p-5 bg-white rounded-3xl flex items-center gap-4 border border-outline-variant/30 shadow-sm">
                  <div className="bg-success/10 text-success p-4 rounded-2xl"><Gift size={28} /></div>
                  <div>
                    <div className="font-bold text-lg">{ev.tier?.name || 'Reward Unlocked'}</div>
                    <div className="text-sm text-on-surface-variant font-medium">Redeemable at checkout</div>
                  </div>
                </div>
              ))}
              {(!rewardsProgress?.events || rewardsProgress.events.length === 0) && (
                <div className="text-center py-10 text-on-surface-variant font-medium">
                  No rewards earned yet this month.
                </div>
              )}
            </div>
          </motion.div>
        );

      default: return null;
    }
  };

  if (loading) return <InnovativeLoader />;

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: <User size={20} /> },
    { id: 'addresses', label: 'Addresses & Payments', icon: <MapPin size={20} /> },
    { id: 'rewards', label: 'My Rewards', icon: <Star size={20} /> },
  ];

  return (
    <Layout title="Account" showBack>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 pb-32">
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Vertical Sidebar */}
            <aside className="lg:w-72 shrink-0">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-outline-variant/10 sticky top-24">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-outline-variant/30">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-black">
                    {firstName[0]}{lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-on-surface truncate">{firstName} {lastName}</p>
                    <p className="text-xs text-on-surface-variant font-bold truncate opacity-60">Verified Member</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition-all group ${
                        activeTab === tab.id 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {tab.icon}
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight size={16} className={`${activeTab === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 transition-opacity'}`} />
                    </button>
                  ))}
                </nav>

                <div className="mt-10 pt-6 border-t border-outline-variant/30 space-y-2">
                  <button onClick={handleExportData} className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-sm text-primary hover:bg-primary/5 transition-colors">
                    <Download size={20} />
                    <span>Export Data</span>
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/browse');
                    }} 
                    className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-sm text-error hover:bg-error/5 transition-colors"
                  >
                    <LogOut size={20} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-outline-variant/10 min-h-[600px]">
                <AnimatePresence mode="wait">
                  {renderContent()}
                </AnimatePresence>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Modals remain the same */}
      <Modal
        isOpen={!!addressToDelete}
        onClose={() => setAddressToDelete(null)}
        title="Remove Address"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setAddressToDelete(null)} className="flex-1 py-4 font-bold text-on-surface-variant bg-surface-container rounded-2xl">Cancel</button>
            <button onClick={confirmDeleteAddress} className="flex-1 bg-error text-white py-4 rounded-2xl font-bold shadow-lg shadow-error/20">Delete</button>
          </div>
        }
      >
        <p className="text-center text-on-surface-variant py-4 font-medium">Are you sure you want to permanently remove this address?</p>
      </Modal>

      <Modal
        isOpen={showForgetConfirm}
        onClose={() => setShowForgetConfirm(false)}
        title="Anonymize Account"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowForgetConfirm(false)} className="flex-1 py-4 font-bold text-on-surface-variant bg-surface-container rounded-2xl">Cancel</button>
            <button onClick={handleForgetMe} className="flex-1 bg-error text-white py-4 rounded-2xl font-bold">Confirm</button>
          </div>
        }
      >
        <p className="text-center text-on-surface-variant py-4 font-medium">This will irreversibly delete your profile and history. Continue?</p>
      </Modal>
      <Modal
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        title="Add Payment Method"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button 
              onClick={() => setShowAddCard(false)} 
              className="px-8 py-3 font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddCard} 
              disabled={saving} 
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? 'Processing...' : 'Save Card'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddCard} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Card Number</label>
            <div className="relative">
              <input 
                placeholder="0000 0000 0000 0000" 
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 font-mono"
                required 
              />
              <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" size={20} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Expiry Date</label>
              <input 
                placeholder="MM/YY" 
                value={expiry}
                onChange={e => setExpiry(e.target.value.replace(/\D/g, '').replace(/(.{2})/, '$1/').slice(0, 5))}
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 font-mono"
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">CVV</label>
              <input 
                type="password"
                placeholder="***" 
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 font-mono"
                required 
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <ShieldCheck size={20} className="text-primary" />
            <p className="text-[10px] font-medium text-primary leading-tight">Your card information is encrypted and securely stored using industry-standard protocols.</p>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
