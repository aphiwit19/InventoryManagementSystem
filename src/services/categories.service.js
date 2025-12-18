import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  setDoc,
  updateDoc,
  Timestamp,
} from '../repositories/firestore';

export const DEFAULT_CATEGORY_SEED = [
  {
    id: 'electronics',
    name: { th: 'อุปกรณ์อิเล็กทรอนิกส์', en: 'Electronics' },
    active: true,
    sortOrder: 1,
    features: {
      specs: true,
      variants: false,
      serial: true,
      lot: false,
      stockMode: { allowBulkQty: true, allowSerialItems: true },
    },
    specKeys: [
      { key: 'brand', label: { th: 'แบรนด์', en: 'Brand' }, type: 'text' },
      { key: 'model', label: { th: 'รุ่น', en: 'Model' }, type: 'text' },
      { key: 'cpu', label: { th: 'CPU', en: 'CPU' }, type: 'text' },
      { key: 'ram', label: { th: 'RAM', en: 'RAM' }, type: 'text' },
      { key: 'storage', label: { th: 'Storage', en: 'Storage' }, type: 'text' },
    ],
  },
  {
    id: 'home_kitchen',
    name: { th: 'ของใช้ในบ้าน/ครัว', en: 'Home & Kitchen' },
    active: true,
    sortOrder: 2,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'material', label: { th: 'วัสดุ', en: 'Material' }, type: 'text' },
      { key: 'size', label: { th: 'ขนาด', en: 'Size' }, type: 'text' },
    ],
  },
  {
    id: 'fashion',
    name: { th: 'แฟชั่น', en: 'Fashion' },
    active: true,
    sortOrder: 3,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'material', label: { th: 'เนื้อผ้า', en: 'Material' }, type: 'text' },
    ],
  },
  {
    id: 'beauty_personal_care',
    name: { th: 'ความงาม/ดูแลตัวเอง', en: 'Beauty & Personal Care' },
    active: true,
    sortOrder: 4,
    features: { specs: true, variants: true, serial: false, lot: true },
    specKeys: [
      { key: 'usage', label: { th: 'วิธีใช้', en: 'How to use' }, type: 'text' },
      { key: 'warning', label: { th: 'คำเตือน', en: 'Warning' }, type: 'text' },
    ],
  },
  {
    id: 'food_beverage',
    name: { th: 'อาหาร/เครื่องดื่ม', en: 'Food & Beverage' },
    active: true,
    sortOrder: 5,
    features: { specs: true, variants: true, serial: false, lot: true },
    specKeys: [
      { key: 'ingredients', label: { th: 'ส่วนประกอบ', en: 'Ingredients' }, type: 'text' },
      { key: 'allergen', label: { th: 'สารก่อภูมิแพ้', en: 'Allergen' }, type: 'text' },
    ],
  },
  {
    id: 'office_stationery',
    name: { th: 'ออฟฟิศ/เครื่องเขียน', en: 'Office & Stationery' },
    active: true,
    sortOrder: 6,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'paperSize', label: { th: 'ขนาด', en: 'Size' }, type: 'text' },
    ],
  },
  {
    id: 'tools_hardware',
    name: { th: 'เครื่องมือ/ฮาร์ดแวร์', en: 'Tools & Hardware' },
    active: true,
    sortOrder: 7,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'power', label: { th: 'กำลัง/วัตต์', en: 'Power' }, type: 'text' },
      { key: 'standard', label: { th: 'มาตรฐาน', en: 'Standard' }, type: 'text' },
    ],
  },
  {
    id: 'automotive',
    name: { th: 'ยานยนต์', en: 'Automotive' },
    active: true,
    sortOrder: 8,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'compatible', label: { th: 'ใช้กับรุ่น', en: 'Compatible with' }, type: 'text' },
    ],
  },
  {
    id: 'sports_outdoor',
    name: { th: 'กีฬา/กลางแจ้ง', en: 'Sports & Outdoor' },
    active: true,
    sortOrder: 9,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'size', label: { th: 'ขนาด', en: 'Size' }, type: 'text' },
    ],
  },
  {
    id: 'toys_kids',
    name: { th: 'ของเล่น/เด็ก', en: 'Toys & Kids' },
    active: true,
    sortOrder: 10,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'ageRange', label: { th: 'อายุที่เหมาะสม', en: 'Age range' }, type: 'text' },
    ],
  },
];

export async function getAllCategories({ activeOnly = true } = {}) {
  const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (activeOnly) rows = rows.filter((c) => c.active !== false);
  return rows;
}

export async function getCategoryById(categoryId) {
  const ref = doc(db, 'categories', categoryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createOrReplaceCategory(categoryId, data) {
  const ref = doc(db, 'categories', categoryId);
  await setDoc(
    ref,
    {
      ...data,
      updatedAt: Timestamp.now(),
      createdAt: data?.createdAt ?? Timestamp.now(),
    },
    { merge: true }
  );
}

export async function updateCategory(categoryId, partial) {
  const ref = doc(db, 'categories', categoryId);
  await updateDoc(ref, { ...partial, updatedAt: Timestamp.now() });
}

export async function seedDefaultCategories() {
  const now = Timestamp.now();
  for (const c of DEFAULT_CATEGORY_SEED) {
    const ref = doc(db, 'categories', c.id);
    await setDoc(
      ref,
      {
        ...c,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
  return true;
}

export function getCategoryNameByLang(category, lang = 'th') {
  if (!category) return '';
  const name = category.name;
  if (!name) return '';
  if (lang.startsWith('en')) return name.en || name.th || '';
  return name.th || name.en || '';
}
