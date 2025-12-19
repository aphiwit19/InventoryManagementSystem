import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { ensureUserProfile, updateUserProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../services';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import styles from '../customer/ProfilePage.module.css';

export default function ProfilePage() {
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoURL, setPhotoURL] = useState('');
  const [initialFormData, setInitialFormData] = useState(null);
  
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
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();

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
        
        const fallbackDisplayName = (userData.displayName || profile?.displayName || '').trim();

        const nextFormData = {
          firstName: userData.firstName || fallbackDisplayName,
          lastName: userData.lastName || '',
          phone: userData.phone || '',
        };

        setFormData(nextFormData);
        setInitialFormData(nextFormData);
        
        // โหลดรูปโปรไฟล์
        setPhotoURL(userData.photoURL || profile?.photoURL || user.photoURL || '');
        
        // โหลดที่อยู่
        const nextAddresses = Array.isArray(userData.addresses) ? userData.addresses : [];
        if (nextAddresses.length === 0 && typeof userData.address === 'string' && userData.address.trim()) {
          setAddresses([
            {
              id: 'legacy-address',
              name: 'Home',
              address: userData.address.trim(),
              district: '',
              city: '',
              province: '',
              postalCode: '',
              phone: userData.phone || '',
              isDefault: true,
            },
          ]);
        } else {
          setAddresses(nextAddresses);
        }
        
        // โหลดการตั้งค่า
        setSettings({
          emailNotifications: userData.settings?.emailNotifications ?? true,
          promotions: userData.settings?.promotions ?? true,
          smsNotifications: userData.settings?.smsNotifications ?? false,
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        // ถ้าไม่มีข้อมูล ให้ใช้ค่าว่าง
        const emptyForm = {
          firstName: '',
          lastName: '',
          phone: '',
        };
        setFormData(emptyForm);
        setInitialFormData(emptyForm);
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

  const handleRemovePhoto = async () => {
    if (!user?.uid || uploadingPhoto) return;

    setUploadingPhoto(true);
    try {
      await updateProfile(user, { photoURL: '' });
      await updateUserProfile(user.uid, { photoURL: '' });
      setPhotoURL('');
    } catch (error) {
      console.error('Error removing photo:', error);
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
        firstName: (formData.firstName || '').trim(),
        lastName: '',
        phone: formData.phone,
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

  const openEditAddressModal = (addr) => {
    setEditingAddress(addr.id);
    setAddressForm({
      name: addr.name || '',
      address: addr.address || '',
      district: addr.district || '',
      city: addr.city || '',
      province: addr.province || '',
      postalCode: addr.postalCode || '',
      phone: addr.phone || '',
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
      if (editingAddress) {
        // Update existing address
        const updatedAddr = await updateAddress(user.uid, editingAddress, addressForm);
        setAddresses(prev => prev.map(addr => 
          addr.id === editingAddress ? updatedAddr : addr
        ));
      } else {
        // Add new address
        const newAddress = await addAddress(user.uid, addressForm);
        setAddresses(prev => [...prev, newAddress]);
      }
      setShowAddressModal(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!user?.uid) return;
    if (!window.confirm(t('profile.confirm_delete_address'))) return;

    try {
      // กรณี legacy address ที่ไม่มีใน Database จริง
      if (addressId === 'legacy-address') {
        await updateUserProfile(user.uid, { address: '' });
        setAddresses([]);
      } else {
        await deleteAddress(user.uid, addressId);
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      }
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
      <div className={styles.loadingState}>
        <div className={styles.loadingIcon}>⏳</div>
        <div className={styles.loadingText}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('profile.my_profile')}</h1>
        <p className={styles.pageSubtitle}>{t('profile.profile_subtitle')}</p>
      </div>

      <div className={styles.mainGrid}>
        <aside className={styles.sidebar}>
          <div className={styles.profileCard}>
            <div className={styles.profileCardGradient}></div>
            <div className={styles.profileAvatarWrapper}>
              <div className={styles.profileAvatar}>
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className={styles.profileAvatarImage} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#94a3b8' }}>person</span>
                )}
              </div>
              <label className={styles.uploadPhotoButton} title="Upload new photo">
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>photo_camera</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  disabled={uploadingPhoto}
                  className={styles.uploadPhotoInput}
                />
              </label>
            </div>
            <h3 className={styles.profileName}>{fullName || profile?.displayName || 'Staff'}</h3>
            <p className={styles.profileEmail}>{profile?.email || user?.email || ''}</p>

            {photoURL ? (
              <button
                type="button"
                className={styles.removePhotoButton}
                onClick={handleRemovePhoto}
                disabled={uploadingPhoto}
              >
                {t('profile.remove_photo')}
              </button>
            ) : null}
          </div>

          <div className={styles.navMenu}>
            <nav className={styles.navMenuList}>
              <button
                type="button"
                className={`${styles.navMenuItem} ${activeTab === 'personal' ? styles.navMenuItemActive : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>person</span>
                {t('profile.personal_info')}
              </button>
              <button
                type="button"
                className={`${styles.navMenuItem} ${activeTab === 'address' ? styles.navMenuItemActive : ''}`}
                onClick={() => setActiveTab('address')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>location_on</span>
                {t('profile.address_book')}
              </button>
              <button
                type="button"
                className={styles.navMenuItem}
                onClick={() => navigate('/staff/orders')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>shopping_bag</span>
                {t('profile.my_orders')}
              </button>
              <button
                type="button"
                className={`${styles.navMenuItem} ${activeTab === 'security' ? styles.navMenuItemActive : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>lock</span>
                {t('profile.security')}
              </button>
              <div className={styles.navMenuDivider}></div>
            </nav>
          </div>
        </aside>

        <div className={styles.content}>
          <div className={styles.tabsHeader}>
            <div className={styles.tabsList}>
              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === 'personal' ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                {t('profile.personal_info')}
              </button>
              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === 'address' ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab('address')}
              >
                {t('profile.address_book')}
              </button>
              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === 'security' ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab('security')}
              >
                {t('profile.security')}
              </button>
            </div>
          </div>

          {activeTab === 'personal' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{t('profile.edit_profile')}</h2>
                <span className={styles.lastUpdated}>{t('profile.last_updated')}</span>
              </div>

              <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>{t('profile.full_name')}</label>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>person</span>
                      </div>
                      <input
                        type="text"
                        className={`${styles.formInput} ${!editingPersonal ? styles.formInputDisabled : ''}`}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={!editingPersonal}
                      />
                    </div>
                  </div>

                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>{t('profile.email_address')}</label>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>mail</span>
                      </div>
                      <input
                        type="email"
                        className={`${styles.formInput} ${styles.formInputDisabled}`}
                        value={profile?.email || user?.email || ''}
                        disabled
                      />
                    </div>
                    <p className={styles.formHint}>{t('profile.email_change_hint')}</p>
                  </div>

                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>{t('profile.phone_number')}</label>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>phone</span>
                      </div>
                      <input
                        type="tel"
                        className={`${styles.formInput} ${!editingPersonal ? styles.formInputDisabled : ''}`}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!editingPersonal}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  {editingPersonal ? (
                    <>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => {
                          if (initialFormData) setFormData(initialFormData);
                          setEditingPersonal(false);
                        }}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className={styles.saveButton}
                        disabled={saving}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>save</span>
                        {saving ? t('common.saving') : t('common.save_changes')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={() => setEditingPersonal(true)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span>
                      {t('profile.edit_profile')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'address' && (
            <div className={styles.card}>
              <div className={styles.addressHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t('profile.address_book')}</h2>
                  <p className={styles.cardSubtitle}>{t('profile.address_subtitle')}</p>
                </div>
                <button type="button" className={styles.addAddressButton} onClick={openAddAddressModal}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>add</span>
                  {t('profile.add_new_address')}
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className={styles.emptyState}>{t('profile.no_addresses')}</div>
              ) : (
                <div className={styles.addressGrid}>
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`${styles.addressCard} ${addr.isDefault ? styles.addressCardDefault : ''}`}
                    >
                      <div className={styles.addressCardActions}>
                        <button type="button" className={styles.addressActionButton} title="Edit" onClick={() => openEditAddressModal(addr)}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>edit</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.addressActionButton} ${styles.addressActionButtonDanger}`}
                          title="Delete"
                          onClick={() => handleDeleteAddress(addr.id)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                        </button>
                      </div>

                      <div className={styles.addressCardHeader}>
                        <span className={`${styles.addressIcon} ${addr.isDefault ? styles.addressIconDefault : ''}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                            {addr.name?.toLowerCase().includes('office') ? 'work' : 'home'}
                          </span>
                        </span>
                        <span className={styles.addressLabel}>{addr.name}</span>
                        {addr.isDefault && <span className={styles.addressBadge}>{t('profile.default')}</span>}
                      </div>

                      <p className={styles.addressName}>{fullName || profile?.displayName || 'Staff'}</p>
                      <p className={styles.addressText}>
                        {addr.address}<br />
                        {addr.district && `${addr.district}, `}
                        {addr.city && `${addr.city}`}<br />
                        {addr.province && `${addr.province} `}
                        {addr.postalCode}
                      </p>
                      {addr.phone && (
                        <p className={styles.addressPhone}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>call</span>
                          {addr.phone}
                        </p>
                      )}

                      {!addr.isDefault && (
                        <div className={styles.addressCardFooter}>
                          <button
                            type="button"
                            className={styles.setDefaultButton}
                            onClick={() => handleSetDefaultAddress(addr.id)}
                          >
                            {t('profile.set_as_default')}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{t('profile.change_password')}</h2>
              </div>

              <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label className={styles.formLabel}>{t('profile.current_password')}</label>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>lock</span>
                      </div>
                      <input
                        type="password"
                        className={styles.formInput}
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                        placeholder={t('profile.current_password_placeholder')}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('profile.new_password')}</label>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>lock</span>
                      </div>
                      <input
                        type="password"
                        className={styles.formInput}
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        placeholder={t('profile.new_password_placeholder')}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('profile.confirm_new_password')}</label>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>lock</span>
                      </div>
                      <input
                        type="password"
                        className={styles.formInput}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        placeholder={t('profile.confirm_new_password_placeholder')}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton} disabled={changingPassword}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>lock</span>
                    {changingPassword ? t('profile.changing_password') : t('profile.change_password_action')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {showAddressModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>{editingAddress ? t('profile.edit_address') : t('profile.add_new_address')}</h2>

            <form className={styles.form}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.formLabel}>{t('profile.address_label')} *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ paddingLeft: '0.75rem' }}
                    value={addressForm.name}
                    onChange={(e) => handleAddressInputChange('name', e.target.value)}
                    placeholder={t('profile.address_label_placeholder')}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.formLabel}>{t('common.address')} *</label>
                  <textarea
                    className={styles.formInput}
                    style={{ paddingLeft: '0.75rem', minHeight: '80px', resize: 'vertical' }}
                    value={addressForm.address}
                    onChange={(e) => handleAddressInputChange('address', e.target.value)}
                    placeholder={t('profile.address_placeholder')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('profile.district')}</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ paddingLeft: '0.75rem' }}
                    value={addressForm.district}
                    onChange={(e) => handleAddressInputChange('district', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('profile.city')}</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ paddingLeft: '0.75rem' }}
                    value={addressForm.city}
                    onChange={(e) => handleAddressInputChange('city', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('profile.province')}</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ paddingLeft: '0.75rem' }}
                    value={addressForm.province}
                    onChange={(e) => handleAddressInputChange('province', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('profile.postal_code')}</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ paddingLeft: '0.75rem' }}
                    value={addressForm.postalCode}
                    onChange={(e) => handleAddressInputChange('postalCode', e.target.value)}
                    maxLength={5}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.formLabel}>{t('common.phone')}</label>
                  <input
                    type="tel"
                    className={styles.formInput}
                    style={{ paddingLeft: '0.75rem' }}
                    value={addressForm.phone}
                    onChange={(e) => handleAddressInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowAddressModal(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSaveAddress}
                  disabled={saving}
                >
                  {saving ? t('common.saving') : t('profile.save_address')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
