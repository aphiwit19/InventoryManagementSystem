# 2. Overall Description / ภาพรวมโดยรวม

เอกสารส่วนนี้อธิบายภาพรวมของระบบ (high-level) ตามรูปแบบ SRS เพื่อให้ผู้มีส่วนได้ส่วนเสียเข้าใจบริบทและขอบเขต ก่อนเข้าสู่ข้อกำหนดเชิงหน้าที่ (Functional Requirements)

**Sources / แหล่งอ้างอิง (repository):**
- `docs/Admin_User_Manual.md`
- `docs/Staff_User_Manual.md`
- `docs/Customer_User_Manual.md`
- `src/App.js`
- `src/auth/AuthContext.jsx`
- `package.json`

---

## 2.1 มุมมองผลิตภัณฑ์ (Product Perspective)
- ระบบเป็น Web Application ที่ทำงานแบบ Single Page Application (SPA)
- ใช้ Firebase เป็น Backend-as-a-Service สำหรับ Authentication, Database (Firestore), และ Storage

---

## 2.2 ฟังก์ชันหลักของระบบ (Product Functions)
สรุปฟังก์ชันหลัก (สรุประดับสูง; รายละเอียดอยู่ในบทที่ 3):
- Authentication: Login / Register / Forgot Password
- Role-based navigation: Admin / Staff / Customer
- Inventory management: Products, Stock, Variants, Inventory History
- Order/Withdrawal management: Cart, Create order/withdrawal, Track status
- Payment (Customer): Upload payment slip + payment account information
- Admin management: Users/roles, Orders management, Payment account settings
- Localization: Thai/English language switching

---

## 2.3 กลุ่มผู้ใช้และคุณลักษณะ (User Classes and Characteristics)
### 2.3.1 Admin
- เข้าถึง `/admin/*` ตามที่ระบุใน `docs/Admin_User_Manual.md`

### 2.3.2 Staff
- เข้าถึง `/staff/*` ตามที่ระบุใน `docs/Staff_User_Manual.md`

### 2.3.3 Customer
- เข้าถึง `/customer/*` ตามที่ระบุใน `docs/Customer_User_Manual.md`

---

## 2.4 สภาพแวดล้อมการทำงาน (Operating Environment)
- Web browser (รายละเอียด compatibility ระบุในบทที่ 4/6)
- Network: HTTPS access to Firebase endpoints
- Firebase services: Auth / Firestore / Storage

---

## 2.5 ข้อจำกัดด้านการออกแบบและการพัฒนา (Design & Implementation Constraints)
- Framework: Create React App (`react-scripts`) ตาม `package.json`
- Routing: `react-router-dom` ตาม `package.json` และ `src/App.js`
- Data store: Cloud Firestore (schema ระบุในบทที่ 5)

---

## 2.6 สมมติฐานและการพึ่งพา (Assumptions and Dependencies)
- ต้องมี Firebase project ที่ตั้งค่าไว้ และค่า config อยู่ใน `src/firebase.js`
- ต้องเปิดใช้ Authentication provider: Email/Password (อ้างอิง `README.md`)
- การ deploy บน Netlify ต้องรองรับ SPA redirects (มี `_redirects` ใน `public/_redirects`)

---

## 2.7 กฎทางธุรกิจ (Business Rules)
หัวข้อนี้จะอธิบายกฎที่ส่งผลต่อ logic ของระบบ โดยอ้างอิงจากโค้ด service และคู่มือ:
- การ “จองสต๊อก (reserve)” และ “ตัดสต๊อก (consume/cut)” ที่สัมพันธ์กับสถานะการจัดส่ง/การรับของ

**Note:** รายละเอียดอ้างอิงโค้ดอยู่ใน `src/services/orders.service.js` และจะถูกแปลงเป็น FR ในบทที่ 3

---

## 2.8 เอกสารคู่มือผู้ใช้ (User Documentation)
- `docs/Admin_User_Manual.md`
- `docs/Staff_User_Manual.md`
- `docs/Customer_User_Manual.md`

---

## 2.9 นอกขอบเขต/แผนในอนาคต (Out of Scope / Future Enhancements)
- ไม่ระบุ feature ที่ไม่มีหลักฐานใน repository
- การ integrate ระบบชำระเงินอัตโนมัติ (payment gateway) ไม่พบใน repository ณ เวลาจัดทำเอกสารนี้
