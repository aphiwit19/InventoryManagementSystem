# 3. Specific Requirements (ความต้องการเฉพาะ)

## 3.1 Functional Requirements (ความต้องการเชิงหน้าที่)

### 3.1.1 โมดูลการยืนยันตัวตน (Authentication Module)

#### FR-AUTH-001: การลงทะเบียนผู้ใช้ใหม่

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-AUTH-001 |
| **ชื่อ** | User Registration |
| **คำอธิบาย** | ระบบต้องอนุญาตให้ผู้ใช้ใหม่สามารถลงทะเบียนด้วย Email และ Password |
| **Input** | Email, Password, Confirm Password |
| **Output** | บัญชีผู้ใช้ใหม่ถูกสร้าง, Redirect ไปหน้า Dashboard |
| **Pre-condition** | Email ยังไม่เคยถูกใช้ลงทะเบียน |
| **Post-condition** | ผู้ใช้ได้รับ Role เป็น "customer" โดยอัตโนมัติ |
| **Priority** | Critical |

**Business Rules:**
- Password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร
- Email ต้องอยู่ในรูปแบบที่ถูกต้อง
- Password และ Confirm Password ต้องตรงกัน

#### FR-AUTH-002: การเข้าสู่ระบบ

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-AUTH-002 |
| **ชื่อ** | User Login |
| **คำอธิบาย** | ระบบต้องอนุญาตให้ผู้ใช้เข้าสู่ระบบด้วย Email และ Password |
| **Input** | Email, Password |
| **Output** | Session ถูกสร้าง, Redirect ไปหน้า Dashboard ตาม Role |
| **Pre-condition** | ผู้ใช้มีบัญชีอยู่ในระบบ |
| **Post-condition** | ผู้ใช้สามารถเข้าถึงฟังก์ชันตาม Role |
| **Priority** | Critical |

**Redirect Logic:**
- Admin → `/admin/dashboard`
- Staff → `/staff`
- Customer → `/customer`

#### FR-AUTH-003: การออกจากระบบ

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-AUTH-003 |
| **ชื่อ** | User Logout |
| **คำอธิบาย** | ระบบต้องอนุญาตให้ผู้ใช้ออกจากระบบ |
| **Input** | Click Logout Button |
| **Output** | Session ถูกลบ, Redirect ไปหน้า Login |
| **Pre-condition** | ผู้ใช้เข้าสู่ระบบอยู่ |
| **Post-condition** | ผู้ใช้ไม่สามารถเข้าถึงหน้าที่ต้อง Login |
| **Priority** | Critical |

#### FR-AUTH-004: การป้องกัน Route

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-AUTH-004 |
| **ชื่อ** | Protected Routes |
| **คำอธิบาย** | ระบบต้องป้องกันการเข้าถึงหน้าที่ต้องการ Authentication |
| **Input** | URL Request |
| **Output** | อนุญาตหรือ Redirect ไปหน้า Login |
| **Pre-condition** | - |
| **Post-condition** | เฉพาะผู้ใช้ที่มีสิทธิ์เท่านั้นที่เข้าถึงได้ |
| **Priority** | Critical |

---

### 3.1.2 โมดูลการจัดการสินค้า (Product Management Module)

#### FR-PROD-001: การเพิ่มสินค้าใหม่

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PROD-001 |
| **ชื่อ** | Add New Product |
| **คำอธิบาย** | Admin สามารถเพิ่มสินค้าใหม่เข้าสู่ระบบ |
| **Input** | ชื่อสินค้า, รายละเอียด, ราคาทุน, ราคาขาย, จำนวน, หน่วย, หมวดหมู่, รูปภาพ, Variants (optional) |
| **Output** | สินค้าใหม่ถูกบันทึกในฐานข้อมูล |
| **Pre-condition** | ผู้ใช้เป็น Admin |
| **Post-condition** | สินค้าปรากฏในรายการสินค้า, บันทึก Inventory History |
| **Priority** | Critical |

