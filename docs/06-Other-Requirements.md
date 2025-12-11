# 6. Other Requirements

## 6.1 Database Requirements

### 6.1.1 Database Overview

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Database Type** | Cloud Firestore (NoSQL) |
| **Provider** | Google Firebase |
| **Data Model** | Document-based |
| **Location** | Google Cloud (asia-southeast1) |

### 6.1.2 Collections Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Firestore Collections                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  firestore/                                                           │
│  │                                                                    │
│  ├── products/                    # สินค้าทั้งหมด                     │
│  │   └── {productId}/                                                 │
│  │       ├── [product fields]                                         │
│  │       └── inventory_history/   # ประวัติสต็อก (subcollection)      │
│  │           └── {historyId}/                                         │
│  │                                                                    │
│  ├── users/                       # ผู้ใช้ทั้งหมด                     │
│  │   └── {userId}/                                                    │
│  │       ├── [user fields]                                            │
│  │       ├── cart/                # ตะกร้า (subcollection)            │
│  │       │   ├── customer/                                            │
│  │       │   └── staff/                                               │
│  │       └── orders/              # คำสั่งซื้อ (subcollection)        │
│  │           └── {orderId}/                                           │
│  │                                                                    │
│  ├── coupons/                     # คูปองทั้งหมด                      │
│  │   └── {couponId}/                                                  │
│  │                                                                    │
│  ├── counters/                    # ตัวนับ (Order Number)             │
│  │   └── orderNumber/                                                 │
│  │                                                                    │
│  └── settings/                    # การตั้งค่าระบบ                    │
│      └── payment/                 # บัญชีธนาคาร                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.1.3 Collection Schemas

#### Products Collection

```javascript
// Collection: products
// Document ID: Auto-generated

{
  // Basic Info
  productName: string,          // Required - ชื่อสินค้า
  description: string,          // รายละเอียด
  category: string,             // หมวดหมู่
  unit: string,                 // หน่วย (ชิ้น, อัน, etc.)
  image: string,                // URL รูปภาพ
  purchaseLocation: string,     // แหล่งซื้อ
  addDate: Timestamp,           // วันที่เพิ่ม
  
  // Pricing
  costPrice: number,            // ราคาทุน
  sellPrice: number,            // ราคาขาย
  price: number,                // ราคาแสดง (= sellPrice)
  
  // Stock
  quantity: number,             // จำนวนทั้งหมด
  initialQuantity: number,      // จำนวนเริ่มต้น
  reserved: number,             // จองโดย Customer
  staffReserved: number,        // จองโดย Staff
  
  // Variants
  hasVariants: boolean,         // มี variants หรือไม่
  variants: [                   // Array of variants
    {
      size: string,
      color: string,
      quantity: number,
      costPrice: number,
      sellPrice: number,
      reserved: number,
      staffReserved: number
    }
  ],
  
  // Promotion
  promotion: {
    price: number,              // ราคาโปรโมชั่น
    startDate: Timestamp,
    endDate: Timestamp
  } | null,
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Users Collection

```javascript
// Collection: users
// Document ID: Firebase Auth UID

