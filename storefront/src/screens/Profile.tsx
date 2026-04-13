import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { User, Phone, MapPin, Plus, Trash2, Loader2, Save, Star, Award, Gift, AlertCircle } from 'lucide-react';
import { customerAuthApi, rewardsApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rewardsProgress, setRewardsProgress] = useState<any>(null);
  const [addressToDelete, setAddressToDelete] = useState<any>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');

  useEffect(() => {
    customerAuthApi.getProfile()
      .then(res => {
        setProfile(res.data);
        setName(res.data.full_name || '');
        setPhone(res.data.phone || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));

    rewardsApi.myProgress()
      .then(res => setRewardsProgress(res.data))
      .catch(err => {
        console.error("Rewards API error:", err);
        setRewardsProgress({ total_spend: 0, events: [] });
      });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await customerAuthApi.updateProfile({ name, phone });
      setProfile(res.data);
      // Update context if needed
      if (setUser) setUser({ ...user, name });
      alert('Profile updated successfully');
    } catch (err) {
      alert(getErrorMessage(err));
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
        city,
        postcode,
        is_default: profile.addresses?.length === 0
      });
      // Refresh
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

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={40} />
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
          <section className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-8 mb-12 relative overflow-hidden">
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

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!addressToDelete}
          onClose={() => setAddressToDelete(null)}
          title="Delete Address"
          footer={
            <>
              <button 
                onClick={() => setAddressToDelete(null)}
                className="px-6 py-3 font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteAddress}
                disabled={saving}
                className="bg-error text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-error/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                Delete Address
              </button>
            </>
          }
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-error/10 text-error rounded-full">
              <AlertCircle size={40} />
            </div>
            <div>
              <p className="text-on-surface-variant leading-relaxed">
                Are you sure you want to remove <strong className="text-on-surface font-bold">"{addressToDelete?.line1}"</strong>? 
                This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