**Business Rules:**
- ชื่อสินค้าต้องไม่ว่าง
- ราคาต้องเป็นตัวเลขบวก
- จำนวนต้องเป็นจำนวนเต็มบวก
- รองรับ Variants (Size/Color) หรือไม่มี Variants

#### FR-PROD-002: การแก้ไขสินค้า

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PROD-002 |
| **ชื่อ** | Edit Product |
| **คำอธิบาย** | Admin สามารถแก้ไขข้อมูลสินค้าที่มีอยู่ |
| **Input** | Product ID, ข้อมูลที่ต้องการแก้ไข |
| **Output** | ข้อมูลสินค้าถูกอัพเดท |
| **Pre-condition** | ผู้ใช้เป็น Admin, สินค้ามีอยู่ในระบบ |
| **Post-condition** | ข้อมูลสินค้าถูกอัพเดทในฐานข้อมูล |
| **Priority** | High |

#### FR-PROD-003: การลบสินค้า

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PROD-003 |
| **ชื่อ** | Delete Product |
| **คำอธิบาย** | Admin สามารถลบสินค้าออกจากระบบ |
| **Input** | Product ID |
| **Output** | สินค้าถูกลบออกจากฐานข้อมูล |
| **Pre-condition** | ผู้ใช้เป็น Admin, สินค้ามีอยู่ในระบบ |
| **Post-condition** | สินค้าไม่ปรากฏในรายการ |
| **Priority** | High |

#### FR-PROD-004: การดูรายการสินค้า

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PROD-004 |
| **ชื่อ** | View Products List |
| **คำอธิบาย** | ผู้ใช้สามารถดูรายการสินค้าทั้งหมด |
| **Input** | - |
| **Output** | รายการสินค้าพร้อมรายละเอียด |
| **Pre-condition** | ผู้ใช้เข้าสู่ระบบแล้ว |
| **Post-condition** | - |
| **Priority** | Critical |

**Features:**
- ค้นหาตามชื่อสินค้า
- กรองตามหมวดหมู่
- แบ่งหน้า (Pagination)
- แสดงสถานะสต็อก

#### FR-PROD-005: การจัดการ Variants

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PROD-005 |
| **ชื่อ** | Manage Product Variants |
| **คำอธิบาย** | Admin สามารถจัดการ Variants (Size/Color) ของสินค้า |
| **Input** | Size, Color, Quantity, Cost Price, Sell Price |
| **Output** | Variants ถูกบันทึกพร้อมสินค้า |
| **Pre-condition** | ผู้ใช้เป็น Admin |
| **Post-condition** | สินค้ามี Variants ที่กำหนด |
| **Priority** | High |

**Default Options:**
- Sizes: XS, S, M, L, XL, XXL, XXXL
- Colors: ดำ, ขาว, แดง, น้ำเงิน, เขียว, เหลือง, ส้ม, ชมพู, ม่วง, เทา, น้ำตาล, ครีม

#### FR-PROD-006: การตั้งโปรโมชั่น

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PROD-006 |
| **ชื่อ** | Set Product Promotion |
| **คำอธิบาย** | Admin สามารถตั้งราคาโปรโมชั่นสำหรับสินค้า |
| **Input** | Promotion Price, Start Date, End Date |
| **Output** | โปรโมชั่นถูกบันทึก |
| **Pre-condition** | ผู้ใช้เป็น Admin, สินค้ามีอยู่ในระบบ |
| **Post-condition** | สินค้าแสดงราคาโปรโมชั่นในช่วงเวลาที่กำหนด |
| **Priority** | Medium |

---

### 3.1.3 โมดูลการจัดการสต็อก (Inventory Management Module)

#### FR-INV-001: การติดตามจำนวนสินค้า

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-INV-001 |
| **ชื่อ** | Track Inventory Quantity |
| **คำอธิบาย** | ระบบต้องติดตามจำนวนสินค้าคงคลัง |
| **Fields** | quantity (จำนวนทั้งหมด), reserved (จองแล้ว), staffReserved (พนักงานจอง) |
| **Calculation** | Available = quantity - reserved - staffReserved |
| **Priority** | Critical |