{
  // Basic Info
  email: string,                // Email
  displayName: string,          // ชื่อแสดง
  firstName: string,            // ชื่อ
  lastName: string,             // นามสกุล
  phone: string,                // เบอร์โทร
  birthDate: string,            // วันเกิด (YYYY-MM-DD)
  photoURL: string,             // URL รูปโปรไฟล์
  
  // Role
  role: string,                 // 'admin' | 'staff' | 'customer'
  
  // Addresses
  addresses: [
    {
      id: string,               // addr_timestamp
      name: string,             // ชื่อที่อยู่ (บ้าน, ที่ทำงาน)
      address: string,          // ที่อยู่
      district: string,         // เขต/อำเภอ
      city: string,             // แขวง/ตำบล
      province: string,         // จังหวัด
      postalCode: string,       // รหัสไปรษณีย์
      phone: string,            // เบอร์โทร
      isDefault: boolean,       // เป็นที่อยู่หลัก
      createdAt: Date
    }
  ],
  
  // Settings
  settings: {
    emailNotifications: boolean,
    promotions: boolean,
    smsNotifications: boolean
  },
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Orders Subcollection

```javascript
// Collection: users/{userId}/orders
// Document ID: Auto-generated

{
  // Order Info
  orderNumber: string,          // ORD-YYYYMMDD-0001
  
  // Items
  items: [
    {
      productId: string,
      productName: string,
      price: number,
      quantity: number,
      subtotal: number,
      variantSize: string | null,
      variantColor: string | null
    }
  ],
  
  // Totals
  total: number,                // ยอดรวม
  
  // Delivery
  deliveryMethod: string,       // 'pickup' | 'shipping'
  requestedBy: string,          // ชื่อผู้รับ
  requestedAddress: string,     // ที่อยู่จัดส่ง
  receivedBy: string,           // ชื่อผู้รับ (pickup)
  receivedAddress: string,      // ที่อยู่รับ (pickup)
  note: string,                 // หมายเหตุ
  
  // Shipping
  shippingStatus: string,       // สถานะ
  shippingCarrier: string,      // ขนส่ง
  trackingNumber: string,       // เลข Tracking
  
  // Payment
  paymentMethod: string,        // วิธีชำระเงิน
  paymentAccount: string,       // บัญชีที่โอน
  paymentSlipUrl: string,       // URL สลิป
  
  // Metadata
  createdByUid: string,
  createdByEmail: string,
  createdSource: string,        // 'customer' | 'staff'
  withdrawDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Cart Subcollection

```javascript
// Collection: users/{userId}/cart/{customer|staff}
// Document ID: 'customer' or 'staff'

{
  items: [
    {
      productId: string,
      productName: string,
      image: string,
      unit: string,
      quantity: number,
      sellPrice: number,
      maxQuantity: number,
      variantSize: string | null,
      variantColor: string | null
    }
  ],
  updatedAt: Timestamp
}
```

#### Inventory History Subcollection

```javascript
// Collection: products/{productId}/inventory_history
// Document ID: Auto-generated

{
  date: Timestamp,              // วันที่
  costPrice: number | null,     // ราคาทุน
  quantity: number,             // จำนวน
  type: string,                 // 'in' | 'out'
  source: string,               // แหล่งที่มา
  orderId: string | null,       // Order ID (ถ้ามี)
  actorUid: string | null,      // UID ผู้ดำเนินการ
  variantSize: string | null,   // Size (ถ้ามี)
  variantColor: string | null,  // Color (ถ้ามี)
  createdAt: Timestamp
}
```

#### Coupons Collection

```javascript
// Collection: coupons
// Document ID: Auto-generated

{
  code: string,                 // รหัสคูปอง (uppercase)
  type: string,                 // 'fixed' | 'percentage'
  value: number,                // มูลค่า
  minPurchase: number,          // ยอดซื้อขั้นต่ำ
  maxDiscount: number,          // ส่วนลดสูงสุด (percentage)
  startDate: Timestamp,         // วันเริ่ม
  endDate: Timestamp | null,    // วันหมดอายุ
  usageLimit: number,           // จำกัดจำนวนครั้ง (0 = unlimited)
  usedCount: number,            // ใช้ไปแล้ว
  active: boolean,              // เปิด/ปิดใช้งาน
  description: string,          // รายละเอียด
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Counters Collection

```javascript
// Collection: counters
// Document ID: 'orderNumber'

{
  current: number               // เลขปัจจุบัน
}
```

#### Settings Collection

```javascript
// Collection: settings
// Document ID: 'payment'

{
  bankAccounts: [
    {
      id: string,
      bankName: string,
      accountNumber: string,
      accountName: string,
      isActive: boolean
    }
  ]
}
```

### 6.1.4 Indexes

| Collection | Fields | Type |
|------------|--------|------|
| `products` | `createdAt` | Descending |
| `users` | `email` | Ascending |
| `coupons` | `code` | Ascending |
| `orders` (collectionGroup) | `createdAt` | Descending |
| `inventory_history` | `date` | Descending |

### 6.1.5 Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Products - Admin can write, authenticated can read
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      
      match /inventory_history/{historyId} {
        allow read: if isAdmin();
        allow write: if isAdmin();
      }
    }
    
    // Users - Owner can read/write own data, Admin can read all
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId) || isAdmin();
      
      match /cart/{cartType} {
        allow read, write: if isOwner(userId);
      }
      
      match /orders/{orderId} {
        allow read: if isOwner(userId) || isAdmin();
        allow create: if isOwner(userId);
        allow update: if isAdmin();
      }
    }
    
    // Coupons - Admin can write, authenticated can read
    match /coupons/{couponId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Counters - Admin only
    match /counters/{counterId} {
      allow read, write: if isAdmin();
    }
    
    // Settings - Admin only
    match /settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

---

## 6.2 Internationalization (i18n)

### 6.2.1 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| **Thai** | th | Primary (Default) |
| **English** | en | Secondary |

### 6.2.2 Implementation

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Library** | i18next + react-i18next |
| **Detection** | Browser language detection |
| **Storage** | localStorage |
| **Fallback** | Thai (th) |

### 6.2.3 Translation Files Structure

```
src/i18n/
├── index.js                    # Configuration
└── locales/
    ├── th/
    │   └── translation.json    # Thai translations
    └── en/
        └── translation.json    # English translations
```

### 6.2.4 Translation Keys Structure

```javascript
{
  // Common
  "common": {
    "save": "บันทึก / Save",
    "cancel": "ยกเลิก / Cancel",
    "delete": "ลบ / Delete",
    "edit": "แก้ไข / Edit",
    "add": "เพิ่ม / Add",
    "search": "ค้นหา / Search",
    "loading": "กำลังโหลด... / Loading...",
    "confirm": "ยืนยัน / Confirm",
    "back": "กลับ / Back",
    "next": "ถัดไป / Next",
    "profile": "โปรไฟล์ / Profile",
    "logout": "ออกจากระบบ / Logout"
  },
  
  // Authentication
  "auth": {
    "login": "เข้าสู่ระบบ / Login",
    "register": "ลงทะเบียน / Register",
    "email": "อีเมล / Email",
    "password": "รหัสผ่าน / Password",
    "confirm_password": "ยืนยันรหัสผ่าน / Confirm Password"
  },
  
  // Products
  "product": {
    "product_name": "ชื่อสินค้า / Product Name",
    "price": "ราคา / Price",
    "quantity": "จำนวน / Quantity",
    "category": "หมวดหมู่ / Category",
    "unit": "หน่วย / Unit",
    "description": "รายละเอียด / Description",
    "add_to_cart": "เพิ่มลงตะกร้า / Add to Cart",
    "out_of_stock": "สินค้าหมด / Out of Stock",
    "low_stock": "สินค้าใกล้หมด / Low Stock"
  },
  
  // Cart
  "cart": {
    "cart": "ตะกร้า / Cart",
    "empty_cart": "ตะกร้าว่าง / Cart is empty",
    "total": "รวม / Total",
    "checkout": "ดำเนินการสั่งซื้อ / Checkout"
  },
  
  // Orders
  "order": {
    "order_number": "เลขที่คำสั่งซื้อ / Order Number",
    "status": "สถานะ / Status",
    "pending": "รอดำเนินการ / Pending",
    "processing": "กำลังดำเนินการ / Processing",
    "shipped": "จัดส่งแล้ว / Shipped",
    "completed": "สำเร็จ / Completed",
    "track_status": "ติดตามสถานะ / Track Status"
  },
  
  // Payment
  "payment": {
    "payment_method": "วิธีชำระเงิน / Payment Method",
    "bank_transfer": "โอนเงิน / Bank Transfer",
    "upload_slip": "อัพโหลดสลิป / Upload Slip",
    "apply_coupon": "ใช้คูปอง / Apply Coupon"
  }
}
```

### 6.2.5 Usage in Components

```javascript
import { useTranslation } from 'react-i18next';

function ProductCard({ product }) {
  const { t } = useTranslation();
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{t('product.price')}: ฿{product.price}</p>
      <button>{t('product.add_to_cart')}</button>
    </div>
  );
}
```

### 6.2.6 Language Switcher

```javascript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <select 
      value={i18n.language} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      <option value="th">ไทย</option>
      <option value="en">English</option>
    </select>
  );
}
```

---

## 6.3 Legal and Regulatory Requirements

### 6.3.1 Data Privacy

| Requirement | Implementation |
|-------------|----------------|
| **Personal Data** | เก็บเฉพาะข้อมูลที่จำเป็น |
| **Data Storage** | เก็บใน Firebase (Google Cloud) |
| **Data Access** | เฉพาะผู้มีสิทธิ์เข้าถึง |
| **Data Deletion** | ผู้ใช้สามารถขอลบบัญชีได้ |

### 6.3.2 PDPA Compliance (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล)

| หัวข้อ | การปฏิบัติ |
|--------|-----------|
| **ความยินยอม** | ผู้ใช้ยินยอมเมื่อลงทะเบียน |
| **วัตถุประสงค์** | ใช้เพื่อการให้บริการเท่านั้น |
| **การเข้าถึง** | ผู้ใช้สามารถดูข้อมูลของตนเอง |
| **การแก้ไข** | ผู้ใช้สามารถแก้ไขข้อมูลได้ |
| **การลบ** | ผู้ใช้สามารถขอลบข้อมูลได้ |

### 6.3.3 Terms of Service

ระบบควรมีหน้า Terms of Service ที่ระบุ:
- เงื่อนไขการใช้งาน
- นโยบายความเป็นส่วนตัว
- การจำกัดความรับผิดชอบ
- การระงับข้อพิพาท

---

## 6.4 Deployment Requirements

### 6.4.1 Hosting

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Platform** | Netlify |
| **Build Command** | `npm run build` |
| **Publish Directory** | `build` |
| **Node Version** | 18.x |

### 6.4.2 Environment Variables

```
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx
```

### 6.4.3 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Pipeline                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Push to Git                                              │
│     └── Developer pushes code to repository                  │
│                                                              │
│  2. Netlify Webhook                                          │
│     └── Netlify detects new commit                           │
│                                                              │
│  3. Build                                                    │
│     ├── npm install                                          │
│     └── npm run build                                        │
│                                                              │
│  4. Deploy                                                   │
│     └── Deploy to Netlify CDN                                │
│                                                              │
│  5. Live                                                     │
│     └── Site is live at https://xxx.netlify.app              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6.5 Testing Requirements

### 6.5.1 Testing Types

| Type | Description | Tools |
|------|-------------|-------|
| **Unit Testing** | ทดสอบ functions แต่ละตัว | Jest |
| **Component Testing** | ทดสอบ React components | React Testing Library |
| **Integration Testing** | ทดสอบการทำงานร่วมกัน | Jest + RTL |
| **E2E Testing** | ทดสอบ user flows | Playwright (optional) |
| **Manual Testing** | ทดสอบโดยผู้ใช้ | - |

### 6.5.2 Test Coverage Goals

| Area | Target Coverage |
|------|-----------------|
| **Services** | 80% |
| **Utils** | 90% |
| **Components** | 70% |
| **Pages** | 60% |

### 6.5.3 Test Cases (Examples)

#### Authentication Tests

```javascript
describe('Authentication', () => {
  test('should login with valid credentials', async () => {
    // ...
  });
  
  test('should show error with invalid credentials', async () => {
    // ...
  });
  
  test('should register new user', async () => {
    // ...
  });
  
  test('should logout user', async () => {
    // ...
  });
});
```

#### Cart Tests

```javascript
describe('Cart Service', () => {
  test('should add item to cart', async () => {
    // ...
  });
  
  test('should update item quantity', async () => {
    // ...
  });
  
  test('should remove item from cart', async () => {
    // ...
  });
  
  test('should merge duplicate items', async () => {
    // ...
  });
});
```

---

## 6.6 Documentation Requirements

### 6.6.1 Required Documentation

| Document | Description | Status |
|----------|-------------|--------|
| **SRS** | Software Requirements Specification | ✅ This document |
| **README** | Project setup instructions | Required |
| **API Docs** | Service functions documentation | Optional |
| **User Manual** | End-user guide | Optional |

### 6.6.2 Code Documentation

| Type | Standard |
|------|----------|
| **Functions** | JSDoc comments |
| **Components** | PropTypes or TypeScript |
| **Complex Logic** | Inline comments |

---

## 6.7 Maintenance Requirements

### 6.7.1 Monitoring

| Aspect | Tool |
|--------|------|
| **Error Tracking** | Firebase Crashlytics (optional) |
| **Performance** | Firebase Performance (optional) |
| **Analytics** | Firebase Analytics (optional) |
| **Uptime** | Netlify Status |

### 6.7.2 Backup

| Data | Backup Method |
|------|---------------|
| **Firestore** | Firebase automatic backups |
| **Storage** | Firebase automatic backups |
| **Code** | Git repository |

### 6.7.3 Updates

| Type | Frequency |
|------|-----------|
| **Security Patches** | As needed |
| **Dependency Updates** | Monthly |
| **Feature Updates** | As planned |

---

## 6.8 Future Enhancements (Roadmap)

### 6.8.1 Phase 2 Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Mobile App** | React Native app | High |
| **Online Payment** | PromptPay, Credit Card | High |
| **Notifications** | Push notifications | Medium |
| **Reports Export** | PDF/Excel export | Medium |
| **Barcode Scanner** | Scan products | Low |

### 6.8.2 Phase 3 Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Multi-branch** | Support multiple locations | High |
| **Supplier Management** | Manage suppliers | Medium |
| **Purchase Orders** | Create POs | Medium |
| **Advanced Analytics** | Charts and insights | Low |

---

## 6.9 Appendix

### 6.9.1 Glossary

| Term | Definition |
|------|------------|
| **BaaS** | Backend as a Service |
| **CRUD** | Create, Read, Update, Delete |
| **NoSQL** | Non-relational database |
| **SPA** | Single Page Application |
| **SSR** | Server-Side Rendering |
| **CDN** | Content Delivery Network |
| **JWT** | JSON Web Token |
| **PDPA** | Personal Data Protection Act |

### 6.9.2 References

| Resource | URL |
|----------|-----|
| **Firebase Docs** | https://firebase.google.com/docs |
| **React Docs** | https://react.dev |
| **i18next Docs** | https://www.i18next.com |
| **Netlify Docs** | https://docs.netlify.com |

### 6.9.3 Contact

| Role | Contact |
|------|---------|
| **Project Manager** | [TBD] |
| **Lead Developer** | [TBD] |
| **Support** | [TBD] |

---

*เอกสารนี้เป็นส่วนหนึ่งของ Software Requirements Specification สำหรับระบบ InventoryPro*

**Document Version:** 1.0  
**Last Updated:** 11 ธันวาคม 2567  
**Status:** Draft
