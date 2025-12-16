import { useEffect, useRef, useState } from 'react';
import { db, storage } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import styles from './AdminBankAccountPage.module.css';

export default function AdminBankAccountPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [menuOpenIndex, setMenuOpenIndex] = useState(-1);
  const menuWrapRef = useRef(null);
  
  // Form state
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [note, setNote] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const snap = await getDoc(doc(db, 'settings', 'paymentAccount'));
        if (snap.exists()) {
          const data = snap.data() || {};
          const loadedAccounts = Array.isArray(data.accounts) && data.accounts.length > 0
            ? data.accounts
            : [{
                id: 'primary',
                bankName: data.bankName || '',
                accountName: data.accountName || '',
                accountNumber: data.accountNumber || '',
                note: data.note || '',
                qrUrl: data.qrUrl || '',
                isPrimary: true,
                isActive: true,
              }];
          setAccounts(loadedAccounts);
        } else {
          setAccounts([]);
        }
      } catch (e) {
        console.error('load paymentAccount failed:', e);
        setError(t('payment.load_account_failed'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  useEffect(() => {
    const handler = (e) => {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(e.target)) {
        setMenuOpenIndex(-1);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('payment.please_select_image_qr'));
      return;
    }
    setError('');
    setQrFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setQrUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingIndex(-1);
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setNote('');
    setQrUrl('');
    setQrFile(null);
    setIsPrimary(accounts.length === 0);
    setIsActive(true);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const normalizePrimary = (nextAccounts) => {
    if (!Array.isArray(nextAccounts) || nextAccounts.length === 0) return [];
    if (nextAccounts.some((a) => a.isPrimary)) return nextAccounts;
    return nextAccounts.map((a, idx) => ({ ...a, isPrimary: idx === 0 }));
  };

  const deleteAccount = async (index) => {
    if (saving) return;
    const target = accounts[index];
    if (!target) return;

    const ok = window.confirm(t('payment.confirm_delete_account') || 'ต้องการลบบัญชีนี้หรือไม่?');
    if (!ok) return;

    setSaving(true);
    setError('');
    setSuccess('');
    setMenuOpenIndex(-1);

    try {
      // delete qr image if possible
      const existingUrl = target.qrUrl || null;
      if (existingUrl && typeof existingUrl === 'string' && existingUrl.startsWith('https://')) {
        try {
          const path = existingUrl.split('/o/')[1]?.split('?')[0];
          if (path) {
            const decodedPath = decodeURIComponent(path);
            await deleteObject(ref(storage, decodedPath));
          }
        } catch (e) {
          console.warn('cannot delete qr image:', e);
        }
      }

      let nextAccounts = accounts.filter((_, i) => i !== index);
      if (target.isPrimary && nextAccounts.length > 0) {
        nextAccounts = nextAccounts.map((a, idx) => ({ ...a, isPrimary: idx === 0 }));
      }
      nextAccounts = normalizePrimary(nextAccounts);

      const primary = nextAccounts.find((a) => a.isPrimary) || nextAccounts[0] || null;

      await setDoc(
        doc(db, 'settings', 'paymentAccount'),
        {
          bankName: primary?.bankName || '',
          accountName: primary?.accountName || '',
          accountNumber: primary?.accountNumber || '',
          note: primary?.note || null,
          qrUrl: primary?.qrUrl || null,
          accounts: nextAccounts,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setAccounts(nextAccounts);
      setSuccess(t('payment.account_deleted_success') || 'ลบบัญชีสำเร็จ');
    } catch (e) {
      console.error('delete account failed:', e);
      setError(t('payment.delete_account_failed') || 'ลบบัญชีไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (index) => {
    const acc = accounts[index];
    setEditingIndex(index);
    setBankName(acc.bankName || '');
    setAccountName(acc.accountName || '');
    setAccountNumber(acc.accountNumber || '');
    setNote(acc.note || '');
    setQrUrl(acc.qrUrl || '');
    setQrFile(null);
    setIsPrimary(acc.isPrimary || false);
    setIsActive(acc.isActive !== false);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setError(t('payment.please_fill_account_info'));
      return;
    }

    setSaving(true);
    try {
      let uploadedUrl = qrUrl;

      if (qrFile) {
        const docRef = doc(db, 'settings', 'paymentAccount');
        const existing = await getDoc(docRef);
        const existingData = existing.exists() ? existing.data() || {} : {};
        const existingAccounts = Array.isArray(existingData.accounts) ? existingData.accounts : [];

        const currentAccountExisting = existingAccounts[editingIndex];
        const existingUrl = (currentAccountExisting && currentAccountExisting.qrUrl) || existingData.qrUrl || null;

        if (existingUrl && existingUrl.startsWith('https://')) {
          try {
            const path = existingUrl.split('/o/')[1]?.split('?')[0];
            if (path) {
              const decodedPath = decodeURIComponent(path);
              await deleteObject(ref(storage, decodedPath));
            }
          } catch (e) {
            console.warn('cannot delete old qr image:', e);
          }
        }

        const storageRef = ref(storage, `admin/payment-qr/main-${Date.now()}`);
        await uploadBytes(storageRef, qrFile);
        uploadedUrl = await getDownloadURL(storageRef);
      }

      const updatedAccounts = [...accounts];
      const baseAccount = {
        id: updatedAccounts[editingIndex]?.id || `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        note: note.trim() || null,
        qrUrl: uploadedUrl || null,
        isPrimary,
        isActive,
      };

      if (editingIndex >= 0 && updatedAccounts[editingIndex]) {
        updatedAccounts[editingIndex] = baseAccount;
      } else {
        updatedAccounts.push(baseAccount);
      }

      let nextAccounts = updatedAccounts;
      if (!nextAccounts.some((a) => a.isPrimary)) {
        nextAccounts = nextAccounts.map((a, idx) => ({
          ...a,
          isPrimary: idx === (editingIndex >= 0 ? editingIndex : nextAccounts.length - 1),
        }));
      } else if (isPrimary) {
        nextAccounts = nextAccounts.map((a, idx) => ({
          ...a,
          isPrimary: idx === (editingIndex >= 0 ? editingIndex : nextAccounts.length - 1),
        }));
      }

      const primary = nextAccounts.find((a) => a.isPrimary) || nextAccounts[0];

      await setDoc(
        doc(db, 'settings', 'paymentAccount'),
        {
          bankName: primary.bankName,
          accountName: primary.accountName,
          accountNumber: primary.accountNumber,
          note: primary.note || null,
          qrUrl: primary.qrUrl || null,
          accounts: nextAccounts,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setAccounts(nextAccounts);
      setSuccess(t('payment.account_saved_success'));
      setQrFile(null);
      setShowModal(false);
    } catch (e) {
      console.error('save paymentAccount failed:', e);
      setError(t('payment.save_account_failed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleAccountActive = async (index) => {
    const updatedAccounts = [...accounts];
    updatedAccounts[index] = {
      ...updatedAccounts[index],
      isActive: !updatedAccounts[index].isActive,
    };

    try {
      const primary = updatedAccounts.find((a) => a.isPrimary) || updatedAccounts[0];
      await setDoc(
        doc(db, 'settings', 'paymentAccount'),
        {
          bankName: primary.bankName,
          accountName: primary.accountName,
          accountNumber: primary.accountNumber,
          note: primary.note || null,
          qrUrl: primary.qrUrl || null,
          accounts: updatedAccounts,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setAccounts(updatedAccounts);
    } catch (e) {
      console.error('toggle active failed:', e);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getBankColor = (bankName) => {
    const name = (bankName || '').toLowerCase();
    if (name.includes('kasikorn') || name.includes('kbank') || name.includes('กสิกร')) return '#138f2d';
    if (name.includes('scb') || name.includes('ไทยพาณิชย์') || name.includes('siam')) return '#4e2583';
    if (name.includes('bangkok') || name.includes('bbl') || name.includes('กรุงเทพ')) return '#1e4598';
    if (name.includes('krungsri') || name.includes('กรุงศรี')) return '#ffc423';
    if (name.includes('ttb') || name.includes('ทหารไทย')) return '#0066b3';
    if (name.includes('krungthai') || name.includes('กรุงไทย') || name.includes('ktb')) return '#1ba5e0';
    return '#64748b';
  };

  const getBankShortName = (bankName) => {
    const name = (bankName || '').toLowerCase();
    if (name.includes('kasikorn') || name.includes('kbank') || name.includes('กสิกร')) return 'KBank';
    if (name.includes('scb') || name.includes('ไทยพาณิชย์') || name.includes('siam')) return 'SCB';
    if (name.includes('bangkok') || name.includes('bbl') || name.includes('กรุงเทพ')) return 'BBL';
    if (name.includes('krungsri') || name.includes('กรุงศรี')) return 'BAY';
    if (name.includes('ttb') || name.includes('ทหารไทย')) return 'TTB';
    if (name.includes('krungthai') || name.includes('กรุงไทย') || name.includes('ktb')) return 'KTB';
    return bankName?.slice(0, 3)?.toUpperCase() || 'BANK';
  };

  // Stats
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(a => a.isActive !== false).length;
  const inactiveAccounts = totalAccounts - activeAccounts;

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingState}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{t('payment.manage_payment_account')}</h1>
            <p className={styles.pageSubtitle}>{t('payment.manage_payment_account_desc')}</p>
          </div>
          <button className={styles.addButton} onClick={openAddModal}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
            {t('payment.add_account')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Accounts</p>
              <p className={styles.statValue}>{totalAccounts}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Active</p>
              <p className={`${styles.statValue} ${styles.statValueGreen}`}>{activeAccounts}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Inactive</p>
              <p className={`${styles.statValue} ${styles.statValueGray}`}>{inactiveAccounts}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.statIconGray}`}>
              <span className="material-symbols-outlined">pause_circle</span>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && <div className={styles.alertSuccess}>{success}</div>}
        {error && <div className={styles.alertError}>{error}</div>}

        {/* Cards Grid */}
        <div className={styles.cardsGrid}>
          {accounts.map((acc, idx) => {
            const isActiveAccount = acc.isActive !== false;
            const bankColor = getBankColor(acc.bankName);
            
            return (
              <div 
                key={acc.id || idx} 
                className={`${styles.bankCard} ${!isActiveAccount ? styles.bankCardInactive : ''}`}
              >
                <span className={`material-symbols-outlined ${styles.bankCardWatermark}`}>account_balance</span>
                
                <div className={styles.bankCardContent}>
                  <div className={styles.bankCardHeader}>
                    <div className={styles.bankCardInfo}>
                      <div className={`${styles.bankLogo} ${!isActiveAccount ? styles.bankLogoGrayscale : ''}`}>
                        <div 
                          className={styles.bankLogoInner}
                          style={{ backgroundColor: bankColor }}
                        >
                          {getBankShortName(acc.bankName)}
                        </div>
                      </div>
                      <div className={styles.bankDetails}>
                        <h3 className={styles.bankName}>{acc.bankName || t('payment.bank_name')}</h3>
                        <span className={`${styles.bankTypeBadge} ${
                          acc.isPrimary ? styles.bankTypeBadgeGreen : 
                          isActiveAccount ? styles.bankTypeBadgePurple : styles.bankTypeBadgeGray
                        }`}>
                          {acc.isPrimary ? t('payment.primary') : isActiveAccount ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.menuWrap} ref={idx === menuOpenIndex ? menuWrapRef : null}>
                      <button
                        type="button"
                        className={styles.moreButton}
                        onClick={() => setMenuOpenIndex((v) => (v === idx ? -1 : idx))}
                        aria-label={t('common.action') || 'Actions'}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                      {menuOpenIndex === idx && (
                        <div className={styles.menuDropdown} role="menu">
                          <button
                            type="button"
                            className={styles.menuItem}
                            onClick={() => {
                              setMenuOpenIndex(-1);
                              openEditModal(idx);
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                            {t('common.edit') || 'Edit'}
                          </button>
                          <button
                            type="button"
                            className={`${styles.menuItem} ${styles.menuItemDanger}`}
                            onClick={() => deleteAccount(idx)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                            {t('common.delete') || 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.bankCardField}>
                    <p className={styles.fieldLabel}>{t('payment.account_name')}</p>
                    <p className={styles.fieldValue}>{acc.accountName || '-'}</p>
                  </div>

                  <div className={styles.bankCardField}>
                    <p className={styles.fieldLabel}>{t('payment.account_number')}</p>
                    <div className={styles.accountNumberWrapper}>
                      <p className={`${styles.accountNumber} ${!isActiveAccount ? styles.accountNumberInactive : ''}`}>
                        {acc.accountNumber || '-'}
                      </p>
                      <button 
                        className={styles.copyButton} 
                        onClick={() => copyToClipboard(acc.accountNumber)}
                        title="Copy"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.bankCardFooter}>
                  <div className={styles.toggleWrapper}>
                    <div 
                      className={`${styles.toggle} ${isActiveAccount ? styles.toggleActive : ''}`}
                      onClick={() => toggleAccountActive(idx)}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                    <span className={styles.toggleLabel}>Active</span>
                  </div>
                  <button className={styles.editButton} onClick={() => openEditModal(idx)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span>
                    Edit Details
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Card */}
          <button className={styles.addNewCard} onClick={openAddModal}>
            <div className={styles.addNewCardIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.875rem', color: '#94a3b8' }}>add</span>
            </div>
            <p className={styles.addNewCardTitle}>{t('payment.add_account')}</p>
            <p className={styles.addNewCardSubtitle}>Supports all major Thai banks</p>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingIndex >= 0 ? t('Payment Edit') : t('payment.add_account')}
              </h2>
              <button className={styles.modalCloseButton} onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className={styles.modalBody}>
              {error && <div className={styles.alertError}>{error}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('payment.bank_name')}</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={t('payment.bank_name_placeholder')}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('payment.account_name')}</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={t('payment.account_name_placeholder')}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('payment.account_number')}</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={t('payment.account_number_placeholder')}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('payment.payment_note')} ({t('common.optional')})</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('payment.note_placeholder')}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.qrUploadSection}>
                <label className={styles.formLabel}>{t('payment.qr_code_for_payment')}</label>
                <div className={styles.qrUploadContent}>
                  {qrUrl && (
                    <img src={qrUrl} alt="QR Code" className={styles.qrPreview} />
                  )}
                  <label className={styles.uploadButton}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>upload</span>
                    {t('payment.upload_qr_code')}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className={styles.checkboxWrapper}>
                <input
                  id="primary-checkbox"
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="primary-checkbox" className={styles.checkboxLabel}>
                  {t('payment.set_as_primary')}
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowModal(false)}>
                {t('common.cancel')}
              </button>
              <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
                {saving ? t('message.saving') : t('common.save_changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
