import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { ensureUserProfile, updateUserProfile, addAddress, deleteAddress, setDefaultAddress } from '../../services';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoURL, setPhotoURL] = useState('');
  
  // Address management
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    address: '',
    district: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
  });

  // Password management
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Account settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    promotions: true,
    smsNotifications: false,
  });
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
  });

  // Load user data from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Loading user data for:', user.uid);
        const userData = await ensureUserProfile(user.uid, profile?.email || user.email, profile?.displayName);
        console.log('User data loaded:', userData);
        
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          birthDate: userData.birthDate || '',
        });
        
        // โหลดรูปโปรไฟล์
        setPhotoURL(userData.photoURL || profile?.photoURL || user.photoURL || '');
        
        // โหลดที่อยู่
        setAddresses(userData.addresses || []);
        
        // โหลดการตั้งค่า
        setSettings({
          emailNotifications: userData.settings?.emailNotifications ?? true,
          promotions: userData.settings?.promotions ?? true,
          smsNotifications: userData.settings?.smsNotifications ?? false,
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        // ถ้าไม่มีข้อมูล ให้ใช้ค่าว่าง
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          birthDate: '',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user?.uid]);

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Upload profile photo
  const handleUploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      return;
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploadingPhoto(true);
    try {
      // อัพโหลดไป Firebase Storage
      const storageReference = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageReference, file);
      
      // ดึง URL ของรูปที่อัพโหลด
      const downloadURL = await getDownloadURL(storageReference);
      
      // อัพเดท Firebase Auth
      await updateProfile(user, { photoURL: downloadURL });
      
      // อัพเดท Firestore
      await updateUserProfile(user.uid, { photoURL: downloadURL });
      
      // อัพเดท state
      setPhotoURL(downloadURL);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save profile data
  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        birthDate: formData.birthDate,
      });
      
      setEditingPersonal(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Address functions
  const handleAddressInputChange = (field, value) => {
    setAddressForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({
      name: '',
      address: '',
      district: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    if (!user?.uid) return;
    
    // Validate
    if (!addressForm.name || !addressForm.address) {
      return;
    }

    setSaving(true);
    try {
      const newAddress = await addAddress(user.uid, addressForm);
      setAddresses(prev => [...prev, newAddress]);
      setShowAddressModal(false);
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!user?.uid) return;
    if (!window.confirm('คุณต้องการลบที่อยู่นี้หรือไม่?')) return;

    try {
      await deleteAddress(user.uid, addressId);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    if (!user?.uid) return;

    try {
      await setDefaultAddress(user.uid, addressId);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      })));
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  // Password functions
  const handlePasswordInputChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = async () => {
    if (!user) return;

    // Validate
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      return;
    }

    setChangingPassword(true);
    try {
      // ยืนยันตัวตนด้วยรหัสผ่านปัจจุบัน
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // เปลี่ยนรหัสผ่าน
      await updatePassword(user, passwordForm.newPassword);

      // ล้างฟอร์ม
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setChangingPassword(false);
    }
  };

  // Settings functions
  const handleSettingChange = async (settingKey, value) => {
    if (!user?.uid) return;

    const newSettings = {
      ...settings,
      [settingKey]: value,
    };

    setSettings(newSettings);

    try {
      await updateUserProfile(user.uid, {
        settings: newSettings,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert on error
      setSettings(settings);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px 24px', background: '#f3f4f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ fontSize: '1.2rem', color: '#64748B' }}>กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', background: '#f3f4f6', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Left: Profile Card */}
        <div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center', position: 'sticky', top: 20 }}>
            <div style={{ width: 120, height: 120, background: photoURL ? 'transparent' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', overflow: 'hidden', position: 'relative' }}>
              {photoURL ? (
                <img src={photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '👤'
              )}
              {uploadingPhoto && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem' }}>
                  ⏳
                </div>
              )}
            </div>
            <h2 style={{ fontFamily: "'Kanit', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
              {profile?.displayName || 'Staff'}
            </h2>
            <p style={{ color: '#475569', marginBottom: '0.3rem' }}>{profile?.email || 'staff@company.com'}</p>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '2rem' }}>ID: STAFF-001</p>
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleUploadPhoto}
              disabled={uploadingPhoto}
              style={{ display: 'none' }} 
              id="avatar-upload"
            />
            <label 
              htmlFor="avatar-upload"
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                background: uploadingPhoto ? '#9ca3af' : '#F1F5F9', 
                border: '2px dashed #E2E8F0', 
                borderRadius: 10, 
                color: uploadingPhoto ? '#fff' : '#475569', 
                fontWeight: 600, 
                cursor: uploadingPhoto ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s',
                display: 'block'
              }}
            >
              {uploadingPhoto ? '⏳ กำลังอัพโหลด...' : '📸 เปลี่ยนรูปโปรไฟล์'}
            </label>
          </div>
        </div>

        {/* Right: Profile Details */}
        <div>
          {/* Personal Information */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
            <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 ข้อมูลส่วนตัว</span>
              <button 
                onClick={() => setEditingPersonal(!editingPersonal)}
                style={{ padding: '0.5rem 1rem', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {editingPersonal ? '❌ ยกเลิก' : '✏️ แก้ไข'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>ชื่อ</label>
                <input 
                  type="text" 
                  disabled={!editingPersonal} 
                  value={formData.firstName} 
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  style={{ padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem', background: editingPersonal ? '#fff' : '#F1F5F9', color: editingPersonal ? '#0F172A' : '#94A3B8' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>นามสกุล</label>
                <input 
                  type="text" 
                  disabled={!editingPersonal} 
                  value={formData.lastName} 
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  style={{ padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem', background: editingPersonal ? '#fff' : '#F1F5F9', color: editingPersonal ? '#0F172A' : '#94A3B8' }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>เบอร์โทรศัพท์</label>
                <input 
                  type="tel" 
                  disabled={!editingPersonal} 
                  value={formData.phone} 
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{ padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem', background: editingPersonal ? '#fff' : '#F1F5F9', color: editingPersonal ? '#0F172A' : '#94A3B8' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>วันเกิด</label>
                <input 
                  type="date" 
                  disabled={!editingPersonal} 
                  value={formData.birthDate} 
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  style={{ padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem', background: editingPersonal ? '#fff' : '#F1F5F9', color: editingPersonal ? '#0F172A' : '#94A3B8' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>อีเมล</label>
              <input type="email" disabled defaultValue={profile?.email || 'staff@company.com'} style={{ padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem', background: '#F1F5F9', color: '#94A3B8' }} />
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={saving || !editingPersonal}
              style={{ 
                width: '100%', 
                padding: '1rem', 
                background: (saving || !editingPersonal) ? '#9ca3af' : 'linear-gradient(135deg, #2563EB, #1D4ED8)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 12, 
                fontFamily: "'Kanit', sans-serif", 
                fontWeight: 700, 
                fontSize: '1.1rem', 
                cursor: (saving || !editingPersonal) ? 'not-allowed' : 'pointer', 
                boxShadow: (saving || !editingPersonal) ? 'none' : '0 4px 16px rgba(37,99,235,0.3)' 
              }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>

          {/* Shipping Addresses */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
            <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #E2E8F0' }}>
              <span>📍 ที่อยู่จัดส่ง</span>
            </div>

            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                ยังไม่มีที่อยู่ กดปุ่มด้านล่างเพื่อเพิ่มที่อยู่
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {addresses.map((addr) => (
                  <div 
                    key={addr.id} 
                    style={{ 
                      padding: '1.5rem', 
                      border: addr.isDefault ? '2px solid #10B981' : '2px solid #E2E8F0', 
                      borderRadius: 12, 
                      background: addr.isDefault ? 'rgba(16,185,129,0.03)' : '#fff',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    {addr.isDefault && (
                      <span style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.3rem 0.8rem', background: '#10B981', color: '#fff', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6 }}>
                        ค่าเริ่มต้น
                      </span>
                    )}
                    <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{addr.name}</div>
                    <div style={{ color: '#475569', lineHeight: 1.8, marginBottom: '1rem' }}>
                      {addr.address}<br />
                      {addr.district && `${addr.district} `}
                      {addr.city && `${addr.city}`}<br />
                      {addr.province && `${addr.province} `}
                      {addr.postalCode && addr.postalCode}<br />
                      {addr.phone && `โทร: ${addr.phone}`}
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                      {!addr.isDefault && (
                        <button 
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          style={{ padding: '0.5rem 1rem', border: '2px solid #E2E8F0', background: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          ตั้งเป็นค่าเริ่มต้น
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        style={{ padding: '0.5rem 1rem', border: '2px solid #E2E8F0', background: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={openAddAddressModal}
              style={{ width: '100%', padding: '1rem', background: '#F1F5F9', border: '2px dashed #E2E8F0', borderRadius: 12, color: '#475569', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}
            >
              ➕ เพิ่มที่อยู่ใหม่
            </button>
          </div>

          {/* Change Password */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
            <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #E2E8F0' }}>
              <span>🔒 เปลี่ยนรหัสผ่าน</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>รหัสผ่านปัจจุบัน</label>
              <input 
                type="password" 
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                placeholder="กรอกรหัสผ่านปัจจุบัน" 
                style={{ padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>รหัสผ่านใหม่</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" 
                  style={{ padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>ยืนยันรหัสผ่านใหม่</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" 
                  style={{ padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }} 
                />
              </div>
            </div>

            <button 
              onClick={handleChangePassword}
              disabled={changingPassword}
              style={{ 
                width: '100%', 
                padding: '1rem', 
                background: changingPassword ? '#9ca3af' : 'linear-gradient(135deg, #2563EB, #1D4ED8)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 12, 
                fontFamily: "'Kanit', sans-serif", 
                fontWeight: 700, 
                fontSize: '1.1rem', 
                cursor: changingPassword ? 'not-allowed' : 'pointer', 
                boxShadow: changingPassword ? 'none' : '0 4px 16px rgba(37,99,235,0.3)' 
              }}
            >
              {changingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </div>

          {/* Account Settings */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #E2E8F0' }}>
              <span>⚙️ การตั้งค่าบัญชี</span>
            </div>

            <button 
              onClick={() => setShowDeleteAccountModal(true)}
              style={{ width: '100%', padding: '1rem', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 12, fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}
            >
              ลบบัญชีผู้ใช้
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#2D3748', borderRadius: 16, padding: '2rem', maxWidth: 500, width: '90%', color: '#fff' }}>
            <h2 style={{ fontFamily: "'Kanit', sans-serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
              localhost:3000 บอกว่า
            </h2>
            <p style={{ fontSize: '1rem', marginBottom: '2rem', color: '#E2E8F0', lineHeight: 1.6 }}>
              คุณต้องการลบบัญชีผู้ใช้ไหม? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDeleteAccountModal(false)}
                style={{ 
                  padding: '0.75rem 2rem', 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '2px solid rgba(255,255,255,0.3)', 
                  borderRadius: 999, 
                  color: '#FFC0CB', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                ตกลง
              </button>
              <button 
                onClick={() => setShowDeleteAccountModal(false)}
                style={{ 
                  padding: '0.75rem 2rem', 
                  background: '#8B5A8E', 
                  border: 'none', 
                  borderRadius: 999, 
                  color: '#fff', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontFamily: "'Kanit', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem' }}>
              ➕ เพิ่มที่อยู่ใหม่
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>ชื่อที่อยู่ *</label>
                <input 
                  type="text" 
                  value={addressForm.name}
                  onChange={(e) => handleAddressInputChange('name', e.target.value)}
                  placeholder="เช่น บ้าน, ที่ทำงาน"
                  style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>ที่อยู่ *</label>
                <textarea 
                  value={addressForm.address}
                  onChange={(e) => handleAddressInputChange('address', e.target.value)}
                  placeholder="เลขที่, ถนน, หมู่บ้าน"
                  rows={3}
                  style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>แขวง/ตำบล</label>
                  <input 
                    type="text" 
                    value={addressForm.district}
                    onChange={(e) => handleAddressInputChange('district', e.target.value)}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>เขต/อำเภอ</label>
                  <input 
                    type="text" 
                    value={addressForm.city}
                    onChange={(e) => handleAddressInputChange('city', e.target.value)}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>จังหวัด</label>
                  <input 
                    type="text" 
                    value={addressForm.province}
                    onChange={(e) => handleAddressInputChange('province', e.target.value)}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>รหัสไปรษณีย์</label>
                  <input 
                    type="text" 
                    value={addressForm.postalCode}
                    onChange={(e) => handleAddressInputChange('postalCode', e.target.value)}
                    maxLength={5}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>เบอร์โทรศัพท์</label>
                <input 
                  type="tel" 
                  value={addressForm.phone}
                  onChange={(e) => handleAddressInputChange('phone', e.target.value)}
                  placeholder="098-765-4321"
                  style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #E2E8F0', borderRadius: 8, fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setShowAddressModal(false)}
                disabled={saving}
                style={{ flex: 1, padding: '1rem', background: '#fff', border: '2px solid #E2E8F0', borderRadius: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', color: '#475569' }}
              >
                ❌ ยกเลิก
              </button>
              <button 
                onClick={handleSaveAddress}
                disabled={saving}
                style={{ flex: 1, padding: '1rem', background: saving ? '#9ca3af' : 'linear-gradient(135deg, #2563EB, #1D4ED8)', border: 'none', borderRadius: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', color: '#fff', boxShadow: saving ? 'none' : '0 4px 16px rgba(37,99,235,0.3)' }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
