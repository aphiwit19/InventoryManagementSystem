import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
  orderBy,
  setDoc,
  Timestamp,
} from '../repositories/firestore';

function normalizeSerial(raw) {
  return String(raw || '').trim().toUpperCase();
}

export async function listSerialItems(productId, { status } = {}) {
  if (!productId) throw new Error('productId is required');

  const productRef = doc(db, 'products', productId);
  const serialsCol = collection(productRef, 'serialItems');

  let q;
  if (status) {
    q = query(serialsCol, where('status', '==', status), orderBy('createdAt', 'desc'));
  } else {
    q = query(serialsCol, orderBy('createdAt', 'desc'));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function bulkImportSerialItems(
  productId,
  rawSerials,
  {
    costPrice = null,
    variantKey = null,
  } = {}
) {
  if (!productId) throw new Error('productId is required');

  const serials = Array.isArray(rawSerials)
    ? rawSerials.map(normalizeSerial).filter(Boolean)
    : String(rawSerials || '')
        .split(/\r?\n/)
        .map(normalizeSerial)
        .filter(Boolean);

  if (serials.length === 0) {
    return { created: 0, skippedExisting: 0, duplicatesInInput: 0 };
  }

  const seen = new Set();
  let duplicatesInInput = 0;
  const uniqSerials = [];

  for (const s of serials) {
    if (seen.has(s)) {
      duplicatesInInput += 1;
      continue;
    }
    seen.add(s);
    uniqSerials.push(s);
  }

  const productRef = doc(db, 'products', productId);

  const checks = await Promise.all(
    uniqSerials.map(async (serial) => {
      const ref = doc(collection(productRef, 'serialItems'), serial);
      const snap = await getDoc(ref);
      return { serial, ref, exists: snap.exists() };
    })
  );

  const now = Timestamp.now();
  let created = 0;
  let skippedExisting = 0;

  await Promise.all(
    checks.map(async ({ serial, ref, exists }) => {
      if (exists) {
        skippedExisting += 1;
        return;
      }

      const payload = {
        serial,
        status: 'available',
        variantKey: variantKey || null,
        costPrice: costPrice === null || costPrice === undefined ? null : parseFloat(costPrice),
        order: {
          orderId: null,
          reservedAt: null,
          soldAt: null,
        },
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(ref, payload);
      created += 1;
    })
  );

  return { created, skippedExisting, duplicatesInInput };
}

export async function listSerialItemsByOrder(productId, orderId) {
  if (!productId) throw new Error('productId is required');
  if (!orderId) throw new Error('orderId is required');

  const productRef = doc(db, 'products', productId);
  const serialsCol = collection(productRef, 'serialItems');
  const q = query(serialsCol, where('order.orderId', '==', orderId), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function reserveSerialItemsForOrder(productId, orderId, rawSerials) {
  if (!productId) throw new Error('productId is required');
  if (!orderId) throw new Error('orderId is required');

  const serials = Array.isArray(rawSerials)
    ? rawSerials.map(normalizeSerial).filter(Boolean)
    : String(rawSerials || '')
        .split(/\r?\n/)
        .map(normalizeSerial)
        .filter(Boolean);

  if (serials.length === 0) throw new Error('No serials provided');

  const uniq = [];
  const seen = new Set();
  for (const s of serials) {
    if (seen.has(s)) continue;
    seen.add(s);
    uniq.push(s);
  }

  const productRef = doc(db, 'products', productId);
  const now = Timestamp.now();

  await runTransaction(db, async (tx) => {
    for (const serial of uniq) {
      const ref = doc(collection(productRef, 'serialItems'), serial);
      const snap = await tx.get(ref);

      if (!snap.exists()) throw new Error(`Serial not found: ${serial}`);

      const data = snap.data() || {};
      const status = data.status || 'available';
      const currentOrderId = data.order?.orderId || null;

      if (status !== 'available' || currentOrderId) {
        throw new Error(`Serial not available: ${serial}`);
      }

      tx.update(ref, {
        status: 'reserved',
        order: {
          ...(data.order || {}),
          orderId,
          reservedAt: now,
        },
        updatedAt: now,
      });
    }
  });

  return { reserved: uniq.length };
}

export async function markSerialItemsSoldForOrder(productId, orderId, deliveredAt = null) {
  if (!productId) throw new Error('productId is required');
  if (!orderId) throw new Error('orderId is required');

  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);
  if (!productSnap.exists()) return { updated: 0, skipped: 0 };

  const product = productSnap.data() || {};
  if (product.categoryId !== 'electronics' || (product.inventoryMode || 'bulk') !== 'serialized') {
    return { updated: 0, skipped: 0 };
  }

  const serialsCol = collection(productRef, 'serialItems');
  const q = query(serialsCol, where('order.orderId', '==', orderId));
  const snap = await getDocs(q);

  const deliverDate = deliveredAt
    ? (deliveredAt.toDate
        ? deliveredAt.toDate()
        : (deliveredAt instanceof Date ? deliveredAt : new Date(deliveredAt)))
    : new Date();
  const deliverTs = Timestamp.fromDate(deliverDate);

  let updated = 0;
  let skipped = 0;

  await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() || {};
      const status = data.status || '';

      if (status !== 'reserved' && status !== 'available') {
        skipped += 1;
        return;
      }

      await updateDoc(d.ref, {
        status: 'sold',
        order: {
          ...(data.order || {}),
          orderId,
          soldAt: deliverTs,
        },
        updatedAt: Timestamp.now(),
      });

      updated += 1;
    })
  );

  return { updated, skipped };
}
