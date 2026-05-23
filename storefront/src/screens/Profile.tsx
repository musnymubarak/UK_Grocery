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
  const { customer, isAuthenticated, logout } = useAuth();
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
    if (!isAuthenticated) {
      logout();
      navigate('/login');
      return;
    }

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
      } catch (err: any) {
        console.error("Data fetch error:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, navigate, logout]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const res = await customerAuthApi.updateProfile({ name: fullName, phone });
      setProfile(res.data);
      // Update local storage to keep header in sync
      const savedCustomer = localStorage.getItem('customer_data');
      if (savedCustomer) {
        try {
          const parsed = JSON.parse(savedCustomer);
          parsed.name = fullName;
          parsed.phone = phone;
          localStorage.setItem('customer_data', JSON.stringify(parsed));
        } catch (e) {
          console.error(e);
        }
      }
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
        is_default: profile?.addresses?.length === 0
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
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3.5 text-[15px] text-text-main outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Last Name</label>
                <input 
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3.5 text-[15px] text-text-main outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue transition-colors"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Phone Number</label>
                <input 
                  value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3.5 text-[15px] text-text-main outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue transition-colors"
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
                    className="flex items-center justify-between p-4 bg-surface-container rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors"
                  >
                    <span className="font-semibold text-sm text-on-surface-variant">{pref.label}</span>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${marketingPrefs[pref.id as keyof typeof marketingPrefs] ? 'bg-action-blue border-action-blue' : 'border-outline-variant'}`}>
                      {marketingPrefs[pref.id as keyof typeof marketingPrefs] && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setShowForgetConfirm(true)} className="text-error text-sm font-semibold hover:underline">Forget me</button>
              <button 
                onClick={handleUpdateProfile} 
                disabled={saving}
                className="bg-action-red text-on-primary px-6 py-2.5 rounded-md text-label-bold font-semibold flex items-center gap-2 hover:bg-secondary active:scale-[0.98] transition-all"
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
                  className="bg-action-blue/10 text-action-blue px-4 py-2 rounded-md text-label-bold font-semibold flex items-center gap-2 hover:bg-action-blue/20 transition-colors"
                >
                  {showAddAddress ? 'Cancel' : <><Plus size={18} /> Add New</>}
                </button>
              </div>

              {showAddAddress && (
                <div className="bg-surface-container p-5 rounded-lg border border-outline-variant space-y-4">
                  <input placeholder="Address Line 1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3.5 text-[15px] outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue transition-colors" />
                  <input placeholder="Address Line 2 (Optional)" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3.5 text-[15px] outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue transition-colors" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input placeholder="Town/City" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3.5 text-[15px] outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue transition-colors" />
                    <input placeholder="County" value={county} onChange={e => setCounty(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3.5 text-[15px] outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue transition-colors" />
                    <input placeholder="Postcode" value={postcode} onChange={e => setPostcode(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-2.5 px-3.5 text-[15px] outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue transition-colors" />
                  </div>
                  <button onClick={handleAddAddress} disabled={saving} className="w-full bg-action-blue text-on-primary py-2.5 rounded-md text-label-bold font-semibold mt-2 hover:bg-action-blue/95 active:scale-[0.98] transition-all">
                    Save Address
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {profile?.addresses?.map((addr: any) => (
                  <div key={addr.id} className="ref-card p-5 flex justify-between items-center hover:border-action-blue transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-md bg-action-blue/10 flex items-center justify-center text-action-blue">
                        <MapPin size={22} />
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface text-base">{addr.street}</p>
                        <p className="text-xs text-on-surface-variant font-medium">{addr.city}{addr.state ? `, ${addr.state}` : ''} | <span className="text-action-blue font-bold">{addr.postcode}</span></p>
                      </div>
                    </div>
                    <button onClick={() => setAddressToDelete(addr)} className="p-2 text-error/40 hover:text-error hover:bg-error/5 rounded-md transition-colors">
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
                <div className="bg-surface-container-low rounded-lg p-8 border border-dashed border-outline-variant text-center">
                  <div className="w-12 h-12 rounded-md bg-on-surface-variant/5 flex items-center justify-center text-on-surface-variant/30 mx-auto mb-4">
                    <CreditCard size={24} />
                  </div>
                  <p className="text-on-surface-variant text-sm font-medium mb-4">You don't have any saved payment methods.</p>
                  <button 
                    onClick={() => setShowAddCard(true)}
                    className="bg-white border border-action-blue text-action-blue px-6 py-2 rounded-md text-label-bold font-semibold hover:bg-action-blue/5 transition-colors"
                  >
                    Add New Card
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {savedCards.map(card => (
                    <div key={card.id} className="ref-card p-5 flex justify-between items-center hover:border-action-blue transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-on-surface-variant/5 flex items-center justify-center text-on-surface-variant">
                          <CreditCard size={22} />
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface text-base">{card.brand} •••• {card.number}</p>
                          <p className="text-xs text-on-surface-variant font-medium">Expires {card.expiry}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSavedCards(savedCards.filter(c => c.id !== card.id))}
                        className="p-2 text-error/40 hover:text-error hover:bg-error/5 rounded-md transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowAddCard(true)}
                    className="w-full py-3 border border-dashed border-outline-variant rounded-md text-on-surface-variant text-label-bold font-semibold hover:border-action-blue hover:text-action-blue transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Another Card
                  </button>
                </div>
              )}
            </section>
          </motion.div>
        );

      case 'rewards':
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="bg-primary text-on-primary p-6 rounded-xl">
              <Star className="mb-3" size={24} fill="currentColor" />
              <h3 className="text-xl font-bold mb-1">Loyalty Rewards</h3>
              <p className="opacity-80 text-sm font-medium">Monthly spend: £{rewardsProgress?.total_spend || '0'}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {rewardsProgress?.events?.map((ev: any) => (
                <div key={ev.id} className="p-4 bg-white ref-card flex items-center gap-4">
                  <div className="bg-price-green/10 text-price-green p-3 rounded-lg"><Gift size={22} /></div>
                  <div>
                    <div className="font-semibold text-base">{ev.tier?.name || 'Reward Unlocked'}</div>
                    <div className="text-xs text-on-surface-variant font-medium">Redeemable at checkout</div>
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

  if (loading) {
    return (
      <Layout title="Account" showBack>
        <div className="flex items-center justify-center min-h-[60vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: <User size={20} /> },
    { id: 'addresses', label: 'Addresses & Payments', icon: <MapPin size={20} /> },
    { id: 'rewards', label: 'My Rewards', icon: <Star size={20} /> },
  ];

  return (
    <Layout title="Account" showBack>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-32">
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Vertical Sidebar */}
            <aside className="lg:w-72 shrink-0">
              <div className="bg-white ref-card-xl p-5 sticky top-24">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
                  <div className="w-12 h-12 rounded-full bg-action-blue flex items-center justify-center text-on-primary text-lg font-bold">
                    {(firstName?.[0] || '').toUpperCase()}{(lastName?.[0] || '').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">{firstName} {lastName}</p>
                    <p className="text-xs text-on-surface-variant font-medium truncate opacity-60">Verified Member</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center justify-between p-3 rounded-md text-label-bold font-semibold transition-all group ${
                        activeTab === tab.id 
                          ? 'bg-action-blue text-on-primary' 
                          : 'text-on-surface-variant hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {tab.icon}
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight size={14} className={`${activeTab === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 transition-opacity'}`} />
                    </button>
                  ))}
                </nav>

                <div className="mt-6 pt-4 border-t border-outline-variant space-y-1">
                  <button onClick={handleExportData} className="w-full flex items-center gap-3 p-3 rounded-md text-label-bold font-semibold text-action-blue hover:bg-action-blue/5 transition-colors">
                    <Download size={18} />
                    <span>Export Data</span>
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/browse');
                    }} 
                    className="w-full flex items-center gap-3 p-3 rounded-md text-label-bold font-semibold text-error hover:bg-error/5 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1">
              <div className="bg-white ref-card-xl p-6 md:p-10 min-h-[500px]">
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
          <div className="flex gap-3 w-full justify-end">
            <button onClick={() => setAddressToDelete(null)} className="px-5 py-2 rounded-md font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors">Cancel</button>
            <button onClick={confirmDeleteAddress} className="px-5 py-2 bg-error text-on-error rounded-md text-label-bold font-semibold hover:bg-error/95 transition-all">Delete</button>
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
          <div className="flex gap-3 w-full justify-end">
            <button onClick={() => setShowForgetConfirm(false)} className="px-5 py-2 rounded-md font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors">Cancel</button>
            <button onClick={handleForgetMe} className="px-5 py-2 bg-error text-on-error rounded-md text-label-bold font-semibold hover:bg-error/95 transition-all">Confirm</button>
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
              className="px-5 py-2 font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-md transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddCard} 
              disabled={saving} 
              className="px-6 py-2 bg-action-blue text-on-primary rounded-md text-label-bold font-semibold transition-all hover:bg-action-blue/95 disabled:opacity-50"
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
                className="w-full bg-surface-container-low border border-outline-variant rounded-md px-4 py-2.5 focus:border-action-blue focus:ring-1 focus:ring-action-blue outline-none transition-colors font-mono"
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
                className="w-full bg-surface-container-low border border-outline-variant rounded-md px-4 py-2.5 focus:border-action-blue focus:ring-1 focus:ring-action-blue outline-none transition-colors font-mono"
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
                className="w-full bg-surface-container-low border border-outline-variant rounded-md px-4 py-2.5 focus:border-action-blue focus:ring-1 focus:ring-action-blue outline-none transition-colors font-mono"
                required 
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-action-blue/5 rounded-lg border border-action-blue/10">
            <ShieldCheck size={20} className="text-action-blue" />
            <p className="text-[10px] font-medium text-action-blue leading-tight">Your card information is encrypted and securely stored using industry-standard protocols.</p>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
