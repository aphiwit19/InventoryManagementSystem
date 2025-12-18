// Orders service layer
import { db, collection, doc, Timestamp, runTransaction, collectionGroup, getDocs, query, orderBy, getDoc, updateDoc } from '../repositories/firestore';
import { markSerialItemsSoldForOrder } from './serials.service';

export async function createWithdrawal(payload) {
  try {
    const method = (payload.deliveryMethod || 'shipping');
    
    // Generate running order number
    const counterRef = doc(db, 'counters', 'orderNumber');
    let orderNumber = '';
    
    await runTransaction(db, async (tx) => {
      const counterDoc = await tx.get(counterRef);
      let currentNumber = 1;
      
      if (counterDoc.exists()) {
        currentNumber = (counterDoc.data().current || 0) + 1;
        tx.update(counterRef, { current: currentNumber });
      } else {
        tx.set(counterRef, { current: currentNumber });
      }
      
      // Format: ORD-YYYYMMDD-0001
      const today = new Date();
      const dateStr = today.getFullYear().toString() + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0');
      orderNumber = `ORD-${dateStr}-${currentNumber.toString().padStart(4, '0')}`;
    });
    
    const withdrawDoc = {
      orderNumber: orderNumber, // เพิ่ม order number
      items: (payload.items || []).map(it => ({
        productId: it.productId,
        productName: it.productName || null,
        price: parseFloat(it.price || 0),
        quantity: parseInt(it.quantity || 0),
        subtotal: parseFloat(it.subtotal || 0),
        variantSize: it.variantSize || null,
        variantColor: it.variantColor || null,
        selectedOptions:
          it.selectedOptions && typeof it.selectedOptions === 'object' ? it.selectedOptions : null,
      })),
      requestedBy: payload.requestedBy || null,
      requestedAddress: payload.requestedAddress || '',
      receivedBy: payload.receivedBy || null,
      receivedAddress: payload.receivedAddress || '',
      note: payload.note || '',
      withdrawDate: Timestamp.now(),
      total: parseFloat(payload.total || 0),
      shippingCarrier: payload.shippingCarrier || null,
      trackingNumber: payload.trackingNumber || '',
      shippingStatus: payload.shippingStatus || 'รอดำเนินการ',
      deliveryMethod: method,
      paymentMethod: payload.paymentMethod || null,
      paymentAccount: payload.paymentAccount || null,
      paymentSlipUrl: payload.paymentSlipUrl || null,
      createdAt: Timestamp.now(),
      createdByUid: payload.createdByUid || null,
      createdByEmail: payload.createdByEmail || null,
      createdSource: payload.createdSource || null,
    };

    if (!withdrawDoc.createdByUid) throw new Error('ไม่พบ UID ของผู้สร้างคำสั่ง');
    const userOrdersCol = collection(db, 'users', withdrawDoc.createdByUid, 'orders');
    const newWithdrawRef = doc(userOrdersCol);

    await runTransaction(db, async (tx) => {
      const items = withdrawDoc.items || [];

      // รวมจำนวนตาม productId และเตรียมข้อมูลสำหรับอัปเดต variant
      const productMap = new Map();
      for (const it of items) {
        const pid = it.productId;
        const qtyReq = parseInt(it.quantity || 0);
        if (!pid) throw new Error('ไม่พบรหัสสินค้าในบางรายการ');
        if (qtyReq <= 0) throw new Error('จำนวนที่สั่งไม่ถูกต้อง');

        if (!productMap.has(pid)) {
          const pRef = doc(db, 'products', pid);
          const pSnap = await tx.get(pRef);
          if (!pSnap.exists()) throw new Error('ไม่พบสินค้า');
          const data = pSnap.data();
          productMap.set(pid, {
            pRef,
            qty: parseInt(data.quantity || 0),
            reserved: parseInt(data.reserved || 0),
            staffReserved: parseInt(data.staffReserved || 0),
            costPrice: parseFloat(data.costPrice || 0),
            variants: data.variants || [],
            totalReq: 0,
            variantUpdates: [],
          });
        }

        const prod = productMap.get(pid);
        prod.totalReq += qtyReq;
        prod.variantUpdates.push({
          variantSize: it.variantSize || null,
          variantColor: it.variantColor || null,
          used: qtyReq,
        });
      }

      // ตรวจสต๊อกและจองสต๊อกทั้งระดับสินค้าและ variant
      for (const [, s] of productMap) {
        const availableForStaff = s.qty - s.reserved - s.staffReserved;

        if (method === 'pickup' && (withdrawDoc.createdSource || '') === 'staff') {
          if (availableForStaff < s.totalReq) throw new Error('สต๊อกไม่พอสำหรับบางรายการ');
        } else if (method !== 'pickup') {
          const available = s.qty - s.reserved;
          if (available < s.totalReq) throw new Error('สต๊อกไม่พอสำหรับบางรายการ');
        }

        let updatedVariants = [...s.variants];
        if (updatedVariants.length > 0) {
          for (const vu of s.variantUpdates) {
            if (!vu.variantSize && !vu.variantColor) continue;
            updatedVariants = updatedVariants.map(v => {
              const sizeMatch = !vu.variantSize || v.size === vu.variantSize;
              const colorMatch = !vu.variantColor || v.color === vu.variantColor;
              if (!sizeMatch || !colorMatch) return v;

              if (method === 'pickup' && (withdrawDoc.createdSource || '') === 'staff') {
                const currentStaffReserved = parseInt(v.staffReserved || 0);
                return { ...v, staffReserved: currentStaffReserved + vu.used };
              }

              const currentReserved = parseInt(v.reserved || 0);
              return { ...v, reserved: currentReserved + vu.used };
            });
          }
        }

        if (method === 'pickup' && (withdrawDoc.createdSource || '') === 'staff') {
          const nextStaffReserved = (s.staffReserved || 0) + s.totalReq;
          tx.update(s.pRef, {
            staffReserved: nextStaffReserved,
            variants: updatedVariants,
            updatedAt: Timestamp.now(),
          });
        } else if (method !== 'pickup') {
          const nextReserved = (s.reserved || 0) + s.totalReq;
          tx.update(s.pRef, {
            reserved: nextReserved,
            variants: updatedVariants,
            updatedAt: Timestamp.now(),
          });
        }
      }

      tx.set(newWithdrawRef, withdrawDoc);
    });

    return newWithdrawRef.id;
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    throw error;
  }
}

