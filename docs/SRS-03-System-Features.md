# 3. System Features / คุณลักษณะของระบบ (Functional Requirements)

บทนี้ระบุข้อกำหนดเชิงหน้าที่ (Functional Requirements) ของระบบ โดยจัดเป็น feature ตามโครง IEEE-style SRS

**Sources / แหล่งอ้างอิง (repository):**
- `docs/Admin_User_Manual.md`
- `docs/Staff_User_Manual.md`
- `docs/Customer_User_Manual.md`
- `src/App.js`
- `src/pages/**`
- `src/services/**`

**Requirement IDs:**
- FR-xxx: Functional Requirement
- AC-xxx: Acceptance Criteria

---

## Template / แม่แบบต่อ 1 Feature
- **Description**: อธิบายฟังก์ชัน
- **Actors & Preconditions**: บทบาทผู้ใช้และเงื่อนไขก่อนใช้งาน
- **Main Flow**: ลำดับการทำงานหลัก
- **Functional Requirements (FR-xxx)**: รายการ requirement แบบตรวจสอบได้
- **Acceptance Criteria (AC-xxx)**: Given/When/Then
- **Exceptions/Edge Cases**: กรณีผิดปกติ

---

## 3.1 Authentication (Login/Register/Forgot Password) / การยืนยันตัวตน
### 3.1.1 Description
### 3.1.2 Actors & Preconditions
### 3.1.3 Main Flow
### 3.1.4 Functional Requirements (FR-xxx)
### 3.1.5 Acceptance Criteria (AC-xxx)
### 3.1.6 Exceptions/Edge Cases

**References:**
- Customer manual: Login/Register sections
- Routes: `src/App.js` (`/login`, `/register`, `/forgot-password`)

---

## 3.2 Role-based Access Control (RBAC) / การกำหนดสิทธิ์ตามบทบาท
### 3.2.1 Description
### 3.2.2 Actors & Preconditions
### 3.2.3 Main Flow
### 3.2.4 Functional Requirements (FR-xxx)
### 3.2.5 Acceptance Criteria (AC-xxx)
### 3.2.6 Exceptions/Edge Cases

**References:**
- `src/routes/ProtectedRoute.jsx`
- `src/auth/AuthContext.jsx`
- `src/App.js`

---

## 3.3 User Profile & Address Management / โปรไฟล์และสมุดที่อยู่
### 3.3.1 Description
### 3.3.2 Actors & Preconditions
### 3.3.3 Main Flow
### 3.3.4 Functional Requirements (FR-xxx)
### 3.3.5 Acceptance Criteria (AC-xxx)
### 3.3.6 Exceptions/Edge Cases

**References:**
- Staff manual: Profile section
- Admin manual: Admin Profile section
- Customer manual: Profile section
- `src/services/users.service.js`

---

## 3.4 Product Management (CRUD + Variants) / การจัดการสินค้า (รวม Variant)
### 3.4.1 Description
### 3.4.2 Actors & Preconditions
### 3.4.3 Main Flow
### 3.4.4 Functional Requirements (FR-xxx)
### 3.4.5 Acceptance Criteria (AC-xxx)
### 3.4.6 Exceptions/Edge Cases

**References:**
- Admin manual: Products/Add/Edit
- `src/services/products.service.js`

---

## 3.5 Inventory History Tracking / ประวัติการเคลื่อนไหวสต๊อก
### 3.5.1 Description
### 3.5.2 Actors & Preconditions
### 3.5.3 Main Flow
### 3.5.4 Functional Requirements (FR-xxx)
### 3.5.5 Acceptance Criteria (AC-xxx)
### 3.5.6 Exceptions/Edge Cases

**References:**
- Admin manual: Inventory History sections
- `src/services/inventory.service.js`

---

## 3.6 Low Stock Alerts / แจ้งเตือนสินค้าใกล้หมด
### 3.6.1 Description
### 3.6.2 Actors & Preconditions
### 3.6.3 Main Flow
### 3.6.4 Functional Requirements (FR-xxx)
### 3.6.5 Acceptance Criteria (AC-xxx)
### 3.6.6 Exceptions/Edge Cases

