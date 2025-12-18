# Software Requirements Specification (SRS)
# Inventory Management System (IMS) / ระบบจัดการสินค้าคงคลัง

เอกสารฉบับนี้เป็น **Software Requirements Specification (SRS)** สำหรับระบบ Inventory Management System (IMS) โดยจัดทำในรูปแบบ **ไทย + English** และอ้างอิงข้อมูลจากระบบจริงใน repository นี้เท่านั้น

เอกสาร SRS ถูกแยกเป็นหลายไฟล์ (1 ไฟล์ต่อ 1 บทหัวข้อใหญ่) เพื่อให้ง่ายต่อการบำรุงรักษา:
- `SRS-01-Introduction.md`
- `SRS-02-Overall-Description.md`
- `SRS-03-System-Features.md`
- `SRS-04-External-Interface-Requirements.md`
- `SRS-05-Data-Requirements.md`
- `SRS-06-Nonfunctional-Requirements.md`
- `SRS-07-Security-Compliance-Requirements.md`
- `SRS-08-Deployment-Operations-Verification-Netlify.md`

ภาคผนวก (Appendices):
- `SRS-A-Glossary.md`
- `SRS-B-Screens-And-Navigation.md`
- `SRS-C-Test-Cases.md`
- `SRS-D-Traceability-Matrix.md`

---

## 1.1 วัตถุประสงค์ (Purpose)
- ระบุขอบเขตและข้อกำหนดของระบบ Inventory Management System (IMS) ในระดับที่สามารถใช้ได้ทั้ง:
  - การส่งมอบให้ลูกค้า/ผู้มีส่วนได้ส่วนเสีย (stakeholders)
  - การพัฒนาและทดสอบโดยทีมพัฒนา (development & verification)
- จัดทำข้อกำหนดในรูปแบบที่ตรวจสอบย้อนกลับได้ (traceable) โดยเชื่อมโยง:
  - Functional Requirements (FR)
  - Nonfunctional Requirements (NFR)
  - Security Requirements (SEC)
  - Test Cases (TC)

---

## 1.2 ขอบเขต (Scope)
### 1.2.1 ขอบเขตระบบ (System Scope)
ระบบนี้เป็น Web Application สำหรับการจัดการสินค้าคงคลังและการทำรายการเบิก/สั่งซื้อ โดยแบ่งผู้ใช้งานเป็น 3 บทบาทหลัก:
- Admin
- Staff
- Customer

### 1.2.2 ขอบเขตเทคโนโลยี (Technology Scope)
จากข้อมูลใน repository ระบบประกอบด้วย:
- Frontend: Create React App (CRA) + React
- Backend-as-a-Service: Firebase
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Storage

### 1.2.3 Deployment/Operations Scope
- Deployment target: Netlify
- SPA routing support: มีไฟล์ `_redirects` ใน `public/_redirects`

### 1.2.4 Out of Scope
- Firestore/Storage Security Rules files (`firestore.rules`, `storage.rules`) ไม่พบใน repository ณ เวลาจัดทำเอกสารนี้ (จะระบุ requirement ด้าน security ในเชิง “ต้องมี/ควรมี” และอ้างอิงจากพฤติกรรมระบบเท่าที่พบ)
- ไฟล์ตั้งค่า Netlify (`netlify.toml`) ไม่พบใน repository ณ เวลาจัดทำเอกสารนี้

---

## 1.3 คำจำกัดความ ตัวย่อ และคำย่อ (Definitions, Acronyms, Abbreviations)
- **IMS**: Inventory Management System
- **SRS**: Software Requirements Specification
- **FR**: Functional Requirement
- **NFR**: Nonfunctional Requirement
- **SEC**: Security Requirement
- **TC**: Test Case
- **RBAC**: Role-Based Access Control
- **Firestore**: Cloud Firestore (Firebase)
- **Storage**: Firebase Storage

หมายเหตุ: รายการคำศัพท์ฉบับสมบูรณ์อยู่ใน `SRS-A-Glossary.md`

---

## 1.4 เอกสารอ้างอิง (References)
เอกสาร/แหล่งข้อมูลที่ใช้อ้างอิงในการเขียน SRS (จาก repository นี้):
- `docs/Admin_User_Manual.md`
- `docs/Staff_User_Manual.md`
- `docs/Customer_User_Manual.md`
- `src/App.js` (Routes)
- `src/auth/AuthContext.jsx` (Auth + profile)
- `src/services/*` (business logic on Firestore/Storage)
- `public/_redirects` (SPA redirects)
- `package.json` (build/run scripts)

---

## 1.5 รูปแบบเอกสารและมาตรฐานการตั้งรหัส (Document Conventions & ID Scheme)
### 1.5.1 Language
- ใช้รูปแบบ **ไทย (English)** ในหัวข้อ และเนื้อหาเป็นไทยผสมคำเทคนิคภาษาอังกฤษเมื่อเหมาะสม

### 1.5.2 Requirement IDs
- **FR-xxx**: ข้อกำหนดเชิงหน้าที่ (Functional Requirements)
- **NFR-xxx**: ข้อกำหนดไม่ใช่เชิงหน้าที่ (Nonfunctional Requirements)
- **SEC-xxx**: ข้อกำหนดด้านความปลอดภัย/การกำกับสิทธิ์ (Security Requirements)
- **TC-xxx**: กรณีทดสอบ (Test Cases)

### 1.5.3 Traceability
- ตาราง Traceability จะจัดทำใน `SRS-D-Traceability-Matrix.md` เพื่อเชื่อมโยง FR/NFR/SEC กับ Test Cases
