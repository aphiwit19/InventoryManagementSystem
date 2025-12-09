// Products service layer
import {
  db,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from '../repositories/firestore';
import { addInventoryHistory } from './inventory.service';

// Default units for dropdown
export const DEFAULT_UNITS = [
  'ชิ้น', 'อัน', 'ด้าม', 'แพ็ก', 'กล่อง', 'ขวด', 'ตัว', 'คู่', 'เมตร', 'กิโลกรัม', 'รีม', 'ม้วน', 'ใบ', 'เล่ม', 'แผ่น'
];

// Default categories for dropdown
export const DEFAULT_CATEGORIES = [
  'เครื่องเขียน', 'อุปกรณ์สำนักงาน', 'เครื่องดื่ม', 'อาหาร', 'เสื้อผ้า',
  'รองเท้า', 'อิเล็กทรอนิกส์', 'เครื่องใช้ไฟฟ้า', 'ของใช้ทั่วไป', 'อื่นๆ'
];

// Default sizes for dropdown
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// Default colors for dropdown
export const DEFAULT_COLORS = [
  'ดำ', 'ขาว', 'แดง', 'น้ำเงิน', 'เขียว', 'เหลือง', 'ส้ม', 'ชมพู', 'ม่วง', 'เทา', 'น้ำตาล', 'ครีม'
];

// Helper: Calculate total quantity from variants
export function calculateTotalQuantity(variants) {
  if (!variants || !Array.isArray(variants)) return 0;
  return variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);
}

// Helper: Get available sizes from variants
export function getAvailableSizes(variants) {
  if (!variants || !Array.isArray(variants)) return [];
  const sizes = variants.map(v => v.size).filter(Boolean);
  return [...new Set(sizes)];
}

// Helper: Get available colors from variants
export function getAvailableColors(variants) {
  if (!variants || !Array.isArray(variants)) return [];
  const colors = variants.map(v => v.color).filter(Boolean);
  return [...new Set(colors)];
}

// Helper: Get variant by size and color
export function getVariant(product, size, color) {
  if (!product?.variants || !Array.isArray(product.variants)) return null;
  return product.variants.find(v => v.size === size && v.color === color) || null;
}

// Helper: Get available quantity for a variant
export function getVariantAvailableQuantity(variant) {
  if (!variant) return 0;
  return Math.max(0, (variant.quantity || 0) - (variant.reserved || 0));
}

