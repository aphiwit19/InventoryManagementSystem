# 4. System Features (คุณสมบัติของระบบ)

## 4.1 ภาพรวมคุณสมบัติระบบ

```
┌─────────────────────────────────────────────────────────────────────┐
│                    InventoryPro System Features                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  Authentication │  │    Products     │  │    Inventory    │      │
│  │  & Authorization│  │   Management    │  │   Management    │      │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │
│           │                    │                    │                │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐      │
│  │  • Login        │  │  • Add Product  │  │  • Track Stock  │      │
│  │  • Register     │  │  • Edit Product │  │  • Low Stock    │      │
│  │  • Logout       │  │  • Delete       │  │    Alerts       │      │
│  │  • Role-based   │  │  • Variants     │  │  • History      │      │
│  │    Access       │  │  • Promotions   │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   Shopping      │  │     Orders      │  │    Payments     │      │
│  │     Cart        │  │   Management    │  │   & Coupons     │      │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │
│           │                    │                    │                │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐      │
│  │  • Add to Cart  │  │  • Create Order │  │  • Bank Transfer│      │
│  │  • Update Qty   │  │  • Track Status │  │  • Upload Slip  │      │
│  │  • Remove Item  │  │  • Update Status│  │  • Apply Coupon │      │
│  │  • Checkout     │  │  • Order History│  │  • Manage       │      │
│  │                 │  │                 │  │    Coupons      │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │     Users       │  │    Reports      │  │    Settings     │      │
│  │   Management    │  │   & Dashboard   │  │                 │      │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │
│           │                    │                    │                │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐      │
│  │  • View Users   │  │  • Overview     │  │  • Bank Account │      │
│  │  • Change Role  │  │  • Sales Stats  │  │  • Profile      │      │
│  │  • Profile      │  │  • Top Products │  │  • Language     │      │
│  │  • Addresses    │  │  • Alerts       │  │  • Password     │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 Feature 1: Authentication & Authorization

### 4.2.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F01 |
| **Feature Name** | Authentication & Authorization |
| **Description** | ระบบยืนยันตัวตนและจัดการสิทธิ์การเข้าถึง |
| **Priority** | Critical |
| **Related Pages** | LoginPage, RegisterPage, ProtectedRoute |

### 4.2.2 Sub-features

| Sub-feature | Description |
|-------------|-------------|
| **Login** | เข้าสู่ระบบด้วย Email/Password |
| **Register** | ลงทะเบียนผู้ใช้ใหม่ |
| **Logout** | ออกจากระบบ |
| **Role-based Access** | ควบคุมการเข้าถึงตาม Role (Admin/Staff/Customer) |
| **Auto Redirect** | Redirect ไปหน้าที่เหมาะสมตาม Role |

### 4.2.3 Use Cases

#### UC-AUTH-01: User Login

```
┌─────────────────────────────────────────────────────────────┐
│ Use Case: User Login                                         │
├─────────────────────────────────────────────────────────────┤
│ Actor: User (Admin/Staff/Customer)                           │
│ Pre-condition: User has an account                           │
│ Post-condition: User is logged in and redirected             │
├─────────────────────────────────────────────────────────────┤
│ Main Flow:                                                   │
│ 1. User navigates to /login                                  │
│ 2. User enters email and password                            │
│ 3. User clicks "Login" button                                │
│ 4. System validates credentials                              │
│ 5. System creates session                                    │
│ 6. System redirects based on role:                           │
│    - Admin → /admin/dashboard                                │
│    - Staff → /staff                                          │
│    - Customer → /customer                                    │
├─────────────────────────────────────────────────────────────┤
│ Alternative Flow:                                            │
│ 4a. Invalid credentials:                                     │
│     - System shows error message                             │
│     - User remains on login page                             │
└─────────────────────────────────────────────────────────────┘
```

#### UC-AUTH-02: User Registration

```
┌─────────────────────────────────────────────────────────────┐
│ Use Case: User Registration                                  │
├─────────────────────────────────────────────────────────────┤
│ Actor: New User                                              │
│ Pre-condition: Email not already registered                  │
│ Post-condition: New account created with "customer" role     │
├─────────────────────────────────────────────────────────────┤
│ Main Flow:                                                   │
│ 1. User navigates to /register                               │
│ 2. User enters email, password, confirm password             │
│ 3. User clicks "Register" button                             │
│ 4. System validates input                                    │
│ 5. System creates Firebase Auth account                      │
│ 6. System creates user profile in Firestore                  │
│ 7. System logs in user automatically                         │
│ 8. System redirects to /customer                             │
├─────────────────────────────────────────────────────────────┤
│ Alternative Flow:                                            │
│ 4a. Email already exists:                                    │
│     - System shows error message                             │
│ 4b. Passwords don't match:                                   │
│     - System shows error message                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4.3 Feature 2: Product Management

