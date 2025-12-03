import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { db, storage } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const [photoURL, setPhotoURL] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

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
      setPhotoURL(profile.photoURL || user.photoURL || '');
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPhone(data.phone || '');
          setAddress(data.address || '');
          if (data.photoURL && !profile.photoURL && !user.photoURL) {
            setPhotoURL(data.photoURL);
          }
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
    setPhotoPreview('');
    setUploadError('');
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
      const finalPhoto = (photoPreview || photoURL || '').trim() || null;
      // อัพเดตชื่อและรูปโปรไฟล์ใน Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: editForm.displayName.trim(),
        photoURL: finalPhoto,
      });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editForm.displayName.trim() || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        photoURL: finalPhoto,
        updatedAt: new Date()
      });
      setDisplayName(editForm.displayName.trim());
      setPhone(editForm.phone.trim());
      setAddress(editForm.address.trim());
      setPhotoURL(finalPhoto || '');
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
        padding: '32px 24px',
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            padding: '20px 24px',
            borderRadius: 18,
            marginBottom: 20,
            boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
        >
          <h1
            style={{
              margin: 0,
              color: '#1e40af',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            โปรไฟล์พนักงาน
          </h1>
          <div
            style={{
              fontSize: 14,
              color: '#3b82f6',
              marginTop: 6,
            }}
          >
            ตรวจสอบและจัดการข้อมูลบัญชีของพนักงานในระบบ
          </div>
        </div>

        {/* Profile Card */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '18px',
            padding: '26px 28px 30px 28px',
            boxShadow: '0 16px 40px rgba(15,23,42,0.16)',
            marginBottom: '20px',
          }}
        >
          {/* Avatar + summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '28px',
              paddingBottom: '24px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '999px',
                background:
                  'radial-gradient(circle at 30% 15%, #ffffff 0%, #bae6fd 25%, #38bdf8 55%, #1d4ed8 98%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0b1120',
                fontSize: '40px',
                fontWeight: '800',
                boxShadow: '0 14px 30px rgba(15,23,42,0.35)',
                border: '3px solid rgba(255,255,255,0.95)',
              }}
            >
              {(photoPreview || photoURL) ? (
                <img
                  src={photoPreview || photoURL}
                  alt="avatar"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 'inherit',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                (displayName || email || 'S')[0].toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '24px',
                  color: '#111827',
                  fontWeight: 700,
                }}
              >
                {displayName || 'ไม่ระบุชื่อ'}
              </h2>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#6b7280',
                }}
              >
                {email || '-'}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 15px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: roleInfo.color,
                    backgroundColor: roleInfo.bg,
                  }}
                >
                  {roleInfo.label}
                </span>
                {createdAt && (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                    }}
                  >
                    สร้างบัญชีเมื่อ {formatDate(createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Information Display / Edit */}
          {!isEditing ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  ตรวจสอบข้อมูลส่วนตัวก่อนทำการแก้ไข หากข้อมูลไม่ถูกต้องสามารถกดปุ่ม
                  "แก้ไขข้อมูล" ที่มุมขวาได้ทันที
                </div>
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

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(260px, 0.95fr) minmax(320px, 1.1fr)',
                  gap: '22px',
                }}
              >
                {/* Left: account info */}
                <div
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: 14,
                    padding: '16px 18px 18px 18px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#4b5563',
                      marginBottom: 10,
                    }}
                  >
                    ข้อมูลบัญชี
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* อีเมล */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        📧
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 2, fontWeight: 500 }}>อีเมล</div>
                        <div style={{ fontSize: 14, color: '#1e40af', fontWeight: 600 }}>{email || '-'}</div>
                      </div>
                    </div>

                    {/* Role */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        🛡️
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 2, fontWeight: 500 }}>สิทธิ์การใช้งาน</div>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            color: roleInfo.color,
                            backgroundColor: roleInfo.bg,
                          }}
                        >
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* วันที่สร้างบัญชี */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        📅
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 2, fontWeight: 500 }}>วันที่สร้างบัญชี</div>
                        <div style={{ fontSize: 14, color: '#1e40af', fontWeight: 600 }}>{formatDate(createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: contact info */}
                <div
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: 14,
                    padding: '16px 18px 18px 18px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#4b5563',
                      marginBottom: 10,
                    }}
                  >
                    ข้อมูลติดต่อ
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    {/* เบอร์โทรศัพท์ */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        📱
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 2, fontWeight: 500 }}>เบอร์โทรศัพท์</div>
                        <div style={{ fontSize: 14, color: '#1e40af', fontWeight: 600 }}>{phone || '-'}</div>
                      </div>
                    </div>

                    {/* ที่อยู่ */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 14px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        📍
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 2, fontWeight: 500 }}>ที่อยู่</div>
                        <div style={{ fontSize: 14, color: '#1e40af', fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{address || '-'}</div>
                      </div>
                    </div>
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
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#4b5563',
                  }}
                >
                  {(photoPreview || photoURL) ? (
                    <img
                      src={photoPreview || photoURL}
                      alt="preview-avatar"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    (displayName || email || 'S')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <label
                    htmlFor="profileImage"
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    รูปโปรไฟล์
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label
                      htmlFor="profileImage"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 16px',
                        borderRadius: 999,
                        border: '1px solid #2563eb',
                        background:
                          uploadingPhoto || saving
                            ? '#9ca3af'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
                        color: '#eff6ff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: uploadingPhoto || saving ? 'not-allowed' : 'pointer',
                        boxShadow:
                          uploadingPhoto || saving
                            ? 'none'
                            : '0 6px 14px rgba(37,99,235,0.45)',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {uploadingPhoto ? 'กำลังเลือกรูป...' : 'เลือกไฟล์รูปภาพ'}
                    </label>
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      disabled={uploadingPhoto || saving}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        setUploadError('');
                        if (!file || !user) return;
                        try {
                          setUploadingPhoto(true);
                          const path = `profile/${user.uid}_${Date.now()}_${file.name}`;
                          const ref = storageRef(storage, path);
                          await uploadBytes(ref, file);
                          const url = await getDownloadURL(ref);
                          setPhotoPreview(url);
                          setPhotoURL(url);
                        } catch (err) {
                          console.error('Error uploading profile image:', err);
                          setUploadError('อัพโหลดรูปโปรไฟล์ล้มเหลว');
                        } finally {
                          setUploadingPhoto(false);
                        }
                      }}
                      style={{
                        display: 'none',
                      }}
                    />
                  </div>
                  {uploadingPhoto && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                      กำลังอัพโหลดรูปโปรไฟล์...
                    </div>
                  )}
                  {uploadError && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c' }}>
                      {uploadError}
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(260px, 0.9fr) minmax(320px, 1.1fr)',
                gap: '22px',
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
                      border: '2px solid #d1d5db',
                      borderRadius: '10px',
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
