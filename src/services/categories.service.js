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
  deleteDoc,
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
      { key: 'brand', label: { th: 'ยี่ห้อ/แบรนด์', en: 'Brand' }, type: 'text' },
      { key: 'model', label: { th: 'รุ่น/เวอร์ชัน', en: 'Model / Version' }, type: 'text' },
      { key: 'condition', label: { th: 'สภาพ', en: 'Condition' }, type: 'text' },
      { key: 'imei', label: { th: 'IMEI', en: 'IMEI' }, type: 'text' },
      { key: 'processor', label: { th: 'CPU/Processor', en: 'CPU/Processor' }, type: 'text' },
      { key: 'ram', label: { th: 'RAM', en: 'RAM' }, type: 'text' },
      { key: 'storage', label: { th: 'Storage', en: 'Storage' }, type: 'text' },
      { key: 'screenSize', label: { th: 'ขนาดหน้าจอ', en: 'Screen Size' }, type: 'text' },
      { key: 'batteryCapacity', label: { th: 'ความจุแบตเตอรี่', en: 'Battery Capacity' }, type: 'text' },
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
      { key: 'dimensions', label: { th: 'ขนาด กว้างxยาวxสูง', en: 'Dimensions (W×L×H)' }, type: 'text' },
      { key: 'color', label: { th: 'สี', en: 'Color' }, type: 'text' },
    ],
  },
  {
    id: 'fashion',
    name: { th: 'แฟชั่น', en: 'Fashion' },
    active: true,
    sortOrder: 3,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'material', label: { th: 'วัสดุ/เนื้อผ้า', en: 'Material' }, type: 'text' },
      { key: 'careInstructions', label: { th: 'วิธีซัก/ดูแล', en: 'Care Instructions' }, type: 'textarea' },
    ],
  },
  {
    id: 'beauty_personal_care',
    name: { th: 'ความงาม/ดูแลตัวเอง', en: 'Beauty & Personal Care' },
    active: true,
    sortOrder: 4,
    features: { specs: true, variants: true, serial: false, lot: true },
    specKeys: [
      { key: 'mfgDate', label: { th: 'วันที่ผลิต (MFG)', en: 'MFG Date' }, type: 'text' },
      { key: 'expDate', label: { th: 'วันหมดอายุ (EXP)', en: 'EXP Date' }, type: 'text' },
      { key: 'lotNumber', label: { th: 'เลขล็อต/แบตช์', en: 'Batch/Lot Number' }, type: 'text' },
      { key: 'ingredients', label: { th: 'ส่วนผสม', en: 'Ingredients' }, type: 'textarea' },
      { key: 'allergenInfo', label: { th: 'คำเตือนสารก่อภูมิแพ้', en: 'Allergen Info' }, type: 'textarea' },
      { key: 'usage', label: { th: 'วิธีใช้', en: 'How to use' }, type: 'textarea' },
      { key: 'warning', label: { th: 'คำเตือน', en: 'Warning' }, type: 'textarea' },
    ],
  },
  {
    id: 'food_beverage',
    name: { th: 'อาหาร/เครื่องดื่ม', en: 'Food & Beverage' },
    active: true,
    sortOrder: 5,
    features: { specs: true, variants: true, serial: false, lot: true },
    specKeys: [
      { key: 'mfgDate', label: { th: 'วันที่ผลิต (MFG)', en: 'MFG Date' }, type: 'text' },
      { key: 'expDate', label: { th: 'วันหมดอายุ (EXP)', en: 'EXP Date' }, type: 'text' },
      { key: 'bestBefore', label: { th: 'ควรบริโภคก่อน', en: 'Best Before' }, type: 'text' },
      { key: 'lotNumber', label: { th: 'เลขล็อต/แบตช์', en: 'Batch/Lot Number' }, type: 'text' },
      { key: 'storageCondition', label: { th: 'วิธีเก็บ', en: 'Storage Condition' }, type: 'text' },
      { key: 'nutritionFacts', label: { th: 'ข้อมูลโภชนาการ', en: 'Nutrition Facts' }, type: 'textarea' },
      { key: 'halalKosher', label: { th: 'ฮาลาล/โคเชอร์', en: 'Halal/Kosher' }, type: 'text' },
      { key: 'ingredients', label: { th: 'ส่วนประกอบ', en: 'Ingredients' }, type: 'textarea' },
      { key: 'allergenInfo', label: { th: 'สารก่อภูมิแพ้', en: 'Allergen Info' }, type: 'textarea' },
    ],
  },
  {
    id: 'office_stationery',
    name: { th: 'ออฟฟิศ/เครื่องเขียน', en: 'Office & Stationery' },
    active: true,
    sortOrder: 6,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'brand', label: { th: 'ยี่ห้อ', en: 'Brand' }, type: 'text' },
      { key: 'material', label: { th: 'วัสดุ', en: 'Material' }, type: 'text' },
      { key: 'inkType', label: { th: 'ชนิดหมึก', en: 'Ink Type' }, type: 'text' },
      { key: 'paperWeight', label: { th: 'น้ำหนักกระดาษ', en: 'Paper Weight' }, type: 'text' },
    ],
  },
  {
    id: 'tools_hardware',
    name: { th: 'เครื่องมือ/ฮาร์ดแวร์', en: 'Tools & Hardware' },
    active: true,
    sortOrder: 7,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'brand', label: { th: 'ยี่ห้อ', en: 'Brand' }, type: 'text' },
      { key: 'capacity', label: { th: 'ความจุ/ขนาดงาน', en: 'Capacity' }, type: 'text' },
      { key: 'weight', label: { th: 'น้ำหนัก', en: 'Weight' }, type: 'text' },
      { key: 'length', label: { th: 'ความยาว', en: 'Length' }, type: 'text' },
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
      { key: 'partNumber', label: { th: 'หมายเลขชิ้นส่วน', en: 'Part Number' }, type: 'text' },
      { key: 'compatibility', label: { th: 'ความเข้ากัน (รุ่นรถ/ปี)', en: 'Compatibility (Model/Year)' }, type: 'textarea' },
      { key: 'brand', label: { th: 'ยี่ห้อ', en: 'Brand' }, type: 'text' },
      { key: 'material', label: { th: 'วัสดุ', en: 'Material' }, type: 'text' },
    ],
  },
  {
    id: 'sports_outdoor',
    name: { th: 'กีฬา/กลางแจ้ง', en: 'Sports & Outdoor' },
    active: true,
    sortOrder: 9,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'brand', label: { th: 'ยี่ห้อ', en: 'Brand' }, type: 'text' },
      { key: 'size', label: { th: 'ขนาด', en: 'Size' }, type: 'text' },
      { key: 'color', label: { th: 'สี', en: 'Color' }, type: 'text' },
      { key: 'weight', label: { th: 'น้ำหนัก', en: 'Weight' }, type: 'text' },
      { key: 'material', label: { th: 'วัสดุ', en: 'Material' }, type: 'text' },
    ],
  },
  {
    id: 'toys_kids',
    name: { th: 'ของเล่น/เด็ก', en: 'Toys & Kids' },
    active: true,
    sortOrder: 10,
    features: { specs: true, variants: true, serial: false, lot: false },
    specKeys: [
      { key: 'safetyCertificate', label: { th: 'มาตรฐานความปลอดภัย', en: 'Safety Certificate' }, type: 'text' },
      { key: 'mfgDate', label: { th: 'วันที่ผลิต (MFG)', en: 'MFG Date' }, type: 'text' },
      { key: 'size', label: { th: 'ขนาด', en: 'Size' }, type: 'text' },
      { key: 'color', label: { th: 'สี', en: 'Color' }, type: 'text' },
      { key: 'material', label: { th: 'วัสดุ', en: 'Material' }, type: 'text' },
      { key: 'warningLabels', label: { th: 'คำเตือน', en: 'Warning Labels' }, type: 'textarea' },
    ],
  },
];

function mergeWithDefaultSeed(category) {
  if (!category?.id) return category;
  const seed = DEFAULT_CATEGORY_SEED.find((c) => c.id === category.id);
  if (!seed) return category;

  const hasFeatures = category.features && typeof category.features === 'object';
  const hasSpecKeys = Array.isArray(category.specKeys);

  if (hasFeatures && hasSpecKeys) return category;

  return {
    ...seed,
    ...category,
    features: hasFeatures ? category.features : seed.features,
    specKeys: hasSpecKeys ? category.specKeys : seed.specKeys,
  };
}

export async function getAllCategories({ activeOnly = true } = {}) {
  const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).map(mergeWithDefaultSeed);
  if (activeOnly) rows = rows.filter((c) => c.active !== false);
  return rows;
}

export async function getCategoryById(categoryId) {
  const ref = doc(db, 'categories', categoryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mergeWithDefaultSeed({ id: snap.id, ...snap.data() });
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

export async function deleteCategory(categoryId) {
  const ref = doc(db, 'categories', categoryId);
  await deleteDoc(ref);
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
