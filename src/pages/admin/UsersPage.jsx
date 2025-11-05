import { useEffect, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      const q = query(collection(db, 'users'), orderBy('email'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    run();
  }, []);

  const updateRole = async (id, role) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', id), { role });
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, role } : u)));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h3>Manage Users</h3>
      <p>Note: Staff (ผู้เบิกสินค้า) ให้ผู้ใช้สมัครก่อน แล้วแอดมินเปลี่ยน role เป็น staff ที่นี่</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Email</th>
            <th style={{ textAlign: 'left' }}>Role</th>
            <th style={{ textAlign: 'left' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role || 'customer'}</td>
              <td>
                <select defaultValue={u.role || 'customer'} onChange={(e) => updateRole(u.id, e.target.value)} disabled={saving}>
                  <option value="admin">admin</option>
                  <option value="staff">staff</option>
                  <option value="customer">customer</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