### 4.3.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F02 |
| **Feature Name** | Product Management |
| **Description** | จัดการสินค้าในระบบ (CRUD) |
| **Priority** | Critical |
| **Access** | Admin only |
| **Related Pages** | ProductsPage, AdminDashboard (Add), EditProductPage |

### 4.3.2 Sub-features

| Sub-feature | Description |
|-------------|-------------|
| **Add Product** | เพิ่มสินค้าใหม่ |
| **Edit Product** | แก้ไขข้อมูลสินค้า |
| **Delete Product** | ลบสินค้า |
| **View Products** | ดูรายการสินค้า |
| **Manage Variants** | จัดการ Size/Color |
| **Set Promotion** | ตั้งราคาโปรโมชั่น |
| **Upload Image** | อัพโหลดรูปสินค้า |

### 4.3.3 Use Cases

#### UC-PROD-01: Add New Product

```
┌─────────────────────────────────────────────────────────────┐
│ Use Case: Add New Product                                    │
├─────────────────────────────────────────────────────────────┤
│ Actor: Admin                                                 │
│ Pre-condition: Admin is logged in                            │
│ Post-condition: New product added to database                │
├─────────────────────────────────────────────────────────────┤
│ Main Flow:                                                   │
│ 1. Admin navigates to /admin/addproduct                      │
│ 2. Admin fills product information:                          │
│    - Product Name (required)                                 │
│    - Description                                             │
│    - Category                                                │
│    - Unit                                                    │
│    - Image                                                   │
│ 3. Admin chooses product type:                               │
│    a. Without Variants:                                      │
│       - Cost Price, Sell Price, Quantity                     │
│    b. With Variants:                                         │
│       - Add Size/Color combinations                          │
│       - Set price and quantity per variant                   │
│ 4. Admin clicks "Save" button                                │
│ 5. System validates input                                    │
│ 6. System saves product to Firestore                         │
│ 7. System records inventory history                          │
│ 8. System shows success message                              │
├─────────────────────────────────────────────────────────────┤
│ Alternative Flow:                                            │
│ 5a. Validation fails:                                        │
│     - System shows error message                             │
│     - Admin corrects input                                   │
└─────────────────────────────────────────────────────────────┘
```

#### UC-PROD-02: Edit Product with Variants

