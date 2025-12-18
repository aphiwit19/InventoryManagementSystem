# 5. Data Requirements / ข้อกำหนดด้านข้อมูล (Database/Schema)

บทนี้อธิบาย schema ระดับเอกสาร (document-level) ของ Firestore ตามข้อมูลที่พบในโค้ดและคู่มือ

**Sources / แหล่งอ้างอิง (repository):**
- `src/services/users.service.js`
- `src/services/cart.service.js`
- `src/services/orders.service.js`
- `src/services/products.service.js`
- `src/services/inventory.service.js`
- `src/auth/AuthContext.jsx`
- `docs/*_User_Manual.md`

---

## 5.1 ภาพรวม Data Model (Data Model Overview)
- Firebase Cloud Firestore เป็นฐานข้อมูลหลัก
- โครงสร้าง collection/subcollection ระบุในหัวข้อย่อยด้านล่าง

---

## 5.2 Users (`users/{uid}`)
### 5.2.1 Purpose
- เก็บข้อมูลโปรไฟล์และ role ของผู้ใช้

### 5.2.2 Observed fields (จากระบบจริง)
- TBD (จะสรุป field ที่พบจากโค้ด service และคู่มือ)

**References:**
- `src/auth/AuthContext.jsx`
- `src/services/users.service.js`

---

## 5.3 Products (`products/{productId}`)
### 5.3.1 Purpose
- เก็บข้อมูลสินค้า สต๊อก และ variants

### 5.3.2 Observed fields
- TBD (จะสรุปจาก `src/services/products.service.js`)

---

## 5.4 Inventory History (`products/{productId}/inventory_history/{historyId}`)
### 5.4.1 Purpose
- เก็บประวัติ IN/OUT ของสินค้า

### 5.4.2 Observed fields
- TBD (จะสรุปจาก `src/services/inventory.service.js` และการเขียน history ใน `orders.service.js`)

---

## 5.5 Cart (`users/{uid}/cart/{customer|staff}`)
### 5.5.1 Purpose
- เก็บรายการสินค้าในตะกร้า แยกตาม role

### 5.5.2 Observed fields
- TBD (จะสรุปจาก `src/services/cart.service.js`)

---

## 5.6 Orders (`users/{uid}/orders/{orderId}`)
### 5.6.1 Purpose
- เก็บคำสั่งซื้อ/คำขอเบิก

### 5.6.2 Observed fields
- TBD (จะสรุปจาก `src/services/orders.service.js` และคู่มือ)

---

## 5.7 Settings (`settings/paymentAccount`)
### 5.7.1 Purpose
- เก็บข้อมูลบัญชีรับชำระเงิน/QR

### 5.7.2 Observed fields
- TBD (จะสรุปจาก `CustomerPaymentPage` และ `AdminBankAccountPage`)

---

## 5.8 Counters (`counters/orderNumber`)
### 5.8.1 Purpose
- เก็บตัวนับเพื่อสร้างเลขออเดอร์แบบ running number

### 5.8.2 Observed fields
- TBD (จะสรุปจาก `src/services/orders.service.js`)

---

## 5.9 Data Validation Rules / กฎการตรวจสอบความถูกต้องของข้อมูล
- TBD (จะสรุปจาก validation ใน UI + service layer)
