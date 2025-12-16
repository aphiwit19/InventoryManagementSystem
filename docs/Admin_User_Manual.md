# คู่มือการใช้งานระบบ (Admin)

เอกสารฉบับนี้เป็นคู่มือการใช้งานสำหรับผู้ดูแลระบบ (Admin) ของระบบ Inventory Management โดยอธิบายการทำงานของแต่ละหน้าในฝั่ง Admin แยกเป็นรายงาน พร้อมหน้าที่/วัตถุประสงค์ และขั้นตอนการใช้งานหลัก

---

## 1) ภาพรวมระบบฝั่ง Admin

### 1.1 บทบาท (Role)
- Admin สามารถเข้าหน้า `/admin/*` ได้
- ใช้สำหรับ:
  - จัดการสินค้า (เพิ่ม/แก้ไข/ดูสต็อก)
  - จัดการคำสั่งซื้อ (Customer orders / Staff withdrawals)
  - จัดการผู้ใช้งานและสิทธิ์ (roles)
  - ตั้งค่าบัญชีรับชำระเงิน
  - ตรวจสอบสินค้าใกล้หมด
  - ตรวจสอบประวัติการเคลื่อนไหวสต็อก
  - จัดการโปรไฟล์ผู้ดูแล

### 1.2 เส้นทาง (Routes) ที่เกี่ยวข้อง
อ้างอิงจากไฟล์: `src/App.js`

- `/admin` → Redirect ไป `/admin/dashboard`
- `/admin/dashboard` → Admin Dashboard/Overview
- `/admin/alerts` → Low Stock Alerts
- `/admin/products` → Products Management
- `/admin/addproduct` → Add Product
- `/admin/products/:id/edit` → Edit Product
- `/admin/products/:id/history` → Inventory History (เฉพาะสินค้า)
- `/admin/inventory_history` → Inventory In/Out History (รวมทั้งระบบ)
- `/admin/orders?source=customer|staff|all` → Orders List
- `/admin/orders/:id` → Order Detail
- `/admin/users` → Manage Users
- `/admin/payment-account` → Payment Account Settings
- `/admin/profile` → Admin Profile

---

## 2) คู่มือแยกตามหน้า (รายงานการทำงาน)

> รูปแบบหัวข้อในแต่ละหน้า:
> - วัตถุประสงค์
> - ไฟล์ที่เกี่ยวข้อง
> - เส้นทาง (Route)
> - การทำงานหลัก
> - ขั้นตอนการใช้งาน (แนะนำ)
> - หมายเหตุ/ข้อควรระวัง

---

## 2.1 Dashboard / Overview

### วัตถุประสงค์
สรุปข้อมูลภาพรวมของระบบ เช่น รายการสินค้า, รายการคำสั่งซื้อ/การเบิก, สินค้าใกล้หมด และสรุปรายได้ฝั่ง Customer order

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/AdminOverviewPage.jsx`
- `src/pages/admin/AdminOverviewPage.module.css`

### เส้นทาง (Route)
- `/admin/dashboard`

### การทำงานหลัก
- โหลดข้อมูลสินค้า (Products) และรายการถอน/คำสั่งซื้อ (Withdrawals)
- คำนวณ:
  - สินค้าใกล้หมด (low stock)
  - แยกประเภทคำสั่งซื้อ: customer vs staff
  - สรุปรายได้ (อิง customerOrders.total)
  - แสดงรายการคำสั่งซื้อล่าสุด

### ขั้นตอนการใช้งาน (แนะนำ)
1. เข้าหน้า Dashboard
2. ตรวจสอบสถิติโดยรวม และรายการล่าสุด
3. หากพบสินค้าใกล้หมด/คำสั่งซื้อค้าง ให้ไปหน้าที่เกี่ยวข้อง (Products / Alerts / Orders)

### หมายเหตุ/ข้อควรระวัง
- รายได้คำนวณจาก `withdrawals` ที่ `createdSource=customer` และฟิลด์ `total`

---

## 2.2 Low Stock Alerts (แจ้งเตือนสินค้าใกล้หมด)

### วัตถุประสงค์
แสดงรายการสินค้าใกล้หมด/หมดสต็อก เพื่อให้ Admin ดำเนินการเติมสต็อกหรือจัดการสินค้าได้ทันเวลา

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/AdminAlertsPage.jsx`
- `src/pages/admin/AdminAlertsPage.module.css`

### เส้นทาง (Route)
- `/admin/alerts`

### การทำงานหลัก
- โหลดสินค้าทั้งหมด แล้วกรองด้วย `isLowStock(product)`
- ค้นหา (Search) ด้วยชื่อสินค้า/หมวดหมู่
- แสดงสถิติ (Total alerts, Critical=0 stock, Low stock)
- ปุ่มดำเนินการ:
  - ไปหน้าสินค้าโดยโฟกัสสินค้าที่แจ้งเตือน (`/admin/products?focus=<productId>`)