```
┌─────────────────────────────────────────────────────────────┐
│ Use Case: Edit Product with Variants                         │
├─────────────────────────────────────────────────────────────┤
│ Actor: Admin                                                 │
│ Pre-condition: Product exists in system                      │
│ Post-condition: Product information updated                  │
├─────────────────────────────────────────────────────────────┤
│ Main Flow:                                                   │
│ 1. Admin navigates to /admin/products                        │
│ 2. Admin clicks "Edit" on a product                          │
│ 3. System loads product data                                 │
│ 4. Admin modifies information:                               │
│    - Basic info (name, description, etc.)                    │
│    - Variants (add/remove/update)                            │
│    - Promotion settings                                      │
│ 5. Admin clicks "Save" button                                │
│ 6. System validates and saves changes                        │
│ 7. System shows success message                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3.4 Product Data Structure

```javascript
{
  id: "product_id",
  productName: "เสื้อยืด",
  description: "เสื้อยืดคอกลม",
  category: "เสื้อผ้า",
  unit: "ตัว",
  image: "https://...",
  hasVariants: true,
  variants: [
    {
      size: "M",
      color: "ดำ",
      quantity: 50,
      costPrice: 100,
      sellPrice: 250,
      reserved: 5,
      staffReserved: 2
    }
  ],
  quantity: 150,        // Total from variants
  reserved: 10,         // Total reserved
  staffReserved: 5,     // Total staff reserved
  costPrice: 100,       // Default display
  sellPrice: 250,       // Default display
  promotion: {
    price: 199,
    startDate: Timestamp,
    endDate: Timestamp
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 4.4 Feature 3: Inventory Management

### 4.4.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F03 |
| **Feature Name** | Inventory Management |
| **Description** | ติดตามและจัดการสต็อกสินค้า |
| **Priority** | High |
| **Access** | Admin only |
| **Related Pages** | InventoryHistoryPage, AdminAlertsPage |

### 4.4.2 Sub-features

| Sub-feature | Description |
|-------------|-------------|
| **Track Stock** | ติดตามจำนวนสินค้าคงคลัง |
| **Reserve Stock** | จองสต็อกเมื่อมีคำสั่งซื้อ |
| **Deduct Stock** | ตัดสต็อกเมื่อจัดส่งสำเร็จ |
| **Low Stock Alerts** | แจ้งเตือนสินค้าใกล้หมด |
| **Inventory History** | ดูประวัติการเปลี่ยนแปลงสต็อก |

### 4.4.3 Stock Calculation Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    Stock Calculation                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Total Quantity (quantity)                                   │
│         │                                                    │
│         ├── Reserved (reserved)                              │
│         │   └── Customer orders waiting for shipping         │
│         │                                                    │
│         ├── Staff Reserved (staffReserved)                   │
│         │   └── Staff pickup orders waiting                  │
│         │                                                    │
│         └── Available                                        │
│             └── quantity - reserved - staffReserved          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  For Customer: Available = quantity - reserved              │
│  For Staff:    Available = quantity - reserved - staffRes.  │
└─────────────────────────────────────────────────────────────┘
```

### 4.4.4 Low Stock Detection

```javascript
function isLowStock(product) {
  const initial = product.initialQuantity || product.quantity;
  const available = product.quantity - product.reserved;
  
  // Low if less than 20% of initial
  if (initial && available / initial < 0.2) return true;
  
  // Check variants
  if (product.hasVariants && product.variants) {
    for (const v of product.variants) {
      const vAvailable = v.quantity - (v.reserved || 0);
      if (vAvailable <= 5) return true;
    }
  }
  
  return false;
}
```

### 4.4.5 Inventory History Sources

| Source | Type | Description |
|--------|------|-------------|
| `admin_add` | in | Admin เพิ่มสินค้าใหม่ |
| `admin_adjust_inc` | in | Admin เพิ่มจำนวนสต็อก |
| `admin_adjust_dec` | out | Admin ลดจำนวนสต็อก |
| `order_customer_ship_success` | out | ส่งสินค้าให้ลูกค้าสำเร็จ |
| `order_customer_pickup` | out | ลูกค้ารับสินค้าเอง |
| `order_staff_pickup` | out | พนักงานเบิกสินค้า |
| `order_staff_ship_success` | out | ส่งสินค้าให้พนักงานสำเร็จ |

---

## 4.5 Feature 4: Shopping Cart

### 4.5.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F04 |
| **Feature Name** | Shopping Cart |
| **Description** | ตะกร้าสินค้าสำหรับ Staff และ Customer |
| **Priority** | Critical |
| **Access** | Staff, Customer |
| **Related Pages** | CustomerWithdrawPage, WithdrawPage (Staff) |

### 4.5.2 Sub-features

| Sub-feature | Description |
|-------------|-------------|
| **Add to Cart** | เพิ่มสินค้าลงตะกร้า |
| **Update Quantity** | เปลี่ยนจำนวนสินค้า |
| **Remove Item** | ลบสินค้าออกจากตะกร้า |
| **View Cart** | ดูรายการในตะกร้า |
| **Checkout** | ดำเนินการสั่งซื้อ |

### 4.5.3 Use Cases

#### UC-CART-01: Add Product to Cart

```
┌─────────────────────────────────────────────────────────────┐
│ Use Case: Add Product to Cart                                │
├─────────────────────────────────────────────────────────────┤
│ Actor: Customer/Staff                                        │
│ Pre-condition: User is logged in, product has stock          │
│ Post-condition: Product added to cart                        │
├─────────────────────────────────────────────────────────────┤
│ Main Flow:                                                   │
│ 1. User browses products on dashboard                        │
│ 2. User clicks "Add to Cart" on a product                    │
│ 3. If product has variants:                                  │
│    a. Modal opens for variant selection                      │
│    b. User selects size and/or color                         │
│    c. User selects quantity                                  │
│    d. User clicks "Add to Cart"                              │
│ 4. System checks stock availability                          │
│ 5. System adds item to cart (Firebase)                       │
│ 6. System updates cart badge count                           │
│ 7. System shows success message                              │
├─────────────────────────────────────────────────────────────┤
│ Alternative Flow:                                            │
│ 4a. Out of stock:                                            │
│     - System shows error message                             │
│ 5a. Same item exists in cart:                                │
│     - System increases quantity instead of adding new        │
└─────────────────────────────────────────────────────────────┘
```

### 4.5.4 Cart Data Structure

```javascript
// Stored in: users/{uid}/cart/{customer|staff}
{
  items: [
    {
      productId: "prod_123",
      productName: "เสื้อยืด",
      image: "https://...",
      unit: "ตัว",
      quantity: 2,
      sellPrice: 250,
      maxQuantity: 50,
      variantSize: "M",
      variantColor: "ดำ"
    }
  ],
  updatedAt: Timestamp
}
```

---

## 4.6 Feature 5: Order Management

### 4.6.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F05 |
| **Feature Name** | Order Management |
| **Description** | จัดการคำสั่งซื้อและการเบิกสินค้า |
| **Priority** | Critical |
| **Access** | All roles (different permissions) |
| **Related Pages** | AdminOrdersPage, CustomerOrdersPage, StaffOrdersPage |

### 4.6.2 Order Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Order Flow                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Customer/Staff                                                       │
│       │                                                               │
│       ▼                                                               │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │  Cart   │───▶│   Checkout  │───▶│   Payment   │                  │
│  └─────────┘    └─────────────┘    └──────┬──────┘                  │
│                                           │                          │
│                                           ▼                          │
│                                    ┌─────────────┐                   │
│                                    │   Order     │                   │
│                                    │   Created   │                   │
│                                    └──────┬──────┘                   │
│                                           │                          │
│                        ┌──────────────────┼──────────────────┐       │
│                        │                  │                  │       │
│                        ▼                  ▼                  ▼       │
│                   ┌─────────┐       ┌─────────┐       ┌─────────┐   │
│                   │ Pickup  │       │Shipping │       │ Pickup  │   │
│                   │(Staff)  │       │(Customer)│      │(Customer)│   │
│                   └────┬────┘       └────┬────┘       └────┬────┘   │
│                        │                 │                  │        │
│                        ▼                 ▼                  ▼        │
│                   ┌─────────┐       ┌─────────┐       ┌─────────┐   │
│                   │รอดำเนิน │       │รอดำเนิน │       │รอดำเนิน │   │
│                   │  การ    │       │  การ    │       │  การ    │   │
│                   └────┬────┘       └────┬────┘       └────┬────┘   │
│                        │                 │                  │        │
│                        │                 ▼                  │        │
│                        │           ┌─────────┐              │        │
│                        │           │กำลังจัด │              │        │
│                        │           │  ส่ง    │              │        │
│                        │           └────┬────┘              │        │
│                        │                 │                  │        │
│                        │                 ▼                  │        │
│                        │           ┌─────────┐              │        │
│                        │           │ส่งสำเร็จ│              │        │
│                        │           └─────────┘              │        │
│                        │                                    │        │
│                        ▼                                    ▼        │
│                   ┌─────────┐                         ┌─────────┐   │
│                   │รับของ   │                         │รับของ   │   │
│                   │  แล้ว   │                         │  แล้ว   │   │
│                   └─────────┘                         └─────────┘   │
│                                                                       │
│  Legend:                                                              │
│  ───────                                                              │
│  Stock Reserved: เมื่อสร้าง Order                                     │
│  Stock Deducted: เมื่อสถานะเป็น "กำลังจัดส่ง" หรือ "รับของแล้ว"       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.6.3 Order Statuses

| Status | Description | Stock Action |
|--------|-------------|--------------|
| `รอดำเนินการ` | รอ Admin ดำเนินการ | Reserved |
| `กำลังดำเนินการส่ง` | กำลังจัดส่ง | Deducted |
| `ส่งสำเร็จ` | จัดส่งสำเร็จ | - |
| `รับของแล้ว` | รับสินค้าแล้ว (Pickup) | Deducted |

### 4.6.4 Order Data Structure

```javascript
// Stored in: users/{uid}/orders/{orderId}
{
  orderNumber: "ORD-20241211-0001",
  items: [
    {
      productId: "prod_123",
      productName: "เสื้อยืด",
      price: 250,
      quantity: 2,
      subtotal: 500,
      variantSize: "M",
      variantColor: "ดำ"
    }
  ],
  total: 500,
  deliveryMethod: "shipping", // or "pickup"
  shippingStatus: "รอดำเนินการ",
  
  // Shipping info
  requestedAddress: "123 ถนน...",
  shippingCarrier: "Kerry",
  trackingNumber: "TH123456789",
  
  // Payment info
  paymentMethod: "bank_transfer",
  paymentAccount: "กสิกรไทย xxx-x-xxxxx-x",
  paymentSlipUrl: "https://...",
  
  // Metadata
  createdByUid: "user_123",
  createdByEmail: "user@email.com",
  createdSource: "customer", // or "staff"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 4.7 Feature 6: Payment & Coupons

### 4.7.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F06 |
| **Feature Name** | Payment & Coupons |
| **Description** | การชำระเงินและระบบคูปองส่วนลด |
| **Priority** | High |
| **Access** | Customer (Payment), Admin (Coupon Management) |
| **Related Pages** | CustomerPaymentPage, AdminCouponsPage |

### 4.7.2 Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Payment Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Review Order                                             │
│     └── ดูรายการสินค้าและยอดรวม                              │
│                                                              │
│  2. Apply Coupon (Optional)                                  │
│     ├── กรอกรหัสคูปอง                                        │
│     ├── ระบบตรวจสอบความถูกต้อง                               │
│     └── คำนวณส่วนลด                                          │
│                                                              │
│  3. Select Delivery Method                                   │
│     ├── Pickup (รับเอง)                                      │
│     └── Shipping (จัดส่ง)                                    │
│         └── เลือก/กรอกที่อยู่                                 │
│                                                              │
│  4. Select Payment Method                                    │
│     └── โอนเงินผ่านบัญชีธนาคาร                               │
│                                                              │
│  5. Upload Payment Slip                                      │
│     └── อัพโหลดสลิปการโอนเงิน                                │
│                                                              │
│  6. Confirm Order                                            │
│     ├── สร้าง Order                                          │
│     ├── Reserve Stock                                        │
│     ├── Increment Coupon Usage                               │
│     └── Clear Cart                                           │
│                                                              │
│  7. Order Success                                            │
│     └── แสดงหน้ายืนยันพร้อม Order Number                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.7.3 Coupon Types

| Type | Description | Example |
|------|-------------|---------|
| `fixed` | ลดเงินตรง | ลด 100 บาท |
| `percentage` | ลดเปอร์เซ็นต์ | ลด 10% (สูงสุด 500 บาท) |

### 4.7.4 Coupon Validation Rules

```javascript
function validateCoupon(coupon, orderTotal) {
  // 1. Check if active
  if (!coupon.active) throw "คูปองถูกปิดการใช้งาน";
  
  // 2. Check start date
  if (coupon.startDate > now) throw "คูปองยังไม่เริ่มใช้งาน";
  
  // 3. Check end date
  if (coupon.endDate < now) throw "คูปองหมดอายุแล้ว";
  
  // 4. Check usage limit
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw "คูปองถูกใช้ครบจำนวนแล้ว";
  }
  
  // 5. Check minimum purchase
  if (orderTotal < coupon.minPurchase) {
    throw `ยอดซื้อขั้นต่ำ ฿${coupon.minPurchase}`;
  }
  
  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (orderTotal * coupon.value) / 100;
    if (coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.value;
  }
  
  return Math.min(discount, orderTotal);
}
```

### 4.7.5 Coupon Data Structure

```javascript
{
  id: "coupon_123",
  code: "SAVE100",
  type: "fixed",           // or "percentage"
  value: 100,              // 100 baht or 10%
  minPurchase: 500,        // Minimum order amount
  maxDiscount: 0,          // Max discount (for percentage)
  startDate: Timestamp,
  endDate: Timestamp,
  usageLimit: 100,         // 0 = unlimited
  usedCount: 45,
  active: true,
  description: "ลด 100 บาท เมื่อซื้อครบ 500 บาท",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 4.8 Feature 7: User Management

### 4.8.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F07 |
| **Feature Name** | User Management |
| **Description** | จัดการผู้ใช้และโปรไฟล์ |
| **Priority** | High |
| **Access** | Admin (User List), All (Profile) |
| **Related Pages** | UsersPage, ProfilePage |

### 4.8.2 Sub-features

| Sub-feature | Access | Description |
|-------------|--------|-------------|
| **View Users** | Admin | ดูรายการผู้ใช้ทั้งหมด |
| **Change Role** | Admin | เปลี่ยน Role ผู้ใช้ |
| **Edit Profile** | All | แก้ไขข้อมูลส่วนตัว |
| **Upload Photo** | All | อัพโหลดรูปโปรไฟล์ |
| **Manage Addresses** | All | จัดการที่อยู่ |
| **Change Password** | All | เปลี่ยนรหัสผ่าน |

### 4.8.3 User Data Structure

```javascript
// Stored in: users/{uid}
{
  id: "user_123",
  email: "user@email.com",
  displayName: "John Doe",
  firstName: "John",
  lastName: "Doe",
  phone: "0812345678",
  birthDate: "1990-01-15",
  photoURL: "https://...",
  role: "customer",        // admin, staff, customer
  addresses: [
    {
      id: "addr_123",
      name: "บ้าน",
      address: "123 ถนน...",
      district: "เขต...",
      city: "แขวง...",
      province: "กรุงเทพฯ",
      postalCode: "10110",
      phone: "0812345678",
      isDefault: true,
      createdAt: Date
    }
  ],
  settings: {
    emailNotifications: true,
    promotions: true,
    smsNotifications: false
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 4.9 Feature 8: Reports & Dashboard

### 4.9.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F08 |
| **Feature Name** | Reports & Dashboard |
| **Description** | รายงานและ Dashboard สรุปข้อมูล |
| **Priority** | Medium |
| **Access** | Admin only |
| **Related Pages** | AdminOverviewPage, AdminAlertsPage |

### 4.9.2 Dashboard Widgets

| Widget | Description |
|--------|-------------|
| **Total Products** | จำนวนสินค้าทั้งหมด |
| **Total Orders** | จำนวนคำสั่งซื้อทั้งหมด |
| **Total Revenue** | ยอดขายรวม |
| **Low Stock Count** | จำนวนสินค้าสต็อกต่ำ |
| **Recent Orders** | คำสั่งซื้อล่าสุด |
| **Top Products** | สินค้าขายดี |
| **Low Stock Items** | รายการสินค้าสต็อกต่ำ |

### 4.9.3 Alerts Page

| Alert Type | Condition | Action |
|------------|-----------|--------|
| **Low Stock** | Available < 20% หรือ ≤ 5 | แสดงรายการสินค้า + ปุ่มไปหน้าแก้ไข |
| **Variant Low Stock** | Variant Available ≤ 5 | แสดง Size/Color ที่ต่ำ |

---

## 4.10 Feature 9: Settings

### 4.10.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F09 |
| **Feature Name** | Settings |
| **Description** | การตั้งค่าระบบ |
| **Priority** | Medium |
| **Access** | Admin (Bank), All (Language) |
| **Related Pages** | AdminBankAccountPage, LanguageSwitcher |

### 4.10.2 Sub-features

| Sub-feature | Access | Description |
|-------------|--------|-------------|
| **Bank Accounts** | Admin | จัดการบัญชีธนาคารสำหรับรับชำระเงิน |
| **Language** | All | เปลี่ยนภาษา (ไทย/อังกฤษ) |

### 4.10.3 Bank Account Data Structure

```javascript
// Stored in: settings/payment
{
  bankAccounts: [
    {
      id: "bank_123",
      bankName: "กสิกรไทย",
      accountNumber: "xxx-x-xxxxx-x",
      accountName: "บริษัท ABC จำกัด",
      isActive: true
    }
  ]
}
```

---

## 4.11 Feature 10: Internationalization (i18n)

### 4.11.1 รายละเอียดฟีเจอร์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **Feature ID** | F10 |
| **Feature Name** | Internationalization |
| **Description** | รองรับหลายภาษา |
| **Priority** | Medium |
| **Supported Languages** | Thai (th), English (en) |
| **Library** | i18next, react-i18next |

### 4.11.2 Translation Structure

```
src/i18n/
├── index.js           # i18n configuration
└── locales/
    ├── th/
    │   └── translation.json
    └── en/
        └── translation.json
```

### 4.11.3 Translation Keys

```javascript
{
  "common": {
    "save": "บันทึก",
    "cancel": "ยกเลิก",
    "delete": "ลบ",
    "edit": "แก้ไข",
    "loading": "กำลังโหลด..."
  },
  "product": {
    "product_name": "ชื่อสินค้า",
    "price": "ราคา",
    "quantity": "จำนวน"
  },
  "order": {
    "order_number": "เลขที่คำสั่งซื้อ",
    "status": "สถานะ"
  }
}
```

---

*เอกสารนี้เป็นส่วนหนึ่งของ Software Requirements Specification สำหรับระบบ InventoryPro*