#### FR-INV-002: การแจ้งเตือนสต็อกต่ำ

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-INV-002 |
| **ชื่อ** | Low Stock Alert |
| **คำอธิบาย** | ระบบต้องแจ้งเตือนเมื่อสินค้ามีจำนวนต่ำ |
| **Condition** | Available < 20% ของ Initial Quantity หรือ Available ≤ 5 |
| **Output** | แสดงในหน้า Alerts และ Dashboard |
| **Priority** | High |

#### FR-INV-003: การบันทึกประวัติสต็อก

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-INV-003 |
| **ชื่อ** | Inventory History |
| **คำอธิบาย** | ระบบต้องบันทึกประวัติการเปลี่ยนแปลงสต็อก |
| **Fields** | date, costPrice, quantity, type (in/out), source, orderId, actorUid |
| **Sources** | admin_add, admin_adjust_inc, admin_adjust_dec, order_customer_ship_success, order_staff_pickup |
| **Priority** | High |

---

### 3.1.4 โมดูลตะกร้าสินค้า (Cart Module)

#### FR-CART-001: การเพิ่มสินค้าลงตะกร้า

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-CART-001 |
| **ชื่อ** | Add to Cart |
| **คำอธิบาย** | ผู้ใช้สามารถเพิ่มสินค้าลงตะกร้า |
| **Input** | Product ID, Quantity, Variant (optional) |
| **Output** | สินค้าถูกเพิ่มในตะกร้า |
| **Pre-condition** | ผู้ใช้เป็น Staff หรือ Customer, สินค้ามีสต็อก |
| **Post-condition** | ตะกร้าถูกอัพเดท |
| **Priority** | Critical |

**Business Rules:**
- ถ้าสินค้า+Variant เดียวกันมีอยู่แล้ว ให้เพิ่มจำนวน
- จำนวนต้องไม่เกินสต็อกที่มี
- ตะกร้าแยกตาม Role (Staff/Customer)

#### FR-CART-002: การอัพเดทจำนวนในตะกร้า

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-CART-002 |
| **ชื่อ** | Update Cart Item Quantity |
| **คำอธิบาย** | ผู้ใช้สามารถเปลี่ยนจำนวนสินค้าในตะกร้า |
| **Input** | Product ID, New Quantity, Variant |
| **Output** | จำนวนถูกอัพเดท |
| **Pre-condition** | สินค้ามีอยู่ในตะกร้า |
| **Post-condition** | ตะกร้าถูกอัพเดท |
| **Priority** | High |

#### FR-CART-003: การลบสินค้าออกจากตะกร้า

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-CART-003 |
| **ชื่อ** | Remove from Cart |
| **คำอธิบาย** | ผู้ใช้สามารถลบสินค้าออกจากตะกร้า |
| **Input** | Product ID, Variant |
| **Output** | สินค้าถูกลบออกจากตะกร้า |
| **Pre-condition** | สินค้ามีอยู่ในตะกร้า |
| **Post-condition** | ตะกร้าถูกอัพเดท |
| **Priority** | High |

#### FR-CART-004: การล้างตะกร้า

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-CART-004 |
| **ชื่อ** | Clear Cart |
| **คำอธิบาย** | ระบบล้างตะกร้าหลังสร้างคำสั่งซื้อสำเร็จ |
| **Input** | - |
| **Output** | ตะกร้าว่าง |
| **Pre-condition** | คำสั่งซื้อถูกสร้างสำเร็จ |
| **Post-condition** | ตะกร้าว่าง |
| **Priority** | High |

---

### 3.1.5 โมดูลการสั่งซื้อ (Order Module)

#### FR-ORD-001: การสร้างคำสั่งซื้อ

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-ORD-001 |
| **ชื่อ** | Create Order (Withdrawal) |
| **คำอธิบาย** | ผู้ใช้สามารถสร้างคำสั่งซื้อ/เบิกสินค้า |
| **Input** | Items, Delivery Method, Address, Payment Info |
| **Output** | Order ถูกสร้าง, Order Number ถูก Generate |
| **Pre-condition** | ตะกร้ามีสินค้า, สต็อกเพียงพอ |
| **Post-condition** | สต็อกถูก Reserve, ตะกร้าถูกล้าง |
| **Priority** | Critical |