### ขั้นตอนการใช้งาน (แนะนำ)
1. เปิดหน้า Alerts
2. ใช้ช่องค้นหาเพื่อกรองสินค้าที่ต้องการ
3. กดปุ่ม Action เพื่อไปหน้า Products และเติมสต็อก

### หมายเหตุ/ข้อควรระวัง
- เกณฑ์ low stock ใช้ `product.lowStockThreshold` หรือค่า default ใน `isLowStock`

---

## 2.3 Products (จัดการสินค้า)

### วัตถุประสงค์
ดูรายการสินค้า ค้นหา/กรอง เพิ่มสต็อก แก้ไข/ลบสินค้า และเปิดดูประวัติการเคลื่อนไหวของสินค้า

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/ProductsPage.jsx`
- `src/pages/admin/ProductsPage.module.css`

### เส้นทาง (Route)
- `/admin/products`

### การทำงานหลัก
- โหลดสินค้า (`getAllProducts`)
- ค้นหา/กรองตามหมวดหมู่
- Pagination
- Modal:
  - Add Stock (เพิ่มสต็อก)
  - Delete Product (ยืนยันลบ)
- รองรับสินค้าที่มี Variant (`hasVariants` + `variants[]`)
- เพิ่มสต็อกจะบันทึกประวัติผ่าน `addInventoryHistory`

### ขั้นตอนการใช้งาน (แนะนำ)
1. เข้าหน้า Products
2. ค้นหา/เลือกหมวดหมู่เพื่อกรอง
3. กด Add Stock เพื่อเพิ่มจำนวนสินค้า (หรือเลือก Variant)
4. กด Edit เพื่อแก้ไขรายละเอียดสินค้า
5. กด History เพื่อดูประวัติการเข้า/ออกสต็อกของสินค้านั้น

### หมายเหตุ/ข้อควรระวัง
- การลบสินค้าเป็นการลบถาวร (ไม่สามารถกู้คืนได้)
- สินค้าแบบ variant ต้องเลือก variant ก่อนเพิ่มสต็อก

---

## 2.4 Add Product (เพิ่มสินค้า)

### วัตถุประสงค์
เพิ่มสินค้าใหม่เข้าระบบ รองรับทั้งสินค้าแบบปกติและสินค้าแบบมี Variant

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/AddProductPage.jsx`
- `src/pages/admin/AddProductPage.module.css`

### เส้นทาง (Route)
- `/admin/addproduct`

### การทำงานหลัก
- กรอกข้อมูลพื้นฐาน: ชื่อ, รายละเอียด, แหล่งซื้อ, รูป, วันที่, หน่วย, หมวดหมู่
- เลือกโหมด:
  - สินค้าแบบปกติ (กำหนด cost/sell/quantity)
  - สินค้าแบบ variants (กำหนด size/color/quantity/cost/sell ต่อ variant)
- อัปโหลดรูปขึ้น Firebase Storage แล้วเก็บ URL
- บันทึกผ่าน `addProduct()`

### ขั้นตอนการใช้งาน (แนะนำ)
1. ไปหน้า Add Product
2. กรอกข้อมูลพื้นฐาน
3. หากเป็นสินค้ามีหลายแบบ ให้เปิดโหมด variants และเพิ่มรายการ variant
4. กด Save เพื่อบันทึก

### หมายเหตุ/ข้อควรระวัง
- โหมด variants ต้องมีอย่างน้อย 1 variant
- ระวังกรอกข้อมูลซ้ำ (size+color ซ้ำ)

---

## 2.5 Edit Product (แก้ไขสินค้า)

### วัตถุประสงค์
แก้ไขข้อมูลสินค้าเดิม รวมถึงรูป, หมวดหมู่/หน่วย, สต็อก (แบบปกติ/แบบ variant) และข้อมูลโปรโมชัน

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/EditProductPage.jsx`
- `src/pages/admin/EditProductPage.module.css`

### เส้นทาง (Route)
- `/admin/products/:id/edit`

### การทำงานหลัก
- โหลดสินค้าเดิมด้วย `getProductById(id)`
- แก้ไขข้อมูลพื้นฐาน
- อัปโหลดรูปใหม่ได้
- จัดการโปรโมชัน (promotion)
- บันทึกผ่าน `updateProduct()`

### ขั้นตอนการใช้งาน (แนะนำ)
1. เข้าหน้า Products แล้วกด Edit ที่สินค้า
2. ปรับข้อมูลที่ต้องการ
3. กด Save

### หมายเหตุ/ข้อควรระวัง
- ตรวจสอบโหมด variants ให้ตรงกับสินค้าเดิม

---

## 2.6 Inventory History (รายสินค้า)

### วัตถุประสงค์
ดูประวัติการเคลื่อนไหวสต็อกของ “สินค้าเฉพาะตัว” เช่น การเพิ่มสต็อก/ตัดสต็อก

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/InventoryHistoryPage.jsx`

