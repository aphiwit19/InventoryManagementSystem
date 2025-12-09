// Users service layer
import { db, collection, getDocs, orderBy, query, updateDoc, doc, getDoc as getDocRef } from '../repositories/firestore';

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

export async function updateUserRole(userId, role) {
  try {
    await updateDoc(doc(db, 'users', userId), { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

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

export async function updateUserProfile(userId, profileData) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function ensureUserProfile(userId, email, displayName) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocRef(userRef);
    
    if (!userSnap.exists()) {
      // สร้างข้อมูลเริ่มต้นถ้ายังไม่มี
      const { setDoc } = await import('../repositories/firestore');
      await setDoc(userRef, {
        email: email || '',
        displayName: displayName || '',
        firstName: '',
        lastName: '',
        phone: '',
        birthDate: '',
        role: 'staff',
        addresses: [], // เพิ่ม array สำหรับเก็บที่อยู่
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Created new user profile for:', userId);
    }
    
    return await getUserById(userId);
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
}

// เพิ่มที่อยู่ใหม่
export async function addAddress(userId, address) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocRef(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const addresses = userData.addresses || [];
    
    // สร้าง ID ใหม่สำหรับที่อยู่
    const newAddress = {
      id: `addr_${Date.now()}`,
      ...address,
      createdAt: new Date(),
    };
    
    // ถ้าเป็นที่อยู่แรก หรือตั้งเป็น default ให้ยกเลิก default อื่นๆ
    if (addresses.length === 0 || address.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
      newAddress.isDefault = true;
    }
    
    addresses.push(newAddress);
    
    await updateDoc(userRef, {
      addresses,
      updatedAt: new Date(),
    });
    
    return newAddress;
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
}

// อัพเดทที่อยู่
export async function updateAddress(userId, addressId, updatedData) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocRef(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const addresses = userData.addresses || [];
    
    const addressIndex = addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) {
      throw new Error('Address not found');
    }
    
    // อัพเดทที่อยู่
    addresses[addressIndex] = {
      ...addresses[addressIndex],
      ...updatedData,
      updatedAt: new Date(),
    };
    
    await updateDoc(userRef, {
      addresses,
      updatedAt: new Date(),
    });
    
    return addresses[addressIndex];
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
}

// ลบที่อยู่
export async function deleteAddress(userId, addressId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocRef(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    let addresses = userData.addresses || [];
    
    // หาที่อยู่ที่จะลบ
    const addressToDelete = addresses.find(addr => addr.id === addressId);
    if (!addressToDelete) {
      throw new Error('Address not found');
    }
    
    // ลบที่อยู่
    addresses = addresses.filter(addr => addr.id !== addressId);
    
    // ถ้าลบที่อยู่ default และยังมีที่อยู่อื่นอยู่ ให้ตั้งที่อยู่แรกเป็น default
    if (addressToDelete.isDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
    }
    
    await updateDoc(userRef, {
      addresses,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
}

// ตั้งที่อยู่เป็น default
export async function setDefaultAddress(userId, addressId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocRef(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const addresses = userData.addresses || [];
    
    // ยกเลิก default ทั้งหมด
    addresses.forEach(addr => {
      addr.isDefault = addr.id === addressId;
    });
    
    await updateDoc(userRef, {
      addresses,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
}
