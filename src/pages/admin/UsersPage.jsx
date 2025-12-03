import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { getAllUsers, updateUserRole } from '../../services';
import { Link, useLocation } from 'react-router-dom';

export default function UsersPage() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    const run = async () => {
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => (u.role || 'customer') === filterRole);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, users]);

  const handleUpdateRole = async (id, role, currentRole) => {
    if (role === currentRole) return;
    
    setSaving(true);
    try {
      await updateUserRole(id, role);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, role } : u)));
    } catch (error) {
      console.error('Error updating role:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดต Role: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', label: 'Admin', shadow: '0 2px 8px rgba(239,68,68,0.4)' };
      case 'staff':
        return { bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', label: 'Staff', shadow: '0 2px 8px rgba(37,99,235,0.4)' };
      case 'customer':
        return { bg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', label: 'Customer', shadow: '0 2px 8px rgba(34,197,94,0.4)' };
      default:
        return { bg: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', color: '#fff', label: 'Customer', shadow: '0 2px 8px rgba(100,116,139,0.4)' };
    }
  };

  const isActiveLink = (path) => location.pathname === path;

  if (loading) {
    return (
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <p style={{ color: '#666', fontSize: '16px' }}>กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '32px 24px',
        background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          padding: '20px 24px',
          borderRadius: 18,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1e40af', fontWeight: 700 }}>
            จัดการผู้ใช้
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#3b82f6', fontSize: 14 }}>
            จัดการสิทธิ์และบทบาทของผู้ใช้ทั้งหมด
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 40px 10px 16px',
                borderRadius: 999,
                border: '2px solid #e2e8f0',
                fontSize: 14,
                width: 240,
                background: '#fff',
                outline: 'none',
              }}
            />
            <span style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#3b82f6',
              fontSize: 16,
            }}>🔍</span>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: '2px solid #e2e8f0',
              fontSize: 14,
              backgroundColor: '#fff',
              color: '#1e40af',
              fontWeight: 500,
              outline: 'none',
            }}
          >
            <option value="all">ทุกบทบาท</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 18,
          boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr 1fr',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            fontWeight: 600,
            fontSize: 13,
            color: '#1e40af',
          }}
        >
          <div>อีเมล</div>
          <div>ชื่อ</div>
          <div>บทบาทปัจจุบัน</div>
          <div>เปลี่ยนบทบาท</div>
        </div>
        
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredUsers.map((user) => {
              const currentRole = user.role || 'customer';
              const roleInfo = getRoleBadgeColor(currentRole);
              
              return (
                <div
                  key={user.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr 1fr',
                    padding: '16px 20px',
                    borderBottom: '1px solid #eee',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: '14px', color: '#333' }}>
                    {user.email}
                  </div>
                  <div style={{ fontSize: '14px', color: '#333' }}>
                    {user.displayName || '-'}
                  </div>
                  <div>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      background: roleInfo.bg,
                      color: roleInfo.color,
                      fontWeight: 600,
                      boxShadow: roleInfo.shadow,
                      display: 'inline-block',
                    }}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <div>
                    <select
                      value={currentRole}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value, currentRole)}
                      disabled={saving}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: '2px solid #e2e8f0',
                        fontSize: 13,
                        fontWeight: 500,
                        backgroundColor: '#fff',
                        color: '#1e40af',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        outline: 'none',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                      }}
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