### เส้นทาง (Route)
- `/admin/products/:id/history`

### การทำงานหลัก
- โหลดข้อมูลสินค้า `getProductById(id)`
- โหลดประวัติ `getInventoryHistory(id)`
- แสดงตาราง IN/OUT พร้อมจำนวนและต้นทุน

### ขั้นตอนการใช้งาน (แนะนำ)
1. ไปหน้า Products
2. เลือกสินค้าแล้วกด History
3. ตรวจสอบรายการเข้า/ออกสต็อก

### หมายเหตุ/ข้อควรระวัง
- หน้าใช้ inline style เป็นหลัก (ไม่ได้ใช้ CSS module)

---

## 2.7 Inventory In/Out History (ทั้งระบบ)

### วัตถุประสงค์
ดูประวัติการเคลื่อนไหวสต็อก “รวมทุกสินค้า” พร้อมตัวกรองและช่วงวันที่

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/inventory_history.jsx`
- `src/pages/admin/InventoryHistory.module.css`

### เส้นทาง (Route)
- `/admin/inventory_history`

### การทำงานหลัก
- โหลดสินค้าทั้งหมด แล้วโหลด history ของแต่ละสินค้า
- ค้นหาด้วยชื่อสินค้า
- กรองตามชนิด (IN/OUT)
- กรองช่วงวันที่ (from/to) ผ่าน DatePicker
- Pagination
- ปุ่ม Clear Filters

### ขั้นตอนการใช้งาน (แนะนำ)
1. เข้าเมนู Inventory History
2. ใส่คำค้น/เลือกช่วงวันที่/เลือกประเภท
3. ตรวจสอบรายการเคลื่อนไหวสต็อก

### หมายเหตุ/ข้อควรระวัง
- หน้าอาจโหลดช้าเมื่อสินค้าจำนวนมาก (เพราะดึง history แยกตามสินค้า)

---

## 2.8 Orders (รายการคำสั่งซื้อ/การเบิก)

### วัตถุประสงค์
จัดการรายการคำสั่งซื้อทั้งหมด ทั้งฝั่งลูกค้า (customer orders) และพนักงาน (staff withdrawals)

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/AdminOrdersPage.jsx`
- `src/pages/admin/AdminOrdersPage.module.css`

### เส้นทาง (Route)
- `/admin/orders` (รองรับ query `?source=customer|staff|all`)

### การทำงานหลัก
- โหลดรายการ withdrawals ทั้งหมด (`getAllWithdrawals`) แล้วกรองตาม:
  - source (customer/staff)
  - deliveryMethod (shipping/pickup)
  - search (trackingNumber/requestedBy/receivedBy)
- Pagination
- กดปุ่มเพื่อไปหน้า Order Detail (`/admin/orders/:id`)

### ขั้นตอนการใช้งาน (แนะนำ)
1. เลือก Orders จากเมนู
2. เลือกแหล่งที่มา (customer/staff) และตัวกรองที่ต้องการ
3. ค้นหาด้วย tracking / ชื่อผู้ขอเบิก/ผู้รับ
4. กดดูรายละเอียดรายการ

### หมายเหตุ/ข้อควรระวัง
- หน้ารายการใช้ query string `source` เพื่อแยกประเภท

---

## 2.9 Order Detail (รายละเอียดคำสั่งซื้อ)

### วัตถุประสงค์
ดูรายละเอียดคำสั่งซื้อ/การเบิก และอัปเดตสถานะการจัดส่ง/ติดตาม (รวมถึงกรณี pickup)

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/AdminOrderDetailPage.jsx`

### เส้นทาง (Route)
- `/admin/orders/:id`

### การทำงานหลัก
- รับ `order` ผ่าน `location.state` จากหน้ารายการ (ถ้าไม่มีจะ redirect กลับ `/admin/orders`)
- แก้ไขข้อมูลการจัดส่ง:
  - shippingCarrier
  - trackingNumber
  - shippingStatus
- บันทึกผ่าน `updateWithdrawalShipping(id, payload, createdByUid)`

### ขั้นตอนการใช้งาน (แนะนำ)
1. เข้าหน้า Orders
2. กดรายการที่ต้องการ → เข้าหน้า Order Detail
3. เลือกสถานะจัดส่ง / ระบุบริษัทขนส่งและ tracking (ถ้าเป็น shipping)
4. กด Save

### หมายเหตุ/ข้อควรระวัง
- หน้า detail พึ่งพา `location.state.order` หากเปิด URL ตรงๆ อาจถูกส่งกลับหน้า orders

---

## 2.10 Manage Users (จัดการผู้ใช้งาน)

### วัตถุประสงค์
ดูรายการผู้ใช้ทั้งหมด ค้นหา/กรอง และเปลี่ยน Role ของผู้ใช้ (admin/staff/customer)

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/UsersPage.jsx`
- `src/pages/admin/UsersPage.module.css`

