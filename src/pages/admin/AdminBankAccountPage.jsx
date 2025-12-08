import { useEffect, useState } from 'react';
import { db, storage } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useTranslation } from 'react-i18next';

// Admin page for managing bank account info + QR code
// Uses a single Firestore document: settings/paymentAccount
export default function AdminBankAccountPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState([]); // all accounts in settings/paymentAccount.accounts
  const [selectedIndex, setSelectedIndex] = useState(0); // which account is being edited
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [note, setNote] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(true);
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
            : [
                {
                  id: 'primary',
                  bankName: data.bankName || '',
                  accountName: data.accountName || '',
                  accountNumber: data.accountNumber || '',
                  note: data.note || '',
                  qrUrl: data.qrUrl || '',
                  isPrimary: true,
                },
              ];

          setAccounts(loadedAccounts);

          const primary =
            loadedAccounts.find((a) => a.isPrimary) || loadedAccounts[0];
          const primaryIndex = loadedAccounts.findIndex(
            (a) => a.id === primary.id
          );
          setSelectedIndex(primaryIndex >= 0 ? primaryIndex : 0);

          setBankName(primary.bankName || '');
          setAccountName(primary.accountName || '');
          setAccountNumber(primary.accountNumber || '');
          setNote(primary.note || '');
          setQrUrl(primary.qrUrl || '');
          setIsPrimary(primary.isPrimary !== false);
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
        const existingAccounts = Array.isArray(existingData.accounts)
          ? existingData.accounts
          : [];

        // ลองลบ QR เดิมของบัญชีนี้ (ถ้าเก็บ url ไว้)
        const currentAccountExisting = existingAccounts[selectedIndex];
        const existingUrl =
          (currentAccountExisting && currentAccountExisting.qrUrl) ||
          existingData.qrUrl ||
          null;

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

      // อัปเดต accounts ใน state
      const updatedAccounts = [...accounts];
      const baseAccount = {
        id:
          updatedAccounts[selectedIndex]?.id ||
          `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        note: note.trim() || null,
        qrUrl: uploadedUrl || null,
        isPrimary,
      };

      if (updatedAccounts[selectedIndex]) {
        updatedAccounts[selectedIndex] = baseAccount;
      } else {
        updatedAccounts.push(baseAccount);
        setSelectedIndex(updatedAccounts.length - 1);
      }

      // ให้มี primary อย่างน้อย 1 บัญชี
      let nextAccounts = updatedAccounts;
      if (!nextAccounts.some((a) => a.isPrimary)) {
        nextAccounts = nextAccounts.map((a, idx) => ({
          ...a,
          isPrimary: idx === selectedIndex,
        }));
      } else if (isPrimary) {
        nextAccounts = nextAccounts.map((a, idx) => ({
          ...a,
          isPrimary: idx === selectedIndex,
        }));
      }

      const primary =
        nextAccounts.find((a) => a.isPrimary) || nextAccounts[0];

      await setDoc(
        doc(db, 'settings', 'paymentAccount'),
        {
          // mirror primary account สำหรับฝั่งลูกค้า
          bankName: primary.bankName,
          accountName: primary.accountName,
          accountNumber: primary.accountNumber,
          note: primary.note || null,
          qrUrl: primary.qrUrl || null,
          // เก็บทุกบัญชี
          accounts: nextAccounts,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setAccounts(nextAccounts);
      setSuccess(t('payment.account_saved_success'));
      setQrFile(null);
    } catch (e) {
      console.error('save paymentAccount failed:', e);
      setError(t('payment.save_account_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '28px 20px', minHeight: '100vh', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 18, padding: '24px 26px', boxShadow: '0 10px 40px rgba(15,23,42,0.12)' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 24, color: '#1e40af', fontWeight: 700 }}>{t('payment.manage_payment_account')}</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748b' }}>
              {t('payment.manage_payment_account_desc')}
            </p>
          </div>

          {/* Account selector pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {accounts.map((acc, idx) => (
              <button
                key={acc.id || idx}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx);
                  setBankName(acc.bankName || '');
                  setAccountName(acc.accountName || '');
                  setAccountNumber(acc.accountNumber || '');
                  setNote(acc.note || '');
                  setQrUrl(acc.qrUrl || '');
                  setQrFile(null);
                  setIsPrimary(acc.isPrimary !== false);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: selectedIndex === idx ? 'none' : '1px solid #e5e7eb',
                  background:
                    selectedIndex === idx
                      ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                      : '#f9fafb',
                  color: selectedIndex === idx ? '#fff' : '#1f2937',
                  fontSize: 13,
                  fontWeight: selectedIndex === idx ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {acc.bankName || acc.accountName || `${t('payment.account')} ${idx + 1}`}
                {acc.isPrimary && (
                  <span style={{ marginLeft: 6, fontSize: 11 }}>({t('payment.primary')})</span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const nextIndex = accounts.length;
                const newAcc = {
                  id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  bankName: '',
                  accountName: '',
                  accountNumber: '',
                  note: '',
                  qrUrl: '',
                  isPrimary: accounts.length === 0,
                };
                const nextAccounts = [...accounts, newAcc];
                setAccounts(nextAccounts);
                setSelectedIndex(nextIndex);
                setBankName('');
                setAccountName('');
                setAccountNumber('');
                setNote('');
                setQrUrl('');
                setQrFile(null);
                setIsPrimary(newAcc.isPrimary);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px dashed #3b82f6',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + {t('payment.add_account')}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              gap: 24,
              alignItems: 'flex-start',
            }}
          >
            {/* Left: QR preview + upload */}
            <div
              style={{
                background: 'linear-gradient(145deg,#EFF6FF,#DBEAFE)',
                borderRadius: 20,
                padding: 18,
                boxShadow: '0 10px 24px rgba(37,99,235,0.18)',
                border: '1px solid #bfdbfe',
              }}
            >
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8', marginBottom: 10 }}>
              {t('payment.qr_code_for_payment')}
            </div>
            <div
              style={{
                borderRadius: 16,
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                minHeight: 220,
              }}
            >
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR Code"
                  style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12 }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <div style={{ fontSize: 40, marginBottom: 4 }}>📷</div>
                  <div>{t('payment.no_qr_uploaded')}</div>
                </div>
              )}
            </div>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 999,
                cursor: 'pointer',
                border: 'none',
                background: 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: '0 6px 16px rgba(37,99,235,0.4)',
              }}
            >
              <span>{t('payment.upload_qr_code')}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
            <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
              {t('payment.file_hint')}
            </div>
            </div>

            {/* Right: bank account form */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 6px 20px rgba(15,23,42,0.08)',
                border: '1px solid #e5e7eb',
              }}
            >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{t('payment.bank_account_info')}</h2>
              {loading && (
                <span style={{ fontSize: 12, color: '#6b7280' }}>{t('common.loading')}</span>
              )}
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  marginBottom: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: '#ecfdf3',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: 13,
                }}
              >
                {success}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#4b5563' }}>
                  {t('payment.bank_name')}
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={t('payment.bank_name_placeholder')}
                  style={{
                    width: 'calc(100% - 50px)',
                    margin: '0 auto',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#4b5563' }}>
                  {t('payment.account_name')}
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={t('payment.account_name_placeholder')}
                  style={{
                    width: 'calc(100% - 50px)',
                    margin: '0 auto',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#4b5563' }}>
                  {t('payment.account_number')}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={t('payment.account_number_placeholder')}
                  style={{
                    width: 'calc(100% - 50px)',
                    margin: '0 auto',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#4b5563' }}>
                  {t('payment.payment_note')} ({t('common.optional')})
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('payment.note_placeholder')}
                  style={{
                    width: 'calc(100% - 50px)',
                    margin: '0 auto',
                    padding: '9px 12px',
                    borderRadius: 16,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  id="primary-account-checkbox"
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                />
                <label htmlFor="primary-account-checkbox" style={{ fontSize: 13, color: '#374151' }}>
                  {t('payment.set_as_primary')}
                </label>
              </div>
            </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  minWidth: 160,
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: saving
                    ? '#9ca3af'
                    : 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : '0 6px 16px rgba(37,99,235,0.4)',
                }}
              >
                {saving ? t('message.saving') : t('common.save_changes')}
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
