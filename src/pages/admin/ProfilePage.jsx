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
      
      // Load additional data from Firestore
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
      // Update Firebase Auth profile
      if (editForm.displayName.trim() !== displayName) {
        await updateProfile(auth.currentUser, {
          displayName: editForm.displayName.trim()
        });
      }
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editForm.displayName.trim() || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        updatedAt: new Date()
      });
      
      // Update local state
      setDisplayName(editForm.displayName.trim());
      setPhone(editForm.phone.trim());
      setAddress(editForm.address.trim());
      
      setSuccess('อัพเดตข้อมูลโปรไฟล์สำเร็จ!');
      setIsEditing(false);
      
      // Reload after 1.5 seconds
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
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
              โปรไฟล์ของฉัน
            </h1>
            <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
              จัดการข้อมูลส่วนตัวของคุณ
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEditClick}
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#667eea',
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <span>✏️</span>
              <span>แก้ไขข้อมูล</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '30px'
      }}>
        {/* Avatar Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '40px',
          paddingBottom: '40px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            position: 'relative'
          }}>
            {(displayName || email || 'A')[0].toUpperCase()}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '28px', color: '#333', fontWeight: '700' }}>
              {displayName || 'ไม่ระบุชื่อ'}
            </h2>
            <div style={{
              display: 'inline-block',
              padding: '8px 20px',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: '600',
              color: roleInfo.color,
              backgroundColor: roleInfo.bg,
              border: `2px solid ${roleInfo.color}30`
            }}>
              {roleInfo.label}
            </div>
          </div>
        </div>

        {/* Information Display */}
        {!isEditing ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  📧
                </div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  อีเมล
                </label>
              </div>
              <div style={{
                fontSize: '16px',
                color: '#333',
                fontWeight: '500',
                wordBreak: 'break-word'
              }}>
                {email || '-'}
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  📱
                </div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  เบอร์โทรศัพท์
                </label>
              </div>
              <div style={{
                fontSize: '16px',
                color: '#333',
                fontWeight: '500'
              }}>
                {phone || '-'}
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              gridColumn: '1 / -1',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FF9800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  📍
                </div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ที่อยู่
                </label>
              </div>
              <div style={{
                fontSize: '16px',
                color: '#333',
                fontWeight: '500',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {address || '-'}
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#2196F3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  📅
                </div>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  วันที่สร้างบัญชี
                </label>
              </div>
              <div style={{
                fontSize: '16px',
                color: '#333',
                fontWeight: '500'
              }}>
                {formatDate(createdAt)}
              </div>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <div>
            {error && (
              <div style={{
                padding: '16px 20px',
                backgroundColor: '#ffebee',
                border: '2px solid #f44336',
                borderRadius: '12px',
                color: '#c62828',
                fontSize: '14px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                padding: '16px 20px',
                backgroundColor: '#e8f5e9',
                border: '2px solid #4CAF50',
                borderRadius: '12px',
                color: '#2e7d32',
                fontSize: '14px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>✓</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '30px'
              }}>
                <div>
                  <label htmlFor="editDisplayName" style={{
                    display: 'block',
                    marginBottom: '10px',
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
                      padding: '14px 18px',
                      fontSize: '15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="editPhone" style={{
                    display: 'block',
                    marginBottom: '10px',
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
                      padding: '14px 18px',
                      fontSize: '15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="editAddress" style={{
                    display: 'block',
                    marginBottom: '10px',
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
                      padding: '14px 18px',
                      fontSize: '15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      backgroundColor: '#fff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
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
                    padding: '14px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#666',
                    backgroundColor: '#f5f5f5',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = '#e0e0e0';
                      e.target.style.borderColor = '#ccc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = '#f5f5f5';
                      e.target.style.borderColor = '#e0e0e0';
                    }
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '14px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#fff',
                    backgroundColor: saving ? '#ccc' : '#667eea',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: saving ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = '#5568d3';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.target.style.backgroundColor = '#667eea';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }
                  }}
                >
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #fff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        display: 'inline-block'
                      }}></span>
                      กำลังบันทึก...
                    </span>
                  ) : (
                    'บันทึกการเปลี่ยนแปลง'
                  )}
                </button>
              </div>
            </form>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>

      {/* Account Info Card */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          color: '#333',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>🔐</span>
          <span>ข้อมูลบัญชี</span>
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>User ID</div>
            <div style={{
              fontSize: '13px',
              color: '#333',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              padding: '8px',
              backgroundColor: '#fff',
              borderRadius: '6px'
            }}>
              {user?.uid || '-'}
            </div>
          </div>
          <div style={{
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>Provider</div>
            <div style={{
              fontSize: '14px',
              color: '#333',
              padding: '8px',
              backgroundColor: '#fff',
              borderRadius: '6px'
            }}>
              Email/Password
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
