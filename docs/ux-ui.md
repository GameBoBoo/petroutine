# PawRoutine UX/UI

## หลักการ

Today เป็น operational home ลดจำนวนคลิกของงานซ้ำ: Complete กดได้ทันที แต่มีช่องหมายเหตุแบบเลือกเปิดได้ ข้อมูลสำคัญถูกจัดตามความเร่งด่วน และ destructive action ใช้ข้อความยืนยันชัดเจน

## รูปแบบหน้าจอ

- Desktop: sidebar, content, contextual rail; มี Quick Add ใน sidebar และหน้า Today
- Mobile: bottom nav 5 รายการ พร้อมเว้นพื้นที่ไม่ให้ทับ content/Undo bar
- Today: ต้องดูแลก่อน, รายการถัดไป, เสร็จแล้วแบบพับได้ และตัวกรองคน/สัตว์/สถานะ
- Routine form: ฟิลด์หลักก่อน ตัวเลือกขั้นสูงเมื่อเปิด; weekly เลือกวัน, เพิ่ม/ลบหลายเวลา, interval/once/bounds/pause/assignee
- Pet Workspace: ภาพรวม กิจวัตร สุขภาพ Timeline
- ประวัติการเปลี่ยนแปลง: อธิบายว่าใครเปลี่ยนข้อมูลอะไรเมื่อใด พร้อมตัวกรองและรายละเอียดก่อน/หลัง
- บ้านของเรา: ปุ่มย้ายลงถังขยะแสดงเฉพาะ Owner และต้องพิมพ์ชื่อบ้านยืนยัน; ถังขยะมีปุ่มกู้คืนพร้อมเวลาที่นำออก

## Accessibility และ responsive

ใช้ semantic button/label/tab, focus trap และ Escape ใน Modal, error summary รับ focus, live region สำหรับ Undo, focus-visible, reduced motion และ touch target ขั้นต่ำ 44px เป้าหมายทดสอบคือ viewport 375px โดยไม่มี horizontal overflow

## ภาษาและความปลอดภัย

UI ใช้ภาษาไทยเป็นหลัก เวลาแสดงใน `Asia/Bangkok` สุขภาพระบุชัดว่าเป็นข้อมูลผู้ใช้กรอกเอง ไม่ใช่การวินิจฉัยหรือคำแนะนำรักษา และไม่มี upload ในรุ่นนี้
