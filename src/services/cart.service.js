// Cart service layer - Firebase-based cart management
import { db, doc, getDoc, setDoc, Timestamp } from '../repositories/firestore';

/**
 * Get user's cart from Firebase
 * @param {string} uid - User ID
 * @param {string} role - User role ('customer' or 'staff')
 * @returns {Promise<Array>} Cart items array
 */
export async function getCart(uid, role = 'customer') {
  try {
    if (!uid) return [];
    const cartType = role === 'staff' ? 'staff' : 'customer';
    const cartRef = doc(db, 'users', uid, 'cart', cartType);
    const cartSnap = await getDoc(cartRef);
    if (cartSnap.exists()) {
      const data = cartSnap.data();
      return Array.isArray(data.items) ? data.items : [];
    }
    return [];
  } catch (error) {
    console.error('Error getting cart:', error);
    throw error;
  }
}

/**
 * Save cart to Firebase
 * @param {string} uid - User ID
 * @param {Array} items - Cart items array
 * @param {string} role - User role ('customer' or 'staff')
 * @returns {Promise<void>}
 */
export async function saveCart(uid, items, role = 'customer') {
  try {
    if (!uid) throw new Error('User ID is required');
    const cartType = role === 'staff' ? 'staff' : 'customer';
    const cartRef = doc(db, 'users', uid, 'cart', cartType);
    await setDoc(cartRef, {
      items: Array.isArray(items) ? items : [],
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving cart:', error);
    throw error;
  }
}

/**
 * Add item to cart (supports variants)
 * @param {string} uid - User ID
 * @param {Object} product - Product to add { productId, productName, sellPrice, quantity, image, unit, variantSize?, variantColor?, maxQuantity }
 * @param {string} role - User role ('customer' or 'staff')
 * @returns {Promise<void>}
 */
export async function addToCart(uid, product, role = 'customer') {
  try {
    if (!uid) throw new Error('User ID is required');
    const currentCart = await getCart(uid, role);
    
    // Find existing item by productId AND variant (size + color)
    const existingIndex = currentCart.findIndex(item => 
      item.productId === product.productId &&
      item.variantSize === (product.variantSize || null) &&
      item.variantColor === (product.variantColor || null)
    );
    
    let updatedCart;
    if (existingIndex >= 0) {
      // Update existing item quantity
      updatedCart = [...currentCart];
      const existingItem = updatedCart[existingIndex];
      const newQuantity = (existingItem.quantity || 0) + (product.quantity || 1);
      const maxQuantity = Math.min(newQuantity, product.maxQuantity || existingItem.maxQuantity || 999);
      
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: maxQuantity,
        sellPrice: product.sellPrice || existingItem.sellPrice,
        maxQuantity: product.maxQuantity || existingItem.maxQuantity
      };
    } else {
      // Add new item
      updatedCart = [...currentCart, {
        productId: product.productId,
        productName: product.productName,
        image: product.image,
        unit: product.unit || 'ชิ้น',
        quantity: product.quantity || 1,
        sellPrice: product.sellPrice || 0,
        maxQuantity: product.maxQuantity || 999,
        variantSize: product.variantSize || null,
        variantColor: product.variantColor || null,
      }];
    }
    
    await saveCart(uid, updatedCart, role);
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Update item quantity in cart (supports variants)
 * @param {string} uid - User ID
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @param {string} variantSize - Variant size (optional)
 * @param {string} variantColor - Variant color (optional)
 * @param {string} role - User role ('customer' or 'staff')
 * @returns {Promise<void>}
 */
export async function updateCartItem(uid, productId, quantity, variantSize = null, variantColor = null, role = 'customer') {
  try {
    if (!uid) throw new Error('User ID is required');
    const currentCart = await getCart(uid, role);
    const updatedCart = currentCart.map(item => {
      if (item.productId === productId && 
          item.variantSize === variantSize && 
          item.variantColor === variantColor) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    await saveCart(uid, updatedCart, role);
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

/**
 * Remove item from cart (supports variants)
 * @param {string} uid - User ID
 * @param {string} productId - Product ID to remove
 * @param {string} variantSize - Variant size (optional)
 * @param {string} variantColor - Variant color (optional)
 * @param {string} role - User role ('customer' or 'staff')
 * @returns {Promise<void>}
 */
export async function removeFromCart(uid, productId, variantSize = null, variantColor = null, role = 'customer') {
  try {
    if (!uid) throw new Error('User ID is required');
    const currentCart = await getCart(uid, role);
    const updatedCart = currentCart.filter(item => 
      !(item.productId === productId && 
        item.variantSize === variantSize && 
        item.variantColor === variantColor)
    );
    await saveCart(uid, updatedCart, role);
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

/**
 * Clear entire cart
 * @param {string} uid - User ID
 * @param {string} role - User role ('customer' or 'staff')
 * @returns {Promise<void>}
 */
export async function clearCart(uid, role = 'customer') {
  try {
    if (!uid) throw new Error('User ID is required');
    await saveCart(uid, [], role);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

/**
 * Migrate localStorage cart to Firebase (one-time migration)
 * @param {string} uid - User ID
 * @param {string} localStorageKey - localStorage key to migrate from
 * @param {string} role - User role ('customer' or 'staff')
 * @returns {Promise<boolean>} Returns true if migration occurred
 */
export async function migrateLocalStorageCart(uid, localStorageKey, role = 'customer') {
  try {
    if (!uid) return false;
    
    // Check if Firebase cart already exists
    const firebaseCart = await getCart(uid, role);
    if (firebaseCart.length > 0) return false; // Already migrated
    
    // Try to get from localStorage
    try {
      const localCart = localStorage.getItem(localStorageKey);
      if (localCart) {
        const items = JSON.parse(localCart);
        if (Array.isArray(items) && items.length > 0) {
          await saveCart(uid, items, role);
          localStorage.removeItem(localStorageKey); // Remove after migration
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to migrate localStorage cart:', e);
    }
    
    return false;
  } catch (error) {
    console.error('Error migrating cart:', error);
    return false;
  }
}

