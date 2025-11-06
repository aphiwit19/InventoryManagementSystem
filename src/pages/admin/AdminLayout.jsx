import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const AdminLayout = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const isActiveLink = (path) => {
    // Special handling for the dashboard route
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || 
             location.pathname.startsWith('/admin/products/');
    }
    return location.pathname === path;
  };

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
        gap: '10px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
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
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: isActiveLink('/admin/dashboard') ? 'bold' : 'normal'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isActiveLink('/admin/dashboard') ? 'white' : '#888'
          }} />
          <span>Products</span>
        </Link>
        <Link
          to="/admin/users"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isActiveLink('/admin/users') ? '#4CAF50' : '#f0f0f0',
            color: isActiveLink('/admin/users') ? 'white' : '#333',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: isActiveLink('/admin/users') ? 'bold' : 'normal'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isActiveLink('/admin/users') ? 'white' : '#888'
          }} />
          <span>Manage User</span>
        </Link>
        <Link
          to="/admin/addproduct"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isActiveLink('/admin/addproduct') ? '#4CAF50' : '#f0f0f0',
            color: isActiveLink('/admin/addproduct') ? 'white' : '#333',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: isActiveLink('/admin/addproduct') ? 'bold' : 'normal'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isActiveLink('/admin/addproduct') ? 'white' : '#888'
          }} />
          <span>Add Product</span>
        </Link>
        {/* Updated Logout Button */}
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
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;