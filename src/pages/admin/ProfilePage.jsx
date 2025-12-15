import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { ensureUserProfile, updateUserProfile, addAddress, deleteAddress, setDefaultAddress } from '../../services';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Link } from 'react-router-dom';
import styles from './ProfilePage.module.css';

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
  const [, setEditingAddress] = useState(null);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line no-unused-vars
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
      <div className={styles.loadingPage}>
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>⏳</div>
          <div style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center' }}>{t('common.loading') || 'กำลังโหลดข้อมูล...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.breadcrumbs}>
          <Link className={styles.breadcrumbLink} to="/admin/dashboard">{t('common.dashboard') || 'Dashboard'}</Link>
          <span className={`material-symbols-outlined ${styles.breadcrumbSeparator}`}>chevron_right</span>
          <Link className={styles.breadcrumbLink} to="/admin/profile">{t('common.settings') || 'Settings'}</Link>
          <span className={`material-symbols-outlined ${styles.breadcrumbSeparator}`}>chevron_right</span>
          <span className={styles.breadcrumbCurrent}>{t('common.profile') || 'Profile'}</span>
        </div>

        <div className={styles.heading}>
          <h1 className={styles.title}>{t('common.profile') || 'My Profile'} / โปรไฟล์ของฉัน</h1>
          <p className={styles.subtitle}>{t('common.manage_profile') || 'Manage your personal information and system preferences.'}</p>
        </div>

        {/* Left: Profile Card */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>
                  {photoURL ? (
                    <img className={styles.avatarImg} src={photoURL} alt="Profile" />
                  ) : (
                    <span className={styles.avatarPlaceholder}>👤</span>
                  )}
                  {uploadingPhoto && (
                    <div className={styles.avatarOverlay}>⏳</div>
                  )}
                </div>
                <label htmlFor="avatar-upload" className={styles.avatarCameraButton} title={t('common.change_photo') || 'Change Photo'}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>photo_camera</span>
                </label>
              </div>

              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>{profile?.displayName || 'Admin'}</h2>
                <p className={styles.profileRole}>{profile?.email || user?.email || '-'}</p>

                <div className={styles.buttonRow}>
                  <label
                    htmlFor="avatar-upload"
                    className={`${styles.button} ${styles.buttonSecondary} ${uploadingPhoto ? styles.buttonDisabled : ''}`}
                  >
                    {uploadingPhoto ? (t('message.uploading') || 'Uploading...') : (t('common.change_photo') || 'Change Photo')}
                  </label>
                </div>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleUploadPhoto}
              disabled={uploadingPhoto}
              style={{ display: 'none' }}
              id="avatar-upload"
            />
          </div>
        </div>

        {/* Right: Profile Details */}
        <div>
          {/* Personal Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Personal Information</h3>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setEditingPersonal(!editingPersonal)}
              >
                {editingPersonal ? (t('common.cancel') || 'Cancel') : (t('common.edit') || 'Edit')}
              </button>
            </div>

            <div className={styles.cardBody}>
              <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="firstName">
                      First Name <span className={styles.labelHint}>/ ชื่อจริง</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <input
                        id="firstName"
                        type="text"
                        className={`${styles.input} ${!editingPersonal ? styles.inputDisabled : ''}`}
                        disabled={!editingPersonal}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="lastName">
                      Last Name <span className={styles.labelHint}>/ นามสกุล</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <input
                        id="lastName"
                        type="text"
                        className={`${styles.input} ${!editingPersonal ? styles.inputDisabled : ''}`}
                        disabled={!editingPersonal}
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="phone">
                      Phone Number <span className={styles.labelHint}>/ เบอร์โทรศัพท์</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <span className={`material-symbols-outlined ${styles.iconLeft}`}>call</span>
                      <input
                        id="phone"
                        type="tel"
                        className={`${styles.input} ${styles.inputWithIconLeft} ${!editingPersonal ? styles.inputDisabled : ''}`}
                        disabled={!editingPersonal}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="birthDate">
                      Birth Date <span className={styles.labelHint}>/ วันเกิด</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <input
                        id="birthDate"
                        type="date"
                        className={`${styles.input} ${!editingPersonal ? styles.inputDisabled : ''}`}
                        disabled={!editingPersonal}
                        value={formData.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label} htmlFor="email">
                      Email Address <span className={styles.labelHint}>/ อีเมล</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <span className={`material-symbols-outlined ${styles.iconLeft}`}>mail</span>
                      <input
                        id="email"
                        type="email"
                        className={`${styles.input} ${styles.inputWithIconLeft} ${styles.inputWithIconRight} ${styles.inputDisabled}`}
                        disabled
                        value={profile?.email || user?.email || ''}
                        readOnly
                      />
                      <span className={`material-symbols-outlined ${styles.iconRight}`}>lock</span>
                    </div>
                  </div>
                </div>

                <div className={styles.actionBar}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonSecondary} ${styles.actionButton}`}
                    onClick={() => setEditingPersonal(false)}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonPrimary} ${styles.actionButton} ${(saving || !editingPersonal) ? styles.buttonDisabled : ''}`}
                    onClick={handleSaveProfile}
                    disabled={saving || !editingPersonal}
                  >
                    {saving ? (t('message.saving') || 'Saving...') : (t('common.save_changes') || 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Shipping Addresses */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Shipping Addresses</h3>
              <span className={styles.cardMeta}>{t('common.address') || 'Address'}</span>
            </div>

            <div className={styles.cardBody}>

            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8' }}>
                {t('common.no_data') || 'ยังไม่มีที่อยู่ กดปุ่มด้านล่างเพื่อเพิ่มที่อยู่'}
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
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              ➕ เพิ่มที่อยู่ใหม่
            </button>
          </div>

          </div>

          {/* Change Password */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Change Password</h3>
              <span className={styles.cardMeta}>{t('common.security') || 'Security'}</span>
            </div>

            <div className={styles.cardBody}>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="currentPassword">รหัสผ่านปัจจุบัน</label>
                <input
                  id="currentPassword"
                  type="password"
                  className={styles.input}
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                />
              </div>

              <div className={styles.formGrid} style={{ marginTop: '1rem' }}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="newPassword">รหัสผ่านใหม่</label>
                  <input
                    id="newPassword"
                    type="password"
                    className={styles.input}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="confirmNewPassword">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    className={styles.input}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  />
                </div>
              </div>

            <button 
              onClick={handleChangePassword}
              disabled={changingPassword}
              type="button"
              className={`${styles.button} ${styles.buttonPrimary} ${changingPassword ? styles.buttonDisabled : ''}`}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {changingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
            </div>
          </div>

          {/* Account Settings */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Account Settings</h3>
              <span className={styles.cardMeta}>{t('common.settings') || 'Settings'}</span>
            </div>

            <div className={styles.cardBody}>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(true)}
                className={`${styles.button} ${styles.buttonDanger}`}
                style={{ width: '100%' }}
              >
                ลบบัญชีผู้ใช้
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{t('common.confirm') || 'Confirm'}</h2>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={() => setShowDeleteAccountModal(false)}
                style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                คุณต้องการลบบัญชีผู้ใช้ไหม? การดำเนินการนี้ไม่สามารถยกเลิกได้
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                {t('common.ok') || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>➕ เพิ่มที่อยู่ใหม่</h2>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={() => setShowAddressModal(false)}
                style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="addrName">ชื่อที่อยู่ *</label>
                  <input
                    id="addrName"
                    type="text"
                    className={styles.input}
                    value={addressForm.name}
                    onChange={(e) => handleAddressInputChange('name', e.target.value)}
                    placeholder="เช่น บ้าน, ที่ทำงาน"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="addrAddress">ที่อยู่ *</label>
                  <textarea
                    id="addrAddress"
                    className={styles.input}
                    value={addressForm.address}
                    onChange={(e) => handleAddressInputChange('address', e.target.value)}
                    placeholder="เลขที่, ถนน, หมู่บ้าน"
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="addrDistrict">แขวง/ตำบล</label>
                    <input
                      id="addrDistrict"
                      type="text"
                      className={styles.input}
                      value={addressForm.district}
                      onChange={(e) => handleAddressInputChange('district', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="addrCity">เขต/อำเภอ</label>
                    <input
                      id="addrCity"
                      type="text"
                      className={styles.input}
                      value={addressForm.city}
                      onChange={(e) => handleAddressInputChange('city', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="addrProvince">จังหวัด</label>
                    <input
                      id="addrProvince"
                      type="text"
                      className={styles.input}
                      value={addressForm.province}
                      onChange={(e) => handleAddressInputChange('province', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="addrPostal">รหัสไปรษณีย์</label>
                    <input
                      id="addrPostal"
                      type="text"
                      className={styles.input}
                      value={addressForm.postalCode}
                      onChange={(e) => handleAddressInputChange('postalCode', e.target.value)}
                      maxLength={5}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="addrPhone">เบอร์โทรศัพท์</label>
                  <input
                    id="addrPhone"
                    type="tel"
                    className={styles.input}
                    value={addressForm.phone}
                    onChange={(e) => handleAddressInputChange('phone', e.target.value)}
                    placeholder="098-765-4321"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                disabled={saving}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                ❌ ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={saving}
                className={`${styles.button} ${styles.buttonPrimary} ${saving ? styles.buttonDisabled : ''}`}
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