**Order Number Format:** `ORD-YYYYMMDD-0001`

**Delivery Methods:**
- `pickup` - รับสินค้าเอง
- `shipping` - จัดส่ง

#### FR-ORD-002: การดูรายการคำสั่งซื้อ

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-ORD-002 |
| **ชื่อ** | View Orders List |
| **คำอธิบาย** | ผู้ใช้สามารถดูรายการคำสั่งซื้อ |
| **Admin** | ดูคำสั่งทั้งหมด |
| **Staff/Customer** | ดูเฉพาะคำสั่งของตนเอง |
| **Priority** | Critical |

**Features:**
- ค้นหาตาม Order Number
- กรองตามสถานะ
- แบ่งหน้า (Pagination)

#### FR-ORD-003: การดูรายละเอียดคำสั่งซื้อ

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-ORD-003 |
| **ชื่อ** | View Order Detail |
| **คำอธิบาย** | ผู้ใช้สามารถดูรายละเอียดคำสั่งซื้อ |
| **Output** | รายการสินค้า, ที่อยู่, สถานะ, ข้อมูลการชำระเงิน |
| **Priority** | High |

#### FR-ORD-004: การอัพเดทสถานะคำสั่งซื้อ

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-ORD-004 |
| **ชื่อ** | Update Order Status |
| **คำอธิบาย** | Admin สามารถอัพเดทสถานะคำสั่งซื้อ |
| **Input** | Order ID, New Status, Tracking Number (optional) |
| **Output** | สถานะถูกอัพเดท |
| **Pre-condition** | ผู้ใช้เป็น Admin |
| **Post-condition** | สถานะถูกอัพเดท, สต็อกถูกตัด (ถ้าสถานะเป็น "กำลังจัดส่ง" หรือ "รับของแล้ว") |
| **Priority** | Critical |

**Order Statuses:**
- `รอดำเนินการ` - รอ Admin ดำเนินการ
- `กำลังดำเนินการส่ง` - กำลังจัดส่ง (ตัดสต็อก)
- `ส่งสำเร็จ` - จัดส่งสำเร็จ
- `รับของแล้ว` - รับสินค้าแล้ว (สำหรับ Pickup)

---

### 3.1.6 โมดูลการชำระเงิน (Payment Module)

#### FR-PAY-001: การเลือกวิธีชำระเงิน

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PAY-001 |
| **ชื่อ** | Select Payment Method |
| **คำอธิบาย** | Customer สามารถเลือกวิธีชำระเงิน |
| **Options** | โอนเงินผ่านบัญชีธนาคาร |
| **Priority** | High |

#### FR-PAY-002: การอัพโหลดสลิป

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PAY-002 |
| **ชื่อ** | Upload Payment Slip |
| **คำอธิบาย** | Customer สามารถอัพโหลดสลิปการชำระเงิน |
| **Input** | Image File |
| **Output** | สลิปถูกบันทึกใน Firebase Storage |
| **Pre-condition** | มีคำสั่งซื้อที่รอชำระเงิน |
| **Post-condition** | สลิปถูกแนบกับคำสั่งซื้อ |
| **Priority** | High |

#### FR-PAY-003: การใช้คูปอง

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-PAY-003 |
| **ชื่อ** | Apply Coupon |
| **คำอธิบาย** | Customer สามารถใช้คูปองส่วนลด |
| **Input** | Coupon Code |
| **Output** | ส่วนลดถูกคำนวณ, ยอดรวมถูกอัพเดท |
| **Pre-condition** | คูปองถูกต้องและยังใช้ได้ |
| **Post-condition** | จำนวนการใช้คูปองเพิ่มขึ้น |
| **Priority** | Medium |

---

### 3.1.7 โมดูลคูปอง (Coupon Module)

