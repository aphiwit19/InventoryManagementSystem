# 4. External Interface Requirements / ข้อกำหนดอินเทอร์เฟซภายนอก

**Sources / แหล่งอ้างอิง (repository):**
- `docs/*_User_Manual.md`
- `src/pages/**`
- `src/firebase.js`
- `package.json`

---

## 4.1 ส่วนติดต่อผู้ใช้ (User Interfaces)
- หน้าจอและการนำทางจะสรุปใน `SRS-B-Screens-And-Navigation.md`
- UI แยกตาม role: Admin/Staff/Customer

---

## 4.2 ส่วนติดต่อซอฟต์แวร์ (Software Interfaces)
### 4.2.1 Firebase Authentication
- ใช้สำหรับ Login/Register/Forgot Password

### 4.2.2 Cloud Firestore
- ใช้เป็นฐานข้อมูลหลักของระบบ

### 4.2.3 Firebase Storage
- ใช้เก็บไฟล์รูปภาพสินค้า/รูปโปรไฟล์/สลิปชำระเงิน/QR

**Reference:** `src/firebase.js`

---

## 4.3 ส่วนติดต่อการสื่อสาร (Communications Interfaces)
- HTTPS communication ระหว่าง browser และ Firebase services

---

## 4.4 ความเข้ากันได้ของเบราว์เซอร์ (Browser Compatibility)
- ระบบพัฒนาเป็นเว็บแอปด้วย Create React App (ดู `package.json` → `browserslist`) และรองรับเบราว์เซอร์ตามเกณฑ์ดังนี้
  - Production target: `>0.2%`, `not dead`, และ `not op_mini all`
  - Development target: `last 1 chrome version`, `last 1 firefox version`, `last 1 safari version`
- เบราว์เซอร์ที่ต้องรองรับ (ขั้นต่ำ):
  - Chromium-based (เช่น Chrome/Edge) เวอร์ชันปัจจุบันและ 1 เวอร์ชันย้อนหลัง
  - Firefox เวอร์ชันปัจจุบันและ 1 เวอร์ชันย้อนหลัง
  - Safari เวอร์ชันปัจจุบันและ 1 เวอร์ชันย้อนหลัง
- เกณฑ์การยืนยันความเข้ากันได้ (Compatibility verification):
  - การนำทาง/route ตาม role (Admin/Staff/Customer) ทำงานถูกต้อง
  - ฟังก์ชัน Auth (Login/Register/Forgot Password) ทำงานได้
  - การอ่าน/เขียนข้อมูล Firestore และอัปโหลดไฟล์ผ่าน Firebase Storage ทำงานได้

---

## 4.5 Localization Interface (UI Language)
- ระบบมีการสลับภาษา Thai/English (อ้างอิงจากการใช้ `react-i18next`)

---

## 4.6 แนวทางการแสดงข้อผิดพลาด/ข้อความแจ้งเตือน (Error/Notification)
- แนวทางการแสดงข้อความแจ้งเตือนใน UI ให้สอดคล้องกัน โดยยึดรูปแบบที่ใช้งานจริงในระบบ
  - Validation errors (ข้อมูลไม่ครบ/รูปแบบไม่ถูกต้อง):
    - แสดงข้อความผิดพลาดแบบ inline ภายในหน้า/ฟอร์ม และป้องกันการส่งฟอร์มเมื่อข้อมูลไม่ผ่านเงื่อนไข
  - Operation errors (เช่น บันทึกข้อมูลไม่สำเร็จ/อัปโหลดไฟล์ไม่สำเร็จ/เรียก Firebase ล้มเหลว):
    - แสดงข้อความผิดพลาดในหน้าจอ (inline error area) และในบางกรณีอาจใช้ browser alert เพื่อแจ้งผู้ใช้ทันที
  - Success messages:
    - แสดงข้อความสำเร็จภายในหน้า (inline success area) เมื่อการทำรายการสำเร็จ
  - Logging:
    - ข้อผิดพลาดเชิงเทคนิคควรถูกบันทึกใน console (เช่น `console.error`) เพื่อช่วยในการดีบัก
  - Localization:
    - ข้อความที่แสดงต่อผู้ใช้ควรรองรับการแปลภาษา (Thai/English) ตามกลไก `react-i18next` ที่ระบบใช้อยู่
