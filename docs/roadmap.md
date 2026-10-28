# Roadmap และขอบเขตปัจจุบัน

อัปเดต 28 ตุลาคม 2026 รายการนี้อธิบาย implementation ไม่ใช่หลักฐานว่าทุก Acceptance Criteria ถูกตรวจครบทุกกรณี

## มี implementation แล้ว

| ส่วน | ขอบเขต |
|---|---|
| Core care (Phase 0–4) | Auth, บ้าน/สมาชิก, สัตว์, กิจวัตร, assignment, notes, Calendar/Today, Settings และ notification ในเว็บ |
| Product refinement | ตารางยืดหยุ่น, occurrence control, confirmation, Undo, care/health records และ Timeline; Activity audit อยู่ใน backend ไม่มีหน้า Activity แยก |
| Household safety | Owner จัดการสมาชิก/รหัสเชิญ/โอนเจ้าของและลบบ้านแบบ soft archive; ไม่มี UI ถังขยะ/กู้คืนในรุ่นปัจจุบัน |
| Wellness (Phase 5–10) | Passport, daily logs, baseline 14 วัน, change detection, dashboard, follow-up/reminders และ Vet Report PDF ฝั่ง browser |
| Optional AI (Phase 11) | Chatbot/Care Brief และ care draft ที่ผู้ใช้ต้องตรวจยืนยันผ่าน mutation ปกติก่อนบันทึก; consent/authorization/source validation/fallback |
| Delivery | Docker/Compose, Course nested Docker, Jenkins/local registry, verification, deploy/health/smoke และ backup/restore |

Migration ล่าสุด 018 ส่วนแผนเดิมก่อนปรับ UI อยู่ใน `superpowers/` และเป็นประวัติการตัดสินใจ ไม่ใช่ checklist ติดตั้ง

## การตรวจและงานต่อ

- Baseline ก่อน cleanup: Jenkins #10 ที่ 9d6ef80 ผ่าน unit/API 76/76, E2E 14 ผ่าน/4 platform skips, audit/build/push-pull/deploy/recovery ภายใน Course
- Source หลังจัดระเบียบไฟล์: อ่าน [Maintenance](maintenance.md) สำหรับผลตรวจจริง ไม่ใช้ baseline มายืนยันแทน
- ให้ทีม clone source ที่ push แล้วตาม [README](../README.md) และทำ [Team testing](team-testing.md)
- ยังต้องมีสมาชิกยืนยันผลงาน/ความเข้าใจจริง และหลักฐาน GitHub change → Jenkins ของรุ่นที่เผยแพร่
- AI mock E2E และ live synthetic evaluator บน host ไม่แทน UI/API/provider จริงครบเส้นทางใน Course
- มีแหล่งวิจัยภายนอก/แผนสัมภาษณ์/ตัวชี้วัดและงบประมาณ แต่ยังไม่มีผลผู้ใช้จริงหรือ outcome ที่วัดแล้ว
- เปรียบเทียบ Proposal ที่ผู้สอนรับไว้และบันทึกการเปลี่ยนขอบเขตตามจริง หากนอกเหนือจากเอกสารใน workspace

## ยังไม่มีแผนอนุมัติใหม่

ยังไม่ได้กำหนด Phase 12 ไฟล์แนบ, email/push, Behavior Coach, server-generated PDF และ baseline ขั้นสูงยัง deferred ไม่มี AI วินิจฉัยหรือคำนวณยา

ดู [Requirements](requirements.md), [AC](acceptance-criteria.md), [Architecture](architecture.md), [Delivery runbook](delivery/README.md) และ [Known limitations](delivery/known-limitations.md)
