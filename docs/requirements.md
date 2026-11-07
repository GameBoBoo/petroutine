# Requirements

## Functional requirements

1. ผู้ใช้สมัคร/เข้าสู่ระบบ แก้ชื่อ และตั้งค่าการแจ้งเตือนในเว็บได้
2. ผู้ใช้สร้างหรือเข้าร่วมบ้าน และ Owner เปลี่ยนชื่อ เชิญสมาชิก หรือลบบ้านด้วยการยืนยันชื่อได้ โดยบ้านที่ลบต้องไม่แสดงใน UI
3. สมาชิกเพิ่ม/แก้สัตว์เลี้ยงได้; Owner soft archive ได้โดยประวัติยังอยู่
4. สมาชิกของบ้านสร้างกิจวัตรแบบ weekly, interval หรือ once ให้สัตว์ในบ้านได้ ส่วน Owner แก้/ลบกิจวัตรเดิม กิจวัตรรองรับหลายเวลา วันเริ่ม/สิ้นสุด ช่วงพัก และผู้รับผิดชอบ เมื่อเลือกทุกคนในบ้านจะเก็บผู้รับผิดชอบเป็นค่าว่าง UI ไม่มีปุ่มปิดกิจวัตรชั่วคราว หน้าหลักค้นหา/กรองสัตว์และแบ่ง 10 รายการ
5. Today แสดงข้อมูลตาม `Asia/Bangkok` โดยรวมงานตามตารางและ Quick Add ของวันนี้ แยก overdue, pending, บันทึกวันนี้ และ completed/skipped พร้อมกรองผู้รับผิดชอบ สัตว์ และสถานะ
6. สมาชิก Complete พร้อมหมายเหตุ optional, Skip พร้อมเหตุผล, reschedule/reassign เฉพาะ occurrence และ Undo ภายใน 8 วินาที โดยต้องยืนยันก่อนเปลี่ยนข้อมูล รวมถึง Reopen พร้อมเหตุผล
7. Quick Add มีเช็กอินสุขภาพรายวัน กิจวัตร งานครั้งเดียว care entry นอกตาราง และ health record ผู้สร้างหรือ Owner แก้ไขและลบ care entry จาก Timeline ได้โดยต้องยืนยันก่อนบันทึก ไม่มีลิงก์เลือกแม่แบบใน UI
8. Health record เป็นข้อความ/ตัวเลขที่ผู้ใช้กรอกเอง ไม่มีไฟล์ รูป การวินิจฉัย หรือการคำนวณยา
9. Pet Timeline รวม task, care entry, health record, Daily Wellness Log และการเปลี่ยนแปลงที่เกี่ยวข้อง แม้แหล่งข้อมูลถูก archive
10. ทุก mutation ของข้อมูลผลิตภัณฑ์เขียน Activity Log แบบ immutable ใน transaction เดียวกัน พร้อม snapshot ที่ผ่าน allowlist
11. ระบบเก็บ Activity Log ภายในเพื่อ audit/Undo แต่ไม่มีหน้า “ประวัติการเปลี่ยนแปลง” ใน navigation หรือ UI
12. บ้านที่ลบไม่แสดงในรายการปกติหรือหน้า “บ้านของเรา” และสมาชิกทุกคนเข้าถึงข้อมูลบ้านนั้นไม่ได้
13. โปรไฟล์สัตว์เก็บสายพันธุ์ เพศ สถานะทำหมัน น้ำหนักตั้งต้น/วันที่ชั่งแบบ optional และ Health Passport เก็บการแพ้ ภาวะประจำตัว ยาประจำ วัคซีน นัดหมาย วันที่เริ่ม/สิ้นสุด/ครั้งถัดไป พร้อมสิทธิ์และ Activity Log
14. Daily Wellness Log เลือกกรอกอาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก หรือข้อสังเกตย้อนหลังได้ รองรับหลายบันทึกต่อวัน ผู้สร้างหรือ Owner แก้/archive ได้ และช่องว่างไม่ถูกตีความเป็นศูนย์
15. Learning Mode คำนวณ baseline แยกสัตว์/metric จาก 14 วันตามเวลา Bangkok นับหนึ่งค่าต่อ metric ต่อวัน แสดง progress/ความพร้อม/ข้อมูลไม่เพียงพอ และคำนวณใหม่แบบ deterministic เมื่อข้อมูลต้นทางเปลี่ยน
16. Change Detection ตรวจ relative metric เปลี่ยนทิศเดียวกัน 3 วัน, stool/mood เป็นค่าใหม่เดียวกัน 3 วัน และน้ำหนักเปลี่ยนอย่างน้อย 10% 3 วัน โดยวันขาดข้อมูลตัดลำดับ
17. Wellness Alert ต้องแสดง baseline, ค่าที่พบ, ช่วงเวลา, กฎและ source รองรับรับทราบ/ติดตาม/resolve และต้องระบุว่าไม่ใช่การวินิจฉัย
18. Wellness Dashboard ต้องแสดงสถานะ Learning/Stable/Changes Detected/Insufficient Data และกราฟ 7/14/30/90 วันพร้อม baseline band, active alerts และตารางข้อมูล โดยไม่สร้างค่าทดแทนวันที่ไม่มีข้อมูล
19. In-app reminder ต้องรวมงาน วัคซีน/นัดหมาย และ Wellness follow-up จากวันจริง ลบ/ซ่อนแบบถาวรแยกต่อผู้ใช้ได้; shared monitoring ต้องกำหนดผู้ติดตาม/วัน/หมายเหตุได้; Vet Report ต้องเลือกช่วงไม่เกิน 366 วันและพิมพ์หรือ Save as PDF จาก browser ได้โดยไม่พึ่ง AI