**References:**
- Admin manual: Alerts
- Low-stock helpers: `src/services/products.service.js` (`isLowStock`, etc.)

---

## 3.7 Cart Management (Customer/Staff) / การจัดการตะกร้า
### 3.7.1 Description
### 3.7.2 Actors & Preconditions
### 3.7.3 Main Flow
### 3.7.4 Functional Requirements (FR-xxx)
### 3.7.5 Acceptance Criteria (AC-xxx)
### 3.7.6 Exceptions/Edge Cases

**References:**
- Staff manual: Dashboard/Withdraw
- Customer manual: Cart/Withdraw
- `src/services/cart.service.js`

---

## 3.8 Order/Withdrawal Creation (Reserve stock) / การสร้างคำสั่งซื้อ/คำขอเบิก (การจองสต๊อก)
### 3.8.1 Description
### 3.8.2 Actors & Preconditions
### 3.8.3 Main Flow
### 3.8.4 Functional Requirements (FR-xxx)
### 3.8.5 Acceptance Criteria (AC-xxx)
### 3.8.6 Exceptions/Edge Cases

**References:**
- Staff manual: Withdraw submit
- Customer manual: Proceed to payment / order creation
- `src/services/orders.service.js` (`createWithdrawal`)

---

## 3.9 Customer Payment + Slip Upload / การชำระเงินลูกค้าและอัปโหลดสลิป
### 3.9.1 Description
### 3.9.2 Actors & Preconditions
### 3.9.3 Main Flow
### 3.9.4 Functional Requirements (FR-xxx)
### 3.9.5 Acceptance Criteria (AC-xxx)
### 3.9.6 Exceptions/Edge Cases

**References:**
- Customer manual: Payment
- `src/pages/customer/CustomerPaymentPage.jsx`

---

## 3.10 Order Tracking (Customer/Staff) / การติดตามสถานะคำสั่งซื้อ
### 3.10.1 Description
### 3.10.2 Actors & Preconditions
### 3.10.3 Main Flow
### 3.10.4 Functional Requirements (FR-xxx)
### 3.10.5 Acceptance Criteria (AC-xxx)
### 3.10.6 Exceptions/Edge Cases

**References:**
- Customer manual: Orders/Order Detail
- Staff manual: Orders/Order Detail

---

## 3.11 Admin Order Management (Update shipping → Cut stock) / แอดมินจัดการคำสั่งซื้อ (อัปเดตสถานะเพื่อตัดสต๊อก)
### 3.11.1 Description
### 3.11.2 Actors & Preconditions
### 3.11.3 Main Flow
### 3.11.4 Functional Requirements (FR-xxx)
### 3.11.5 Acceptance Criteria (AC-xxx)
### 3.11.6 Exceptions/Edge Cases

**References:**
- Admin manual: Orders + Order Detail
- `src/services/orders.service.js` (`updateWithdrawalShipping`)

---

## 3.12 Admin User Management (Roles) / แอดมินจัดการผู้ใช้และบทบาท
### 3.12.1 Description
### 3.12.2 Actors & Preconditions
### 3.12.3 Main Flow
### 3.12.4 Functional Requirements (FR-xxx)
### 3.12.5 Acceptance Criteria (AC-xxx)
### 3.12.6 Exceptions/Edge Cases

**References:**
- Admin manual: Manage Users
- `src/services/users.service.js` (`getAllUsers`, `updateUserRole`)

---

## 3.13 Localization (i18n) / การรองรับหลายภาษา
### 3.13.1 Description
### 3.13.2 Actors & Preconditions
### 3.13.3 Main Flow
### 3.13.4 Functional Requirements (FR-xxx)
### 3.13.5 Acceptance Criteria (AC-xxx)
### 3.13.6 Exceptions/Edge Cases

**References:**
- `src/i18n/**`
- `react-i18next` usage in pages/layouts
