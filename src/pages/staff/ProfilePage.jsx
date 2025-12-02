import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../firebase';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [createdAt, setCreatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for editing
  const [editForm, setEditForm] = useState({
    displayName: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !profile) return;
      setDisplayName(profile.displayName || '');
      setEmail(profile.email || user.email || '');
      setRole(profile.role || '');
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPhone(data.phone || '');
          setAddress(data.address || '');
          if (data.createdAt) {
            setCreatedAt(data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt));
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, profile]);

  const handleEditClick = () => {
    setEditForm({
      displayName: displayName,
      phone: phone,
      address: address
    });
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      displayName: '',
      phone: '',
      address: ''
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editForm.displayName.trim() !== displayName) {
        await updateProfile(auth.currentUser, {
          displayName: editForm.displayName.trim()
        });
      }
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editForm.displayName.trim() || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        updatedAt: new Date()
      });
      setDisplayName(editForm.displayName.trim());
      setPhone(editForm.phone.trim());
      setAddress(editForm.address.trim());
      setSuccess('อัพเดตข้อมูลโปรไฟล์สำเร็จ!');
      setIsEditing(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('เกิดข้อผิดพลาดในการอัพเดตข้อมูล: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'ผู้ดูแลระบบ', color: '#f44336', bg: '#ffebee' };
      case 'staff':
        return { label: 'พนักงาน', color: '#2196F3', bg: '#e3f2fd' };
      case 'customer':
        return { label: 'ลูกค้า', color: '#4CAF50', bg: '#e8f5e9' };
      default:
        return { label: 'ไม่ระบุ', color: '#9e9e9e', bg: '#f5f5f5' };
    }
  };

  const roleInfo = getRoleLabel(role);

  if (loading) {
    return (
      <div
        style={{
          padding: '24px',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background:
            'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666' }}>กำลังโหลดข้อมูลโปรไฟล์...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1120, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 18px rgba(15,23,42,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#111827', fontSize: '26px', fontWeight: '700', letterSpacing: '0.03em' }}>
              โปรไฟล์พนักงาน
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              จัดการข้อมูลผู้ใช้งานสำหรับพนักงาน
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(15,23,42,0.15)',
          marginBottom: '20px'
        }}>
        {/* Avatar Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '30px',
          paddingBottom: '30px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 20%, #ffffff 0%, #38bdf8 45%, #1d4ed8 90%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b1120',
            fontSize: '40px',
            fontWeight: 'bold',
            boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
            border: '3px solid rgba(255,255,255,0.9)'
          }}>
            {(displayName || email || 'S')[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
              {displayName || 'ไม่ระบุชื่อ'}
            </h2>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              color: roleInfo.color,
              backgroundColor: roleInfo.bg
            }}>
              {roleInfo.label}
            </div>
          </div>
        </div>

        {/* Information Display */}
        {!isEditing ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 18,
              }}
            >
              <button
                onClick={handleEditClick}
                style={{
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#eff6ff',
                  background:
                    'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: 999,
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(37,99,235,0.45)',
                  letterSpacing: '0.03em',
                }}
              >
                แก้ไขข้อมูล
              </button>
            </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#666'
              }}>
                อีเมล
              </label>
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#333',
                border: '1px solid #e0e0e0'
              }}>
                {email || '-'}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#666'
              }}>
                เบอร์โทรศัพท์
              </label>
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#333',
                border: '1px solid #e0e0e0'
              }}>
                {phone || '-'}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#666'
              }}>
                ที่อยู่
              </label>
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#333',
                border: '1px solid #e0e0e0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {address || '-'}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#666'
              }}>
                วันที่สร้างบัญชี
              </label>
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#333',
                border: '1px solid #e0e0e0'
              }}>
                {formatDate(createdAt)}
              </div>
            </div>
          </div>
          </>
        ) : (
          /* Edit Form */
          <div>
            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: '8px',
                color: '#c62828',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#e8f5e9',
                border: '1px solid #4CAF50',
                borderRadius: '8px',
                color: '#2e7d32',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                ✓ {success}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div>
                  <label htmlFor="editDisplayName" style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    type="text"
                    id="editDisplayName"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    placeholder="กรอกชื่อ-นามสกุล"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="editPhone" style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    id="editPhone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="เช่น 081-234-5678"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="editAddress" style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    ที่อยู่
                  </label>
                  <textarea
                    id="editAddress"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="กรอกที่อยู่ของคุณ"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                paddingTop: '20px',
                borderTop: '2px solid #f0f0f0'
              }}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#374151',
                    background: saving
                      ? '#e5e7eb'
                      : 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 45%, #d1d5db 100%)',
                    border: '1px solid #d1d5db',
                    borderRadius: '999px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving ? 'none' : '0 6px 14px rgba(107,114,128,0.35)',
                    letterSpacing: '0.02em',
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#eff6ff',
                    background: saving
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                    border: 'none',
                    borderRadius: '999px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving ? 'none' : '0 10px 20px rgba(37,99,235,0.45)',
                    letterSpacing: '0.03em',
                  }}
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
