import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { ensureUserProfile, updateUserProfile } from '../../services';
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
          <div style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center' }}>{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{t('profile.my_profile_title')}</h1>
          <p className={styles.subtitle}>{t('profile.manage_profile')}</p>
        </div>

        {/* Left: Profile Card */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>
                  {photoURL ? (
                    <img className={styles.avatarImg} src={photoURL} alt={t('common.profile')} />
                  ) : (
                    <span className={styles.avatarPlaceholder}>👤</span>
                  )}
                  {uploadingPhoto && (
                    <div className={styles.avatarOverlay}>⏳</div>
                  )}
                </div>
                <label htmlFor="avatar-upload" className={styles.avatarCameraButton} title={t('common.change_photo')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>photo_camera</span>
                </label>
              </div>

              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>{profile?.displayName || t('common.admin')}</h2>
                <p className={styles.profileRole}>{profile?.email || user?.email || '-'}</p>

                <div className={styles.buttonRow}>
                  <label
                    htmlFor="avatar-upload"
                    className={`${styles.button} ${styles.buttonSecondary} ${uploadingPhoto ? styles.buttonDisabled : ''}`}
                  >
                    {uploadingPhoto ? t('message.uploading') : t('common.change_photo')}
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
        <div className={styles.sectionStack}>
          {/* Personal Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{t('profile.personal_information')}</h3>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setEditingPersonal(!editingPersonal)}
              >
                {editingPersonal ? t('common.cancel') : t('common.edit')}
              </button>
            </div>

            <div className={styles.cardBody}>
              <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formGrid}>
                  <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label} htmlFor="firstName">
                      {t('profile.full_name')}
                    </label>
                    <div className={styles.inputWrap}>
                      <span className={`material-symbols-outlined ${styles.iconLeft}`}>person</span>
                      <input
                        id="firstName"
                        type="text"
                        className={`${styles.input} ${styles.inputWithIconLeft} ${!editingPersonal ? styles.inputDisabled : ''}`}
                        disabled={!editingPersonal}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label} htmlFor="email">
                      {t('profile.email_address')}
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

                  <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label} htmlFor="phone">
                      {t('profile.phone_number')}
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
                </div>

                <div className={styles.actionBar}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonSecondary} ${styles.actionButton}`}
                    onClick={() => setEditingPersonal(false)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonPrimary} ${styles.actionButton} ${(saving || !editingPersonal) ? styles.buttonDisabled : ''}`}
                    onClick={handleSaveProfile}
                    disabled={saving || !editingPersonal}
                  >
                    {saving ? t('message.saving') : t('common.save_changes')}
                  </button>
                </div>
              </form>
            </div>
        </div>

          {/* Change Password */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{t('profile.change_password')}</h3>
              <span className={styles.cardMeta}>{t('common.security')}</span>
            </div>

            <div className={styles.cardBody}>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="currentPassword">{t('profile.current_password')}</label>
                <input
                  id="currentPassword"
                  type="password"
                  className={styles.input}
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                  placeholder={t('profile.current_password_placeholder')}
                />
              </div>

              <div className={styles.formGrid} style={{ marginTop: '1rem' }}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="newPassword">{t('profile.new_password')}</label>
                  <input
                    id="newPassword"
                    type="password"
                    className={styles.input}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    placeholder={t('profile.new_password_placeholder')}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="confirmNewPassword">{t('profile.confirm_new_password')}</label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    className={styles.input}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    placeholder={t('profile.confirm_new_password_placeholder')}
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
              {changingPassword ? t('profile.changing_password') : t('profile.change_password_action')}
            </button>
            </div>
          </div>

          {/* Account Settings */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{t('profile.account_settings')}</h3>
              <span className={styles.cardMeta}>{t('common.settings')}</span>
            </div>

            <div className={styles.cardBody}>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(true)}
                className={`${styles.button} ${styles.buttonDanger}`}
                style={{ width: '100%' }}
              >
                {t('profile.delete_account')}
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
              <h2 className={styles.modalTitle}>{t('common.confirm')}</h2>
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
                {t('profile.delete_account_warning')}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={() => setShowDeleteAccountModal(false)}
              >
                {t('common.ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