## ข้อกำหนด UX เพิ่มเติม 7 พฤศจิกายน 2569

กิจวัตรใน Sidebar/รายสัตว์และยอดนับไม่รวม once; งานครั้งเดียวยังใช้ occurrence engine ใน Today/Calendar จัดการรายการผ่านปุ่มเดียวใน header โดยเคารพสิทธิ์ หน้า บ้านและสมาชิก แสดงลบบ้านโดยตรงให้ Owner ส่วน PDF เป็น Minimal A4 พร้อมโลโก้และ export copy แยกจาก preview ดู [Current release](current-release.md)

## Non-functional requirements

- Thai-first, responsive ที่ 375px, keyboard/focus/label ใช้งานได้ และปุ่มหลักอย่างน้อย 44px
- PostgreSQL migration ต้อง additive/rerunnable และไม่ทำลายข้อมูลเดิม
- API ใช้ error envelope `{ error: { code, message, fields? } }`
- task mutation ใช้ optimistic version และรองรับ `Idempotency-Key`
- แยกข้อมูลทุกบ้านด้วย membership/role checks; ไม่เก็บ secret ใน Activity snapshot
- เวลาทางธุรกิจและการแสดงผลใช้ `Asia/Bangkok`

## Out of scope ของรุ่นปัจจุบัน

ไฟล์แนบ, email/push notification, server-generated binary PDF, คำแนะนำทางการแพทย์, การวินิจฉัย และ dose calculation ยังคงนอกขอบเขต ส่วน Jenkins/Course Container เป็นข้อกำหนดของ delivery track ตามรายวิชา ไม่ใช่ข้อยกเว้นจากการส่งงาน ดู [Delivery runbook](delivery/README.md)

## AI Phase 11 — อ่านและสรุปจากบันทึก

1. AI เป็น optional chatbot สำหรับถามค้นและสรุปข้อมูลที่มีสิทธิ์เข้าถึงพร้อมอ้างอิง ใช้ context/ผลคำนวณที่ระบบเตรียมให้ มี metadata logging/guardrail/fallback และปิดได้โดย core Wellness ยังทำงานครบ
2. Care Brief มีสรุปส่งต่อและ cache ระหว่างสลับหน้า แยกผู้ใช้/บ้าน ไม่มี AI draft หรือเตรียมคุยสัตวแพทย์ใน UI; backend draft เดิมยังอยู่เพื่อ compatibility และไม่เขียนข้อมูลเอง ดูสถานะ legacy API ใน AC-23

## UX ที่ต้องรักษา (23 ตุลาคม 2026)

ใช้คำว่า “ลบ” ใน UI แต่คง soft archive และประวัติ ต้องยืนยันก่อนลบและบันทึก/เปลี่ยนสถานะสำคัญ ลบบ้านต้องพิมพ์ชื่อบ้าน โดย Owner จัดการรหัสเชิญอายุ 7 วัน นำสมาชิกออก และโอนเจ้าของได้แล้ว Dropdown ใช้ตัวเลือกและคำอธิบายของระบบ ดู [Popup fields](popup-fields.md)

ขอบเขตไฟล์/รูปแนบ, email/push, server-generated PDF, การวินิจฉัย, dose calculation และ Behavior Coach ยังคง deferred