#### FR-CPN-001: การสร้างคูปอง

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-CPN-001 |
| **ชื่อ** | Create Coupon |
| **คำอธิบาย** | Admin สามารถสร้างคูปองใหม่ |
| **Input** | Code, Type, Value, Min Purchase, Max Discount, Start/End Date, Usage Limit |
| **Output** | คูปองถูกสร้าง |
| **Pre-condition** | ผู้ใช้เป็น Admin, Code ไม่ซ้ำ |
| **Post-condition** | คูปองพร้อมใช้งาน |
| **Priority** | Medium |

**Coupon Types:**
- `fixed` - ลดเงินตรง (เช่น ลด 100 บาท)
- `percentage` - ลดเปอร์เซ็นต์ (เช่น ลด 10%)

#### FR-CPN-002: การตรวจสอบคูปอง

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-CPN-002 |
| **ชื่อ** | Validate Coupon |
| **คำอธิบาย** | ระบบตรวจสอบความถูกต้องของคูปอง |
| **Validations** | Code ถูกต้อง, Active, ไม่หมดอายุ, ไม่เกิน Usage Limit, ยอดซื้อขั้นต่ำ |
| **Priority** | Medium |

---

### 3.1.8 โมดูลการจัดการผู้ใช้ (User Management Module)

#### FR-USR-001: การดูรายการผู้ใช้

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-USR-001 |
| **ชื่อ** | View Users List |
| **คำอธิบาย** | Admin สามารถดูรายการผู้ใช้ทั้งหมด |
| **Output** | รายการผู้ใช้พร้อม Email และ Role |
| **Pre-condition** | ผู้ใช้เป็น Admin |
| **Priority** | High |

#### FR-USR-002: การเปลี่ยน Role ผู้ใช้

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-USR-002 |
| **ชื่อ** | Change User Role |
| **คำอธิบาย** | Admin สามารถเปลี่ยน Role ของผู้ใช้ |
| **Input** | User ID, New Role |
| **Output** | Role ถูกอัพเดท |
| **Pre-condition** | ผู้ใช้เป็น Admin |
| **Post-condition** | ผู้ใช้มีสิทธิ์ตาม Role ใหม่ |
| **Priority** | High |

#### FR-USR-003: การจัดการโปรไฟล์

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-USR-003 |
| **ชื่อ** | Manage Profile |
| **คำอธิบาย** | ผู้ใช้สามารถจัดการข้อมูลส่วนตัว |
| **Fields** | First Name, Last Name, Phone, Birth Date, Photo |
| **Priority** | Medium |

#### FR-USR-004: การจัดการที่อยู่

| หัวข้อ | รายละเอียด |
|--------|------------|
| **รหัส** | FR-USR-004 |
| **ชื่อ** | Manage Addresses |
| **คำอธิบาย** | ผู้ใช้สามารถเพิ่ม แก้ไข ลบ ที่อยู่ |
| **Fields** | Name, Address, District, City, Province, Postal Code, Phone |
| **Features** | ตั้งที่อยู่เริ่มต้น (Default) |
| **Priority** | Medium |

---

## 3.2 Non-functional Requirements (ความต้องการที่ไม่ใช่เชิงหน้าที่)

### 3.2.1 Performance Requirements (ความต้องการด้านประสิทธิภาพ)

| รหัส | ความต้องการ | เกณฑ์ |
|------|-------------|-------|
| **NFR-PERF-001** | Page Load Time | หน้าเว็บต้องโหลดเสร็จภายใน 3 วินาที |
| **NFR-PERF-002** | API Response Time | API ต้องตอบกลับภายใน 2 วินาที |
| **NFR-PERF-003** | Concurrent Users | รองรับผู้ใช้พร้อมกันอย่างน้อย 100 คน |
| **NFR-PERF-004** | Image Upload | อัพโหลดรูปภาพเสร็จภายใน 5 วินาที (ไฟล์ ≤ 5MB) |

### 3.2.2 Security Requirements (ความต้องการด้านความปลอดภัย)

