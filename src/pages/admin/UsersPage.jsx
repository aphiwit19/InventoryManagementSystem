import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { getAllUsers, updateUserRole } from '../../server/users';
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
        return { bg: '#f44336', color: '#fff', label: 'Admin' };
      case 'staff':
        return { bg: '#2196F3', color: '#fff', label: 'Staff' };
      case 'customer':
        return { bg: '#4CAF50', color: '#fff', label: 'Customer' };
      default:
        return { bg: '#9e9e9e', color: '#fff', label: 'Customer' };
    }
  };

  const isActiveLink = (path) => location.pathname === path;

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#fff',
        padding: '20px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <h2 style={{ marginBottom: '30px', color: '#333' }}>Admin Panel</h2>
        <Link
          to="/admin/dashboard"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isActiveLink('/admin/dashboard') ? '#4CAF50' : '#f0f0f0',
            color: isActiveLink('/admin/dashboard') ? 'white' : '#333',
            textDecoration: 'none',
            display: 'block',
            fontWeight: isActiveLink('/admin/dashboard') ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          Products
        </Link>
        <Link
          to="/admin/users"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isActiveLink('/admin/users') ? '#4CAF50' : '#f0f0f0',
            color: isActiveLink('/admin/users') ? 'white' : '#333',
            textDecoration: 'none',
            display: 'block',
            fontWeight: isActiveLink('/admin/users') ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          Manage User
        </Link>
        <Link
          to="/admin/addproduct"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            textDecoration: 'none',
            display: 'block'
          }}
        >
          Add Product
        </Link>
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button
            onClick={() => signOut(auth)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#333', fontWeight: '700' }}>
                จัดการผู้ใช้
              </h1>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                จัดการสิทธิ์และบทบาทของผู้ใช้ทั้งหมด
              </p>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              👥
            </div>
          </div>

          {/* Search and Filter */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
              <input
                type="text"
                placeholder="ค้นหาด้วยอีเมลหรือชื่อ"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 15px',
                  fontSize: '14px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              <span style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999',
                fontSize: '18px'
              }}>🔍</span>
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                padding: '12px 15px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: '#fff',
                minWidth: '150px'
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          {/* Info Note */}
          <div style={{
            marginTop: '15px',
            padding: '12px 16px',
            backgroundColor: '#e3f2fd',
            borderLeft: '4px solid #2196F3',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#1976d2'
          }}>
            <strong>หมายเหตุ:</strong> Staff (ผู้เบิกสินค้า) ให้ผู้ใช้สมัครก่อน แล้วแอดมินเปลี่ยน role เป็น staff ที่นี่
          </div>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {filteredUsers.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#999'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
              <p style={{ fontSize: '16px', margin: 0 }}>
                {searchTerm || filterRole !== 'all' ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '600px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ผู้ใช้
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      บทบาท
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      เปลี่ยนบทบาท
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, index) => {
                    const roleBadge = getRoleBadgeColor(u.role || 'customer');
                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: index < filteredUsers.length - 1 ? '1px solid #e0e0e0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              flexShrink: 0
                            }}>
                              {(u.displayName || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#333',
                                marginBottom: '4px'
                              }}>
                                {u.displayName || 'ไม่มีชื่อ'}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: '#666'
                              }}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color
                          }}>
                            {roleBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select
                            value={u.role || 'customer'}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value, u.role || 'customer')}
                            disabled={saving}
                            style={{
                              padding: '8px 12px',
                              fontSize: '14px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              outline: 'none',
                              cursor: saving ? 'not-allowed' : 'pointer',
                              backgroundColor: saving ? '#f5f5f5' : '#fff',
                              color: '#333',
                              transition: 'all 0.3s ease',
                              minWidth: '120px'
                            }}
                            onFocus={(e) => {
                              if (!saving) e.target.style.borderColor = '#667eea';
                            }}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                          >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="customer">Customer</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredUsers.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '15px 20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ color: '#666', fontSize: '14px' }}>
              แสดง <strong>{filteredUsers.length}</strong> จาก <strong>{users.length}</strong> ผู้ใช้
            </div>
            <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>
                Admin: <strong style={{ color: '#f44336' }}>
                  {users.filter(u => (u.role || 'customer') === 'admin').length}
                </strong>
              </span>
              <span style={{ color: '#666' }}>
                Staff: <strong style={{ color: '#2196F3' }}>
                  {users.filter(u => (u.role || 'customer') === 'staff').length}
                </strong>
              </span>
              <span style={{ color: '#666' }}>
                Customer: <strong style={{ color: '#4CAF50' }}>
                  {users.filter(u => (u.role || 'customer') === 'customer').length}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
