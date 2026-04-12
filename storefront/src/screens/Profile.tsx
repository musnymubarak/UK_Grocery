import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { User, Phone, MapPin, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { customerAuthApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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

  const handleRemoveAddress = async (id: string) => {
    if (!confirm('Remove this address?')) return;
    try {
      await customerAuthApi.removeAddress(id);
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
              <div key={addr.id} className="border border-outline-variant rounded-xl p-6 flex justify-between items-start hover:border-primary transition-colors group">
                <div className="flex gap-4">
                  <div className="mt-1 text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{addr.line1}</p>
                    <p className="text-sm text-on-surface-variant">{addr.city}, {addr.postcode}</p>
                    {addr.is_default && (
                      <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveAddress(addr.id)}
                  className="text-error opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-error/10 rounded-full"
                >
                  <Trash2 size={18} />
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
      </div>
    </Layout>
  );
}
