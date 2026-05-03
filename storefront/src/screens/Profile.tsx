import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import InnovativeLoader from '../components/InnovativeLoader';
import Modal from '../components/Modal';
import { User, Phone, MapPin, Plus, Trash2, Loader2, Save, Star, Award, Gift, AlertCircle, Wallet, ShieldCheck, Download, UserMinus, Copy, Check, Users } from 'lucide-react';
import { customerAuthApi, rewardsApi, walletApi, gdprApi, referralApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rewardsProgress, setRewardsProgress] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [addressToDelete, setAddressToDelete] = useState<any>(null);
  const [showForgetConfirm, setShowForgetConfirm] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [appliedReferral, setAppliedReferral] = useState<string>('');
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await customerAuthApi.getProfile();
        setProfile(profileRes.data);
        setName(profileRes.data.full_name || '');
        setPhone(profileRes.data.phone || '');

        const [rewardsRes, walletRes, referralRes] = await Promise.all([
          rewardsApi.myProgress().catch(() => ({ data: { total_spend: 0, events: [] } })),
          walletApi.getBalance().catch(() => ({ data: { balance: 0 } })),
          referralApi.getMyCode().catch(() => ({ data: { referral_code: '' } }))
        ]);

        setRewardsProgress(rewardsRes.data);
        setWalletBalance(Number(walletRes.data.balance) || 0);
        setReferralCode(referralRes.data.referral_code);
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
      const res = await customerAuthApi.updateProfile({ name, phone });
      setProfile(res.data);
      if (setUser) setUser({ ...user, name });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!appliedReferral) return;
    setIsApplyingReferral(true);
    try {
      await referralApi.applyCode(appliedReferral);
      toast.success('Referral code applied! Your bonus will appear after your first order.');
      setAppliedReferral('');
      const res = await customerAuthApi.getProfile();
      setProfile(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsApplyingReferral(false);
    }
  };

  const copyToClipboard = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopySuccess(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await customerAuthApi.addAddress({
        line1: addressLine1,
        city,
        postcode,
        is_default: profile.addresses?.length === 0
      });
      const res = await customerAuthApi.getProfile();
      setProfile(res.data);
      setShowAddAddress(false);
      setAddressLine1('');
      setCity('');
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
      window.location.href = '/shop';
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="flex items-center justify-center min-h-[80vh]">
          <InnovativeLoader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Profile" showBack>
      <div className="max-w-4xl mx-auto px-6 py-10 pb-32 space-y-12">
        <section className="bg-surface-container-low rounded-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Account Details</h2>
              <p className="text-on-surface-variant font-medium">Manage your conservatory membership</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Phone Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20"
                placeholder="+44..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {rewardsProgress && (
          <section className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star size={120} />
            </div>
            <div className="relative z-10 flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Star size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Your Rewards</h3>
                <p className="text-on-surface-variant font-medium">Monthly spend: <strong className="text-primary text-xl">£{rewardsProgress.total_spend}</strong></p>
              </div>
            </div>
            
            {rewardsProgress.events?.length > 0 && (
              <div className="mt-8 border-t border-outline-variant pt-6">
                <h4 className="font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-4">Earned Coupons</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rewardsProgress.events.map((ev: any) => (
                    <div key={ev.id} className="bg-surface p-4 rounded-xl border border-outline flex items-center gap-4 shadow-sm">
                      <div className="bg-success/10 text-success p-3 rounded-full">
                        <Gift size={20} />
                      </div>
                      <div>
                        {ev.tier?.name ? (
                          <div className="font-bold">{ev.tier.name} Unlocked!</div>
                        ) : (
                          <div className="font-bold">Reward Unlocked!</div>
                        )}
                        <div className="text-xs text-on-surface-variant mt-1">Check checkout for coupons</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Referral System */}
        <section className="bg-surface-container-low rounded-lg p-8 border border-outline-variant/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Refer & Earn</h3>
              <p className="text-on-surface-variant font-medium">Share the love and get wallet credits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Share Code */}
            <div className="space-y-4 p-6 bg-surface-container rounded-2xl border border-outline-variant/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                 <Users size={80} />
              </div>
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Your Referral Code</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface rounded-xl px-4 py-3 font-mono font-bold text-lg text-primary border border-outline-variant">
                    {referralCode || '-------'}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`p-3 rounded-xl transition-all ${copySuccess ? 'bg-success text-white' : 'bg-primary text-white hover:bg-primary-container'}`}
                  >
                    {copySuccess ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-3 font-medium">
                  Share this code with friends. They get a discount on their first order, and you get <strong className="text-on-surface">£5.00</strong> in your wallet!
                </p>
              </div>
            </div>

            {/* Apply Code */}
            {!profile?.referred_by && (
              <div className="space-y-4 p-6 bg-surface-container rounded-2xl border border-outline-variant/50">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Have a code?</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={appliedReferral}
                    onChange={e => setAppliedReferral(e.target.value.toUpperCase())}
                    placeholder="ENTER-CODE"
                    className="flex-1 bg-surface rounded-xl px-4 py-3 font-mono font-bold border border-outline-variant focus:ring-2 focus:ring-primary/20"
                  />
                  <button 
                    onClick={handleApplyReferral}
                    disabled={isApplyingReferral || !appliedReferral}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isApplyingReferral ? <Loader2 className="animate-spin" size={18} /> : 'Apply'}
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-3 font-medium">
                  If a friend invited you, enter their code here to claim your welcome bonus.
                </p>
              </div>
            )}
            {profile?.referred_by && (
              <div className="p-6 bg-success/5 rounded-2xl border border-success/20 flex items-center gap-4 text-success">
                <Check className="shrink-0" size={24} />
                <p className="text-sm font-bold">Referral code applied! Enjoy your member benefits.</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold tracking-tight">Delivery Addresses</h3>
            {!showAddAddress && (
              <button 
                onClick={() => setShowAddAddress(true)}
                className="text-primary font-bold flex items-center gap-1 hover:underline text-sm"
              >
                <Plus size={16} /> Add New
              </button>
            )}
          </div>

          {showAddAddress && (
            <div className="bg-surface-container-highest p-8 rounded-lg mb-8">
              <h4 className="font-bold mb-6">New Address</h4>
              <form onSubmit={handleAddAddress} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <input placeholder="Address Line 1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="bg-surface border-none rounded px-4 py-3" required />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="bg-surface border-none rounded px-4 py-3" required />
                    <input placeholder="Postcode" value={postcode} onChange={e => setPostcode(e.target.value)} className="bg-surface border-none rounded px-4 py-3" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddAddress(false)} className="px-6 py-2 font-bold text-on-surface-variant">Cancel</button>
                  <button type="submit" disabled={saving} className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold">
                    {saving ? 'Adding...' : 'Add Address'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.addresses?.map((addr: any) => (
              <div key={addr.id} className={`border rounded-xl p-6 flex justify-between items-start transition-all shadow-sm hover:shadow-md ${addr.is_default ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50'}`}>
                <div className="flex gap-4">
                  <div className={`mt-1 ${addr.is_default ? 'text-primary' : 'text-secondary'}`}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{addr.line1}</p>
                    <p className="text-sm text-on-surface-variant font-medium">{addr.city}, {addr.postcode}</p>
                    <div className="flex items-center gap-3 mt-4">
                      {addr.is_default ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary text-on-primary px-3 py-1 rounded-full shadow-sm">
                          <Star size={10} fill="currentColor" />
                          Default
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 px-3 py-1 rounded-full border border-primary/20 transition-colors"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setAddressToDelete(addr)}
                  className="text-error/60 hover:text-error hover:bg-error/5 p-2 rounded-full transition-all active:scale-90"
                  title="Remove Address"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            {profile.addresses?.length === 0 && !showAddAddress && (
              <div className="md:col-span-2 text-center py-12 bg-surface-container-low rounded-xl text-secondary">
                <p>No addresses added yet.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-surface-container-low rounded-lg p-8 border border-outline-variant">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center text-info">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Your Wallet</h3>
              <p className="text-on-surface-variant font-medium">Digital balance for fast checkouts</p>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-outline flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Available Balance</div>
              <div className="text-4xl font-black text-primary">£{walletBalance.toFixed(2)}</div>
            </div>
            <button 
              onClick={() => toast.info('Wallet top-up via card is coming soon. Currently, wallet credits are issued for refunds and referrals.')}
              className="bg-on-surface text-surface px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              Top Up
            </button>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-lg p-8 border border-outline-variant">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Privacy & Security</h3>
              <p className="text-on-surface-variant font-medium">Manage your personal data and account</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleExportData}
              className="flex items-center gap-4 p-4 rounded-xl border border-outline hover:bg-surface-container-high transition-colors text-left"
            >
              <div className="bg-info/10 text-info p-3 rounded-lg"><Download size={20} /></div>
              <div>
                <div className="font-bold">Download My Data</div>
                <div className="text-xs text-on-surface-variant">Get a copy of your personal records</div>
              </div>
            </button>
            <button 
              onClick={() => setShowForgetConfirm(true)}
              className="flex items-center gap-4 p-4 rounded-xl border border-outline hover:bg-error/5 transition-colors text-left"
            >
              <div className="bg-error/10 text-error p-3 rounded-lg"><UserMinus size={20} /></div>
              <div>
                <div className="font-bold text-error">Delete Account</div>
                <div className="text-xs text-on-surface-variant">Irreversibly anonymize your profile</div>
              </div>
            </button>
          </div>
        </section>
      </div>

      <Modal
        isOpen={!!addressToDelete}
        onClose={() => setAddressToDelete(null)}
        title="Delete Address"
        footer={
          <>
            <button onClick={() => setAddressToDelete(null)} className="px-6 py-3 font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors">Cancel</button>
            <button onClick={confirmDeleteAddress} disabled={saving} className="bg-error text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
              Delete Address
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-error/10 text-error rounded-full"><AlertCircle size={40} /></div>
          <p className="text-on-surface-variant leading-relaxed">
            Are you sure you want to remove <strong className="text-on-surface font-bold">"{addressToDelete?.line1}"</strong>? This action cannot be undone.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={showForgetConfirm}
        onClose={() => setShowForgetConfirm(false)}
        title="Delete Your Account?"
        footer={
          <>
            <button onClick={() => setShowForgetConfirm(false)} className="px-6 py-3 font-bold text-on-surface-variant">Cancel</button>
            <button onClick={handleForgetMe} className="bg-error text-white px-8 py-3 rounded-xl font-bold">Delete Everything</button>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <div className="p-4 bg-error/10 text-error rounded-full inline-block"><AlertCircle size={40} /></div>
          <p className="text-on-surface-variant leading-relaxed">
            This action is <strong className="text-on-surface">PERMANENT</strong>. We will anonymize your profile. You will lose access to your rewards, order history, and wallet balance.
          </p>
        </div>
      </Modal>
    </Layout>
  );
}