| รหัส | ความต้องการ | รายละเอียด |
|------|-------------|------------|
| **NFR-SEC-001** | Authentication | ใช้ Firebase Authentication |
| **NFR-SEC-002** | Authorization | ตรวจสอบ Role ก่อนเข้าถึงทุกหน้า |
| **NFR-SEC-003** | Data Encryption | ใช้ HTTPS สำหรับการสื่อสารทั้งหมด |
| **NFR-SEC-004** | Password Policy | Password ต้องมีอย่างน้อย 6 ตัวอักษร |
| **NFR-SEC-005** | Session Management | Session หมดอายุเมื่อ Logout หรือปิด Browser |

### 3.2.3 Usability Requirements (ความต้องการด้านการใช้งาน)

| รหัส | ความต้องการ | รายละเอียด |
|------|-------------|------------|
| **NFR-USE-001** | Responsive Design | รองรับหน้าจอ Desktop และ Tablet |
| **NFR-USE-002** | Multi-language | รองรับภาษาไทยและอังกฤษ |
| **NFR-USE-003** | Error Messages | แสดงข้อความ Error ที่เข้าใจง่าย |
| **NFR-USE-004** | Loading States | แสดง Loading Indicator ขณะโหลดข้อมูล |
| **NFR-USE-005** | Confirmation Dialogs | แสดง Confirm ก่อนการลบข้อมูล |

### 3.2.4 Reliability Requirements (ความต้องการด้านความน่าเชื่อถือ)

| รหัส | ความต้องการ | เกณฑ์ |
|------|-------------|-------|
| **NFR-REL-001** | Uptime | ระบบต้องพร้อมใช้งาน 99% ของเวลา |
| **NFR-REL-002** | Data Backup | Firebase มี Backup อัตโนมัติ |
| **NFR-REL-003** | Error Handling | ระบบต้องจัดการ Error อย่างเหมาะสม |
| **NFR-REL-004** | Data Consistency | ใช้ Transaction สำหรับการอัพเดทสต็อก |

### 3.2.5 Maintainability Requirements (ความต้องการด้านการบำรุงรักษา)

| รหัส | ความต้องการ | รายละเอียด |
|------|-------------|------------|
| **NFR-MNT-001** | Code Structure | แยก Layer (Pages, Services, Repositories) |
| **NFR-MNT-002** | Documentation | มีเอกสาร SRS และ Code Comments |
| **NFR-MNT-003** | Version Control | ใช้ Git สำหรับ Version Control |

---

## 3.3 Interface Requirements (ความต้องการด้าน Interface)

### 3.3.1 User Interface Requirements

| รหัส | ความต้องการ | รายละเอียด |
|------|-------------|------------|
| **NFR-UI-001** | Design Style | Modern, Clean, Professional |
| **NFR-UI-002** | Color Scheme | Blue Gradient Theme (#2D9CDB, #56CCF2) |
| **NFR-UI-003** | Typography | Sans-serif Font, อ่านง่าย |
| **NFR-UI-004** | Navigation | Sidebar สำหรับ Admin/Staff, Bottom Nav สำหรับ Customer |
| **NFR-UI-005** | Icons | ใช้ PNG Icons และ Emoji |

### 3.3.2 API Requirements

| รหัส | ความต้องการ | รายละเอียด |
|------|-------------|------------|
| **NFR-API-001** | Firebase SDK | ใช้ Firebase JavaScript SDK |
| **NFR-API-002** | Real-time | ใช้ Firestore Real-time Listeners (ถ้าจำเป็น) |
| **NFR-API-003** | Error Handling | Return Error Messages ที่ชัดเจน |

### 3.3.3 Database Requirements

| รหัส | ความต้องการ | รายละเอียด |
|------|-------------|------------|
| **NFR-DB-001** | Database Type | Cloud Firestore (NoSQL) |
| **NFR-DB-002** | Data Structure | Document-based Collections |
| **NFR-DB-003** | Indexing | สร้าง Index สำหรับ Query ที่ใช้บ่อย |

---

*เอกสารนี้เป็นส่วนหนึ่งของ Software Requirements Specification สำหรับระบบ InventoryPro*