export async function addProduct(productData) {
  try {
    const hasVariants = productData.hasVariants === true && Array.isArray(productData.variants) && productData.variants.length > 0;
    
    let data;
    
    if (hasVariants) {
      // Product with variants
      const variants = productData.variants.map(v => ({
        size: v.size || '',
        color: v.color || '',
        quantity: parseInt(v.quantity) || 0,
        costPrice: parseFloat(v.costPrice) || 0,
        sellPrice: parseFloat(v.sellPrice) || 0,
        reserved: 0,
        staffReserved: 0,
      }));
      
      const totalQuantity = calculateTotalQuantity(variants);
      
      data = {
        productName: productData.productName,
        description: productData.description,
        image: productData.image,
        purchaseLocation: productData.purchaseLocation || '',
        addDate: Timestamp.fromDate(new Date(productData.addDate)),
        unit: productData.unit || 'ชิ้น',
        category: productData.category || 'อื่นๆ',
        hasVariants: true,
        variants: variants,
        // Summary fields for easy querying
        quantity: totalQuantity,
        initialQuantity: totalQuantity,
        reserved: 0,
        staffReserved: 0,
        // Use first variant's price as default display price
        price: variants[0]?.sellPrice || 0,
        costPrice: variants[0]?.costPrice || 0,
        sellPrice: variants[0]?.sellPrice || 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
    } else {
      // Product without variants (legacy format)
      const costPrice = parseFloat(productData.costPrice) || 0;
      const sellPrice = parseFloat(productData.sellPrice ?? productData.price ?? productData.costPrice) || 0;
      
      data = {
        productName: productData.productName,
        description: productData.description,
        price: sellPrice,
        costPrice: costPrice,
        sellPrice: sellPrice,
        image: productData.image,
        purchaseLocation: productData.purchaseLocation || '',
        addDate: Timestamp.fromDate(new Date(productData.addDate)),
        quantity: parseInt(productData.quantity) || 0,
        initialQuantity: parseInt(productData.quantity) || 0,
        reserved: 0,
        staffReserved: 0,
        unit: productData.unit || 'ชิ้น',
        category: productData.category || 'อื่นๆ',
        hasVariants: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
    }
    
    const docRef = await addDoc(collection(db, 'products'), data);
    const productId = docRef.id;
    
    // Add inventory history
    if (hasVariants) {
      for (const v of data.variants) {
        if (v.costPrice && v.quantity) {
          await addInventoryHistory(productId, {
            date: productData.addDate,
            costPrice: v.costPrice,
            quantity: v.quantity,
            type: 'in',
            source: 'admin_add',
            variant: `${v.size}/${v.color}`,
          });
        }
      }
    } else if (productData.costPrice && productData.quantity) {
      await addInventoryHistory(productId, {
        date: productData.addDate,
        costPrice: productData.costPrice,
        quantity: productData.quantity,
        type: 'in',
        source: 'admin_add',
      });
    }
    
    return productId;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

export async function getAllProducts() {
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

export async function getProductById(productId) {
  try {
    const docRef = doc(db, 'products', productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    throw new Error('Product not found');
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

export async function updateProduct(productId, productData) {
  try {
    const currentSnap = await getDoc(doc(db, 'products', productId));
    const current = currentSnap.exists() ? currentSnap.data() : {};
    
    let addDateValue;
    if (typeof productData.addDate === 'string') {
      addDateValue = Timestamp.fromDate(new Date(productData.addDate));
    } else if (productData.addDate instanceof Date) {
      addDateValue = Timestamp.fromDate(productData.addDate);
    } else {
      addDateValue = productData.addDate;
    }
    
    const hasVariants = productData.hasVariants === true && Array.isArray(productData.variants) && productData.variants.length > 0;
    
    let data;
    
    if (hasVariants) {
      // Product with variants
      const variants = productData.variants.map(v => ({
        size: v.size || '',
        color: v.color || '',
        quantity: parseInt(v.quantity) || 0,
        costPrice: parseFloat(v.costPrice) || 0,
        sellPrice: parseFloat(v.sellPrice) || 0,
        reserved: v.reserved || 0,
        staffReserved: v.staffReserved || 0,
      }));
      
      const totalQuantity = calculateTotalQuantity(variants);
      
      data = {
        productName: productData.productName,
        description: productData.description,
        image: productData.image,
        purchaseLocation: productData.purchaseLocation ?? current?.purchaseLocation ?? '',
        addDate: addDateValue,
        unit: productData.unit ?? current?.unit ?? 'ชิ้น',
        category: productData.category ?? current?.category ?? 'อื่นๆ',
        hasVariants: true,
        variants: variants,
        quantity: totalQuantity,
        initialQuantity: current?.initialQuantity ?? totalQuantity,
        reserved: current?.reserved ?? 0,
        staffReserved: current?.staffReserved ?? 0,
        price: variants[0]?.sellPrice || 0,
        costPrice: variants[0]?.costPrice || 0,
        sellPrice: variants[0]?.sellPrice || 0,
        promotion: productData.promotion || null,
        updatedAt: Timestamp.now(),
      };
    } else {
      // Product without variants
      const costPrice = parseFloat(productData.costPrice ?? productData.price ?? 0);
      const sellPrice = parseFloat(productData.sellPrice ?? productData.price ?? costPrice ?? 0);
      
      data = {
        productName: productData.productName,
        description: productData.description,
        price: sellPrice,
        costPrice: costPrice,
        sellPrice: sellPrice,
        image: productData.image,
        purchaseLocation: productData.purchaseLocation ?? current?.purchaseLocation ?? '',
        addDate: addDateValue,
        quantity: parseInt(productData.quantity) || 0,
        initialQuantity: current?.initialQuantity ?? (parseInt(productData.quantity) || 0),
        unit: productData.unit ?? current?.unit ?? 'ชิ้น',
        category: productData.category ?? current?.category ?? 'อื่นๆ',
        hasVariants: false,
        promotion: productData.promotion || null,
        updatedAt: Timestamp.now(),
      };
    }
    
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(productId) {
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function updateProductQuantity(productId, quantity, isAdd = true) {
  try {
    const product = await getProductById(productId);
    const currentQuantity = product.quantity || 0;
    const change = parseInt(quantity);
    const newQuantity = isAdd ? currentQuantity + change : Math.max(0, currentQuantity - change);
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, { quantity: newQuantity, updatedAt: Timestamp.now() });

    if (isAdd) {
      await addInventoryHistory(productId, {
        date: new Date(),
        costPrice: product.costPrice || 0,
        quantity: change,
        type: 'in',
        source: 'admin_adjust_inc',
      });
    } else {
      await addInventoryHistory(productId, {
        date: new Date(),
        costPrice: null,
        quantity: change,
        type: 'out',
        source: 'admin_adjust_dec',
      });
    }
  } catch (error) {
    console.error('Error updating product quantity:', error);
    throw error;
  }
}

export function isLowStock(p) {
  // ตรวจสอบสต๊อกรวม
  const initial = parseInt(p.initialQuantity ?? p.quantity ?? 0);
  const available = Math.max(0, parseInt(p.quantity || 0) - parseInt(p.reserved || 0));
  if (initial && available / initial < 0.2) return true;
  
  // ตรวจสอบแต่ละ variant
  if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
    for (const v of p.variants) {
      const vInitial = parseInt(v.initialQuantity ?? v.quantity ?? 0);
      const vAvailable = Math.max(0, parseInt(v.quantity || 0) - parseInt(v.reserved || 0));
      if (vInitial && vAvailable / vInitial < 0.2) return true;
      // ถ้า variant เหลือน้อยกว่า 5 ก็ถือว่าต่ำ
      if (vAvailable <= 5) return true;
    }
  }
  
  return false;
}

// ดึงรายละเอียด variant ที่สต๊อกต่ำ
export function getLowStockVariants(p) {
  if (!p.hasVariants || !Array.isArray(p.variants)) return [];
  
  return p.variants.filter(v => {
    const vInitial = parseInt(v.initialQuantity ?? v.quantity ?? 0);
    const vAvailable = Math.max(0, parseInt(v.quantity || 0) - parseInt(v.reserved || 0));
    if (vInitial && vAvailable / vInitial < 0.2) return true;
    if (vAvailable <= 5) return true;
    return false;
  }).map(v => ({
    size: v.size,
    color: v.color,
    quantity: v.quantity || 0,
    reserved: v.reserved || 0,
    available: Math.max(0, (v.quantity || 0) - (v.reserved || 0)),
  }));
}

export function getLowStockProducts(list) {
  return (list || []).filter(isLowStock);
}
