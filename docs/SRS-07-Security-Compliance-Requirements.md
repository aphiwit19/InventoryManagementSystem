# 7. Security & Compliance Requirements / ข้อกำหนดด้านความปลอดภัยและการปฏิบัติตาม

บทนี้ระบุข้อกำหนดด้านความปลอดภัย (Security Requirements) โดยอ้างอิงจากพฤติกรรมระบบจริง (role-based) และการเชื่อม Firebase

**Requirement IDs:**
- SEC-xxx

**Important Note:**
- ไม่พบไฟล์ Firestore/Storage rules (`firestore.rules`, `storage.rules`) ใน repository ณ เวลาจัดทำเอกสารนี้
- ดังนั้นเอกสารจะระบุ requirement ที่ระบบ “ต้อง” enforce ผ่าน Firebase Security Rules และการตั้งค่า Firebase Console โดยไม่ระบุ implementation rule ที่ไม่มีหลักฐาน

---

## 7.1 Authentication Requirements / ข้อกำหนดการยืนยันตัวตน
- TBD (อ้างอิงจากการใช้ Firebase Auth)

---

## 7.2 Authorization Model (RBAC) / แบบจำลองการกำหนดสิทธิ์
- ระบบแบ่ง role: admin/staff/customer
- Routing protection อ้างอิง `src/routes/ProtectedRoute.jsx` และ `src/App.js`

---

## 7.3 Firestore Security Rules Requirements / ข้อกำหนดสำหรับ Firestore Rules
- TBD (SEC-xxx)

---

## 7.4 Storage Security Rules Requirements / ข้อกำหนดสำหรับ Storage Rules
- TBD (SEC-xxx)

---

## 7.5 Data Privacy / ความเป็นส่วนตัวของข้อมูล
- TBD (ข้อมูลที่เกี่ยวข้อง: ชื่อ, ที่อยู่, เบอร์โทร, รูปโปรไฟล์, สลิป)

---

## 7.6 Auditability / การตรวจสอบย้อนหลัง
- TBD (เช่น บันทึก actorUid/orderId ใน inventory history)

---

## 7.7 Threats & Mitigations / ความเสี่ยงและแนวทางลดความเสี่ยง
- TBD

---

## 7.8 Compliance / ข้อกำหนดด้านนโยบายหรือกฎหมาย
- TBD (ถ้ามีข้อกำหนดจากองค์กร/ลูกค้า)