### เส้นทาง (Route)
- `/admin/users`

### การทำงานหลัก
- โหลดผู้ใช้ทั้งหมด (`getAllUsers`)
- ค้นหาด้วย email/displayName
- กรอง role
- เปลี่ยน role ผ่าน `updateUserRole(id, role)`
- Pagination

### ขั้นตอนการใช้งาน (แนะนำ)
1. เข้า Manage Users
2. ค้นหาผู้ใช้
3. เลือก Role ใหม่เพื่อเปลี่ยนสิทธิ์
4. กด Refresh หากต้องการรีโหลดข้อมูล

### หมายเหตุ/ข้อควรระวัง
- การให้ role=admin ควรทำอย่างระมัดระวัง

---

## 2.11 Payment Account Settings (ตั้งค่าบัญชีรับชำระ)

### วัตถุประสงค์
ตั้งค่าบัญชีธนาคาร/ช่องทางรับชำระสำหรับลูกค้า พร้อมรูป QR และการเปิด/ปิดการใช้งาน

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/AdminBankAccountPage.jsx`
- `src/pages/admin/AdminBankAccountPage.module.css`

### เส้นทาง (Route)
- `/admin/payment-account`

### การทำงานหลัก
- โหลดการตั้งค่าจาก Firestore: `settings/paymentAccount`
- เพิ่ม/แก้ไขบัญชี (modal)
- อัปโหลดรูป QR ไป Firebase Storage และเก็บ URL
- สามารถกำหนด primary/active

### ขั้นตอนการใช้งาน (แนะนำ)
1. เข้า Payment Account
2. กด Add เพื่อเพิ่มบัญชีใหม่ หรือ Edit เพื่อแก้ไข
3. ใส่ข้อมูลบัญชีและอัปโหลด QR
4. กด Save

### หมายเหตุ/ข้อควรระวัง
- ตรวจสอบว่า QR เป็นรูปภาพ และขนาดไฟล์เหมาะสม

---

## 2.12 Admin Profile (โปรไฟล์แอดมิน)

### วัตถุประสงค์
จัดการข้อมูลส่วนตัวของผู้ดูแล เช่น ชื่อ/นามสกุล/โทรศัพท์/วันเกิด, รูปโปรไฟล์, ที่อยู่, เปลี่ยนรหัสผ่าน และการตั้งค่าบัญชี

### ไฟล์ที่เกี่ยวข้อง
- `src/pages/admin/ProfilePage.jsx`
- `src/pages/admin/ProfilePage.module.css`

### เส้นทาง (Route)
- `/admin/profile`

### การทำงานหลัก
- โหลดข้อมูลโปรไฟล์จาก Firestore ผ่าน `ensureUserProfile(uid, email, displayName)`
- อัปโหลดรูปไป Firebase Storage (`avatars/<uid>`) และอัปเดตทั้ง Auth + Firestore
- แก้ไข Personal Information และบันทึกผ่าน `updateUserProfile`
- จัดการที่อยู่:
  - เพิ่มที่อยู่ (`addAddress`)
  - ลบที่อยู่ (`deleteAddress`)
  - ตั้งค่าเริ่มต้น (`setDefaultAddress`)
- เปลี่ยนรหัสผ่าน:
  - reauthenticateWithCredential
  - updatePassword

### ขั้นตอนการใช้งาน (แนะนำ)
1. เข้าเมนู Settings → Profile
2. กด Change Photo เพื่ออัปโหลดรูป
3. กด Edit เพื่อแก้ไขข้อมูลส่วนตัว และกด Save Changes
4. เพิ่มที่อยู่ใหม่จากส่วน Shipping Addresses
5. เปลี่ยนรหัสผ่านจากส่วน Change Password

### หมายเหตุ/ข้อควรระวัง
- การเปลี่ยนรหัสผ่านต้องใส่รหัสเดิมให้ถูกต้อง
- หากเปิด `/admin/profile` ต้องล็อกอินเป็น admin

---

## 3) ภาคผนวก

### 3.1 จุดเริ่มต้นของ Routes
- `src/App.js`

### 3.2 โครงสร้าง Layout
- `src/pages/admin/AdminLayout.jsx`
- `src/pages/admin/AdminLayout.module.css`

---

## Revision
- v1.0: จัดทำคู่มือแอดมินฉบับแรก (อ้างอิงโค้ดใน repo)
