import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './UsersPage.module.css';

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const itemsPerPage = 10;

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

    if (searchTerm.trim()) {
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => (u.role || 'customer') === filterRole);
    }

    // Sort by createdAt based on sortOrder
    filtered = filtered.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || 0);
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterRole, users, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

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

  const handleRefresh = async () => {
    setLoading(true);
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

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return styles.roleBadgeAdmin;
      case 'staff':
        return styles.roleBadgeStaff;
      default:
        return styles.roleBadgeCustomer;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return 'security';
      case 'staff':
        return 'badge';
      default:
        return 'person';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'staff':
        return 'Staff';
      default:
        return 'Customer';
    }
  };

  const getAvatarClass = (role) => {
    switch (role) {
      case 'admin':
        return styles.userAvatarAdmin;
      case 'staff':
        return styles.userAvatarStaff;
      default:
        return styles.userAvatarCustomer;
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPageRange = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    let start = currentPage - 2;
    let end = currentPage + 2;
    if (start < 1) { start = 1; end = 5; }
    if (end > totalPages) { end = totalPages; start = totalPages - 4; }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.loadingState}>
            <div className={styles.loadingContent}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{t('user.user_management')}</h1>
            <p className={styles.pageSubtitle}>{t('user.manage_roles')}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchWrapper}>
              <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
              <input
                type="text"
                placeholder={t('user.search_users')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className={styles.selectInput}
              >
                <option value="all">{t('common.all_roles')}</option>
                <option value="admin">{t('user.role_admin')}</option>
                <option value="staff">{t('user.role_staff')}</option>
                <option value="customer">{t('user.role_customer')}</option>
              </select>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            <span className={styles.showingText}>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}
            </span>
            <div className={styles.divider}></div>
            <button className={styles.refreshButton} onClick={handleRefresh} title="Refresh">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>User</th>
                  <th className={styles.tableHeadCell}>Role</th>
                  <th className={`${styles.tableHeadCell} ${styles.sortableHeader}`} onClick={toggleSortOrder}>
                    Date
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', marginLeft: '0.25rem' }}>
                      {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                  </th>
                  <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.emptyState}>
                      {t('user.no_users')}
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => {
                    const currentRole = user.role || 'customer';
                    const canChangeRole = currentRole !== 'admin';
                    const isActive = user.lastLogin || true;

                    return (
                      <tr key={user.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <div className={styles.userCell}>
                            <div className={`${styles.userAvatar} ${getAvatarClass(currentRole)}`}>
                              {getInitials(user.displayName, user.email)}
                            </div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>{user.displayName || '-'}</span>
                              <span className={styles.userEmail}>{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={`${styles.roleBadge} ${getRoleBadgeClass(currentRole)}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
                              {getRoleIcon(currentRole)}
                            </span>
                            {getRoleLabel(currentRole)}
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.dateText}>
                            {user.createdAt 
                              ? new Date(user.createdAt.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString('th-TH')
                              : '-'}
                          </span>
                        </td>
                        <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                          <div className={styles.actionButtonsVisible}>
                            {canChangeRole ? (
                              <select
                                value={currentRole}
                                onChange={(e) => handleUpdateRole(user.id, e.target.value, currentRole)}
                                disabled={saving}
                                className={styles.roleSelect}
                              >
                                <option value="customer">Customer</option>
                                <option value="staff">Staff</option>
                              </select>
                            ) : (
                              <span className={styles.noEditBadge}>admin</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_left</span>
                Previous
              </button>
              <div className={styles.paginationNumbers}>
                {buildPageRange().map((page) => (
                  <button
                    key={page}
                    className={`${styles.paginationNumber} ${currentPage === page ? styles.paginationNumberActive : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className={styles.paginationEllipsis}>...</span>
                    <button
                      className={styles.paginationNumber}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
