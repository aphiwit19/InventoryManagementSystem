import { collection, doc, getDocs, orderBy, query, updateDoc, getDoc as getDocRef } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * ดึงข้อมูลผู้ใช้ทั้งหมด
 * @returns {Promise<Array>} - Array ของผู้ใช้ทั้งหมด
 */
export async function getAllUsers() {
  try {
    const q = query(collection(db, 'users'), orderBy('email'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

/**
 * อัพเดต role ของผู้ใช้
 * @param {string} userId - ID ของผู้ใช้
 * @param {string} role - role ใหม่ (admin, staff, customer)
 * @returns {Promise<void>}
 */
export async function updateUserRole(userId, role) {
  try {
    await updateDoc(doc(db, 'users', userId), { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * ดึงข้อมูลผู้ใช้ตาม ID
 * @param {string} userId - ID ของผู้ใช้
 * @returns {Promise<Object>} - ข้อมูลผู้ใช้
 */
export async function getUserById(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDocRef(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    throw new Error('User not found');
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