export async function getAllWithdrawals() {
  try {
    const q = query(collectionGroup(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting withdrawals:', error);
    throw error;
  }
}

export async function getWithdrawalsByUser(uid) {
  try {
    const userOrdersRef = collection(db, 'users', uid, 'orders');
    const qUser = query(userOrdersRef, orderBy('createdAt', 'desc'));
    const subSnap = await getDocs(qUser);
    return subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting user withdrawals:', error);
    throw error;
  }
}

export async function updateWithdrawalShipping(withdrawalId, updates, createdByUid) {
  try {
    if (!createdByUid) throw new Error('ต้องระบุ UID ของเจ้าของคำสั่งซื้อ');
    const ref = doc(db, 'users', createdByUid, 'orders', withdrawalId);
    const curr = await getDoc(ref);
    if (!curr.exists()) throw new Error('ไม่พบคำสั่งซื้อ');
    const currentData = curr.data();

    const isPickup = (currentData.deliveryMethod || 'shipping') === 'pickup';
    const isNewShippingProgressStatus =
      (updates.shippingStatus === 'กำลังดำเนินการส่ง' || updates.shippingStatus === 'ส่งสำเร็จ');

    const shouldMarkSerialSoldOnComplete =
      (isPickup && updates.shippingStatus === 'รับของแล้ว' && currentData.shippingStatus !== 'รับของแล้ว') ||
      (!isPickup && updates.shippingStatus === 'ส่งสำเร็จ' && currentData.shippingStatus !== 'ส่งสำเร็จ');

    const markSerialSoldForSerializedElectronics = async () => {
      if (!shouldMarkSerialSoldOnComplete) return;

      const items = currentData.items || [];
      const productIds = Array.from(new Set(items.map((it) => it.productId).filter(Boolean)));
      if (productIds.length === 0) return;

      await Promise.all(
        productIds.map((pid) =>
          markSerialItemsSoldForOrder(pid, withdrawalId, Timestamp.now())
        )
      );
    };

    if (isPickup && updates.shippingStatus === 'รับของแล้ว' && currentData.shippingStatus !== 'รับของแล้ว') {
      await runTransaction(db, async (tx) => {
        const items = currentData.items || [];
        
        // รวม items ที่มี productId เดียวกัน
        const productMap = new Map();
        for (const it of items) {
          const pid = it.productId;
          if (!productMap.has(pid)) {
            const pRef = doc(db, 'products', pid);
            const pSnap = await tx.get(pRef);
            if (!pSnap.exists()) continue;
            const pData = pSnap.data();
            productMap.set(pid, {
              pRef,
              qty: parseInt(pData.quantity || 0),
              staffReserved: parseInt(pData.staffReserved || 0),
              costPrice: parseFloat(pData.costPrice || 0),
              variants: pData.variants || [],
              totalUsed: 0,
              variantUpdates: [], // เก็บรายการ variant ที่ต้องตัด
            });
          }
          const prod = productMap.get(pid);
          prod.totalUsed += parseInt(it.quantity || 0);
          prod.variantUpdates.push({
            variantSize: it.variantSize || null,
            variantColor: it.variantColor || null,
            used: parseInt(it.quantity || 0),
          });
        }

        // ตัดสต๊อกแต่ละ product
        for (const [, s] of productMap) {
          const nextStaffReserved = Math.max(0, (s.staffReserved || 0) - s.totalUsed);
          const nextQty = Math.max(0, s.qty - s.totalUsed);
          
          // ตัดสต๊อกระดับ variant
          let updatedVariants = [...s.variants];
          for (const vu of s.variantUpdates) {
            if (updatedVariants.length > 0 && (vu.variantSize || vu.variantColor)) {
              updatedVariants = updatedVariants.map(v => {
                const sizeMatch = !vu.variantSize || v.size === vu.variantSize;
                const colorMatch = !vu.variantColor || v.color === vu.variantColor;
                if (sizeMatch && colorMatch) {
                  return { ...v, quantity: Math.max(0, (v.quantity || 0) - vu.used) };
                }
                return v;
              });
            }
          }
          
          tx.update(s.pRef, { 
            staffReserved: nextStaffReserved, 
            quantity: nextQty, 
            variants: updatedVariants,
            updatedAt: Timestamp.now() 
          });
          
          // บันทึก history แต่ละ variant
          const outSource = currentData.createdSource === 'customer' ? 'order_customer_pickup' : 'order_staff_pickup';
          for (const vu of s.variantUpdates) {
            const productHistoryCol = collection(s.pRef, 'inventory_history');
            const histRef = doc(productHistoryCol);
            tx.set(histRef, {
              date: Timestamp.now(),
              costPrice: s.costPrice ?? null,
              quantity: vu.used,
              type: 'out',
              source: outSource,
              orderId: withdrawalId,
              actorUid: createdByUid,
              variantSize: vu.variantSize,
              variantColor: vu.variantColor,
              createdAt: Timestamp.now(),
            });
          }
        }

        tx.update(ref, {
          ...(updates.shippingCarrier !== undefined ? { shippingCarrier: updates.shippingCarrier } : {}),
          ...(updates.trackingNumber !== undefined ? { trackingNumber: updates.trackingNumber } : {}),
          shippingStatus: 'รับของแล้ว',
          updatedAt: Timestamp.now(),
        });
      });

      await markSerialSoldForSerializedElectronics();
      return;
    }

    if (!isPickup &&
        isNewShippingProgressStatus &&
        currentData.shippingStatus === 'รอดำเนินการ') {
      await runTransaction(db, async (tx) => {
        const items = currentData.items || [];
        
        // รวม items ที่มี productId เดียวกัน
        const productMap = new Map();
        for (const it of items) {
          const pid = it.productId;
          if (!productMap.has(pid)) {
            const pRef = doc(db, 'products', pid);
            const pSnap = await tx.get(pRef);
            if (!pSnap.exists()) continue;
            const pData = pSnap.data();
            productMap.set(pid, {
              pRef,
              qty: parseInt(pData.quantity || 0),
              reserved: parseInt(pData.reserved || 0),
              costPrice: parseFloat(pData.costPrice || 0),
              variants: pData.variants || [],
              totalUsed: 0,
              variantUpdates: [],
            });
          }
          const prod = productMap.get(pid);
          prod.totalUsed += parseInt(it.quantity || 0);
          prod.variantUpdates.push({
            variantSize: it.variantSize || null,
            variantColor: it.variantColor || null,
            used: parseInt(it.quantity || 0),
          });
        }

        // ตัดสต๊อกแต่ละ product
        for (const [, s] of productMap) {
          const nextReserved = Math.max(0, s.reserved - s.totalUsed);
          const nextQty = Math.max(0, s.qty - s.totalUsed);
          
          // ตัดสต๊อกระดับ variant
          let updatedVariants = [...s.variants];
          for (const vu of s.variantUpdates) {
            if (updatedVariants.length > 0 && (vu.variantSize || vu.variantColor)) {
              updatedVariants = updatedVariants.map(v => {
                const sizeMatch = !vu.variantSize || v.size === vu.variantSize;
                const colorMatch = !vu.variantColor || v.color === vu.variantColor;
                if (sizeMatch && colorMatch) {
                  return { ...v, quantity: Math.max(0, (v.quantity || 0) - vu.used) };
                }
                return v;
              });
            }
          }
          
          tx.update(s.pRef, { 
            reserved: nextReserved, 
            quantity: nextQty, 
            variants: updatedVariants,
            updatedAt: Timestamp.now() 
          });
          
          // บันทึก history แต่ละ variant
          const outSource = currentData.createdSource === 'customer' ? 'order_customer_ship_success' : 'order_staff_ship_success';
          for (const vu of s.variantUpdates) {
            const productHistoryCol = collection(s.pRef, 'inventory_history');
            const histRef = doc(productHistoryCol);
            tx.set(histRef, {
              date: Timestamp.now(),
              costPrice: s.costPrice ?? null,
              quantity: vu.used,
              type: 'out',
              source: outSource,
              orderId: withdrawalId,
              actorUid: createdByUid,
              variantSize: vu.variantSize,
              variantColor: vu.variantColor,
              createdAt: Timestamp.now(),
            });
          }
        }
        
        tx.update(ref, {
          ...(updates.shippingCarrier !== undefined ? { shippingCarrier: updates.shippingCarrier } : {}),
          ...(updates.trackingNumber !== undefined ? { trackingNumber: updates.trackingNumber } : {}),
          ...(updates.shippingStatus !== undefined ? { shippingStatus: updates.shippingStatus } : {}),
          updatedAt: Timestamp.now(),
        });
      });

      await markSerialSoldForSerializedElectronics();
      return;
    }

    await updateDoc(ref, {
      ...(updates.shippingCarrier !== undefined ? { shippingCarrier: updates.shippingCarrier } : {}),
      ...(updates.trackingNumber !== undefined ? { trackingNumber: updates.trackingNumber } : {}),
      ...(updates.shippingStatus !== undefined ? { shippingStatus: updates.shippingStatus } : {}),
      updatedAt: Timestamp.now(),
    });

    await markSerialSoldForSerializedElectronics();
  } catch (error) {
    console.error('Error updating withdrawal shipping:', error);
    throw error;
  }
}
