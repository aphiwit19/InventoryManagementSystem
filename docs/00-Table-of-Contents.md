# Software Requirements Specification (SRS)
# ระบบ InventoryPro - ระบบจัดการสินค้าคงคลังและการเบิกจ่าย

---

## สารบัญ (Table of Contents)

### [1. Introduction (บทนำ)](./01-Introduction.md)
- 1.1 วัตถุประสงค์ของเอกสาร
- 1.2 ขอบเขตของโปรเจค
- 1.3 คำจำกัดความและคำย่อ
- 1.4 เอกสารอ้างอิง
- 1.5 ภาพรวมของเอกสาร
- 1.6 ประวัติการแก้ไขเอกสาร

### [2. Overall Description (ภาพรวมของระบบ)](./02-Overall-Description.md)
- 2.1 มุมมองผลิตภัณฑ์
- 2.2 ฟังก์ชันหลักของผลิตภัณฑ์
- 2.3 ลักษณะผู้ใช้งาน
- 2.4 ข้อจำกัดทั่วไป
- 2.5 สมมติฐานและการพึ่งพา

### [3. Specific Requirements (ความต้องการเฉพาะ)](./03-Specific-Requirements.md)
- 3.1 Functional Requirements (ความต้องการเชิงหน้าที่)
  - 3.1.1 โมดูลการยืนยันตัวตน
  - 3.1.2 โมดูลการจัดการสินค้า
  - 3.1.3 โมดูลการจัดการสต็อก
  - 3.1.4 โมดูลตะกร้าสินค้า
  - 3.1.5 โมดูลการสั่งซื้อ
  - 3.1.6 โมดูลการชำระเงิน
  - 3.1.7 โมดูลคูปอง
  - 3.1.8 โมดูลการจัดการผู้ใช้
- 3.2 Non-functional Requirements
  - 3.2.1 Performance Requirements
  - 3.2.2 Security Requirements
  - 3.2.3 Usability Requirements
  - 3.2.4 Reliability Requirements
  - 3.2.5 Maintainability Requirements
- 3.3 Interface Requirements

### [4. System Features (คุณสมบัติของระบบ)](./04-System-Features.md)
- 4.1 ภาพรวมคุณสมบัติระบบ
- 4.2 Feature 1: Authentication & Authorization
- 4.3 Feature 2: Product Management
- 4.4 Feature 3: Inventory Management
- 4.5 Feature 4: Shopping Cart
- 4.6 Feature 5: Order Management
- 4.7 Feature 6: Payment & Coupons
- 4.8 Feature 7: User Management
- 4.9 Feature 8: Reports & Dashboard
- 4.10 Feature 9: Settings
- 4.11 Feature 10: Internationalization (i18n)

### [5. External Interface Requirements](./05-External-Interface-Requirements.md)
- 5.1 User Interfaces
  - 5.1.1 ภาพรวม UI Design
  - 5.1.2 Color Palette
  - 5.1.3 Layout Structure
  - 5.1.4 Page Specifications
  - 5.1.5 UI Components
- 5.2 Hardware Interfaces
- 5.3 Software Interfaces
  - 5.3.1 Firebase Services
  - 5.3.2 Third-party Libraries
  - 5.3.3 Browser APIs
- 5.4 Communication Interfaces
- 5.5 Security Interfaces

### [6. Other Requirements](./06-Other-Requirements.md)
- 6.1 Database Requirements
  - 6.1.1 Database Overview
  - 6.1.2 Collections Structure
  - 6.1.3 Collection Schemas
  - 6.1.4 Indexes
  - 6.1.5 Security Rules
- 6.2 Internationalization (i18n)
- 6.3 Legal and Regulatory Requirements
- 6.4 Deployment Requirements
- 6.5 Testing Requirements
- 6.6 Documentation Requirements
- 6.7 Maintenance Requirements
- 6.8 Future Enhancements (Roadmap)
- 6.9 Appendix

---

## ข้อมูลเอกสาร

| หัวข้อ | รายละเอียด |
|--------|------------|
| **ชื่อโปรเจค** | InventoryPro |
| **เวอร์ชันเอกสาร** | 1.0 |
| **วันที่สร้าง** | 11 ธันวาคม 2567 |
| **สถานะ** | Draft |
| **ผู้จัดทำ** | ทีมพัฒนา |

---

## สรุปภาพรวมระบบ

```
┌─────────────────────────────────────────────────────────────────────┐
│                         InventoryPro                                 │
│              ระบบจัดการสินค้าคงคลังและการเบิกจ่าย                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │    Admin    │    │    Staff    │    │  Customer   │              │
│  │  (ผู้ดูแล)   │    │  (พนักงาน)  │    │  (ลูกค้า)   │              │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
│         │                  │                  │                      │
│         └──────────────────┼──────────────────┘                      │
│                            │                                         │
│                   ┌────────▼────────┐                               │
│                   │   Web Browser   │                               │
│                   │  (React SPA)    │                               │
│                   └────────┬────────┘                               │
│                            │                                         │
│                   ┌────────▼────────┐                               │
│                   │    Firebase     │                               │
│                   ├─────────────────┤                               │
│                   │ • Auth          │                               │
│                   │ • Firestore     │                               │
│                   │ • Storage       │                               │
│                   └─────────────────┘                               │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  Tech Stack:                                                         │
│  • Frontend: React 19, React Router 7                                │
│  • Backend: Firebase (BaaS)                                          │
│  • Database: Cloud Firestore                                         │
│  • Storage: Firebase Storage                                         │
│  • i18n: i18next (Thai/English)                                      │
│  • Hosting: Netlify                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ฟังก์ชันหลัก

| ฟังก์ชัน | Admin | Staff | Customer |
|----------|:-----:|:-----:|:--------:|
| จัดการสินค้า | ✅ | ❌ | ❌ |
| ดูสินค้า | ✅ | ✅ | ✅ |
| ตะกร้าสินค้า | ❌ | ✅ | ✅ |
| สร้างคำสั่งซื้อ | ❌ | ✅ | ✅ |
| ชำระเงิน | ❌ | ❌ | ✅ |
| ใช้คูปอง | ❌ | ❌ | ✅ |
| ดูคำสั่งทั้งหมด | ✅ | ❌ | ❌ |
| อัพเดทสถานะ | ✅ | ❌ | ❌ |
| จัดการผู้ใช้ | ✅ | ❌ | ❌ |
| จัดการคูปอง | ✅ | ❌ | ❌ |
| Dashboard | ✅ | ❌ | ❌ |

---

*© 2024 InventoryPro - Software Requirements Specification*
