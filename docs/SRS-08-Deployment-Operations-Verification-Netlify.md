# 8. Deployment, Operations & Verification (Netlify) / การปรับใช้ ระบบปฏิบัติการ และการตรวจสอบ

บทนี้ระบุข้อกำหนดและแนวทางด้านการ deploy/operation และ verification/traceability สำหรับการส่งมอบใช้งานจริง และใช้ในทีมพัฒนา

**Sources / แหล่งอ้างอิง (repository):**
- `package.json` (build scripts)
- `public/_redirects` (SPA redirect)

**Important Note:**
- ไม่พบไฟล์ `netlify.toml` ใน repository ณ เวลาจัดทำเอกสารนี้
- การ deploy บน Netlify จะอ้างอิงจากสิ่งที่อยู่ใน repo และขั้นตอนมาตรฐานของ Netlify เท่านั้น

---

## 8.1 Environments / สภาพแวดล้อม
- TBD (เช่น dev/staging/prod)

---

## 8.2 Build & Release Process / กระบวนการ build และปล่อยเวอร์ชัน
- `package.json` ระบุ scripts:
  - `npm start`
  - `npm run build`

---

## 8.3 Netlify Deployment / การ deploy บน Netlify
- Publish directory: `build/` (มาตรฐาน CRA; สอดคล้องกับการมีโฟลเดอร์ `build/` ใน repo)
- SPA redirects: `public/_redirects` มี `/* /index.html 200`
- Netlify environment variables: TBD (ตาม Firebase config/keys และนโยบายลูกค้า)

---

## 8.4 Configuration Management / การจัดการค่าคอนฟิก
- Firebase web config อยู่ใน `src/firebase.js`
- แนวทางการจัดการ secrets: TBD (ต้องยืนยันนโยบายลูกค้า)

---

## 8.5 Monitoring & Error Handling / การติดตามและการจัดการข้อผิดพลาด
- TBD

---

## 8.6 Backup/Recovery / การสำรองและกู้คืน
- TBD (Firestore/Storage)

---

## 8.7 Rollback Strategy / แผนการย้อนกลับเวอร์ชัน
- TBD (Netlify supports deploy rollback)

---

## 8.8 Verification Plan / แผนการทดสอบ
- รายละเอียด Test cases อยู่ใน `SRS-C-Test-Cases.md`

---

## 8.9 Traceability Matrix / ตารางเชื่อม requirement กับการทดสอบ
- อยู่ใน `SRS-D-Traceability-Matrix.md`

---

## 8.10 Acceptance Test Summary / สรุป UAT
- TBD
