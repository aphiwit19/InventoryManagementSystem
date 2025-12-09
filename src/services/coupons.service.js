// Coupons service layer
import { db, collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, Timestamp, query, where } from '../repositories/firestore';

/**
 * สร้างคูปองใหม่
 */
export async function createCoupon(couponData) {
  try {
    const couponsRef = collection(db, 'coupons');
    const newCoupon = {
      code: (couponData.code || '').toUpperCase().trim(),
      type: couponData.type || 'fixed', // fixed | percentage
      value: parseFloat(couponData.value || 0),
      minPurchase: parseFloat(couponData.minPurchase || 0),
      maxDiscount: parseFloat(couponData.maxDiscount || 0),
      startDate: couponData.startDate ? Timestamp.fromDate(new Date(couponData.startDate)) : Timestamp.now(),
      endDate: couponData.endDate ? Timestamp.fromDate(new Date(couponData.endDate)) : null,
      usageLimit: parseInt(couponData.usageLimit || 0),
      usedCount: 0,
      active: couponData.active !== false,
      description: couponData.description || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (!newCoupon.code) {
      throw new Error('กรุณากรอกรหัสคูปอง');
    }

    // ตรวจสอบว่ามีโค้ดซ้ำหรือไม่
    const existingQuery = query(couponsRef, where('code', '==', newCoupon.code));
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      throw new Error('รหัสคูปองนี้มีอยู่แล้ว');
    }

    const docRef = await addDoc(couponsRef, newCoupon);
    return { id: docRef.id, ...newCoupon };
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

/**
 * ดึงคูปองทั้งหมด
 */
export async function getAllCoupons() {
  try {
    const couponsRef = collection(db, 'coupons');
    const snapshot = await getDocs(couponsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting coupons:', error);
    throw error;
  }
}

/**
 * ดึงคูปองตาม ID
 */
export async function getCouponById(id) {
  try {
    const couponRef = doc(db, 'coupons', id);
    const snapshot = await getDoc(couponRef);
    if (!snapshot.exists()) {
      throw new Error('ไม่พบคูปอง');
    }
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error('Error getting coupon:', error);
    throw error;
  }
}

/**
 * ตรวจสอบและใช้คูปอง
 */
export async function validateAndUseCoupon(code, orderTotal) {
  try {
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('code', '==', code.toUpperCase().trim()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('ไม่พบรหัสคูปองนี้');
    }

    const couponDoc = snapshot.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() };

    // ตรวจสอบสถานะ
    if (!coupon.active) {
      throw new Error('คูปองนี้ถูกปิดการใช้งาน');
    }

    // ตรวจสอบวันที่
    const now = new Date();
    if (coupon.startDate && coupon.startDate.toDate() > now) {
      throw new Error('คูปองนี้ยังไม่เริ่มใช้งาน');
    }
    if (coupon.endDate && coupon.endDate.toDate() < now) {
      throw new Error('คูปองนี้หมดอายุแล้ว');
    }

    // ตรวจสอบจำนวนครั้งที่ใช้
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new Error('คูปองนี้ถูกใช้ครบจำนวนแล้ว');
    }

    // ตรวจสอบยอดซื้อขั้นต่ำ
    if (coupon.minPurchase > 0 && orderTotal < coupon.minPurchase) {
      throw new Error(`ยอดซื้อขั้นต่ำ ฿${coupon.minPurchase.toLocaleString()}`);
    }

    // คำนวณส่วนลด
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderTotal * coupon.value) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // ส่วนลดต้องไม่เกินยอดรวม
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    return {
      coupon,
      discountAmount,
      finalTotal: orderTotal - discountAmount,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    throw error;
  }
}

/**
 * เพิ่มจำนวนการใช้คูปอง
 */
export async function incrementCouponUsage(couponId) {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    const couponSnap = await getDoc(couponRef);
    
    if (!couponSnap.exists()) {
      throw new Error('ไม่พบคูปอง');
    }

    const currentUsed = couponSnap.data().usedCount || 0;
    await updateDoc(couponRef, {
      usedCount: currentUsed + 1,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
    throw error;
  }
}

/**
 * อัพเดทคูปอง
 */
export async function updateCoupon(id, updates) {
  try {
    const couponRef = doc(db, 'coupons', id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // แปลงวันที่เป็น Timestamp
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(new Date(updates.startDate));
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(new Date(updates.endDate));
    }

    await updateDoc(couponRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
}

/**
 * ลบคูปอง
 */
export async function deleteCoupon(id) {
  try {
    const couponRef = doc(db, 'coupons', id);
    await deleteDoc(couponRef);
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
}
