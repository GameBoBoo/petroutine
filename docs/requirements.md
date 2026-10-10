# Requirements

## Functional requirements

1. ผู้ใช้สมัคร/เข้าสู่ระบบ แก้ชื่อ และตั้งค่าการแจ้งเตือนในเว็บได้
2. ผู้ใช้สร้างหรือเข้าร่วมบ้าน และ Owner เปลี่ยนชื่อ เชิญสมาชิก ย้ายบ้านไปถังขยะ และกู้คืนพร้อมข้อมูลเดิมได้
3. สมาชิกเพิ่ม/แก้สัตว์เลี้ยงได้; Owner soft archive ได้โดยประวัติยังอยู่
4. Owner สร้าง/แก้/พัก/เก็บกิจวัตรแบบ weekly, interval หรือ once รองรับหลายเวลา วันเริ่ม/สิ้นสุด ช่วงพัก และผู้รับผิดชอบ
5. Today แสดงงานตาม `Asia/Bangkok` แยก overdue, pending, completed/skipped และกรองผู้รับผิดชอบ สัตว์ และสถานะ
6. สมาชิก Complete ได้ทันทีหรือพร้อมหมายเหตุ, Skip พร้อมเหตุผล, reschedule/reassign เฉพาะ occurrence และ Undo ภายใน 8 วินาที
7. Quick Add มี 5 ทางเลือก: กิจวัตร, เทมเพลต, นัดหมาย, care entry นอกตาราง และ health record
8. Health record เป็นข้อความ/ตัวเลขที่ผู้ใช้กรอกเอง ไม่มีไฟล์ รูป การวินิจฉัย หรือการคำนวณยา
9. Pet Timeline รวม task, care entry, health record และการเปลี่ยนแปลงที่เกี่ยวข้อง แม้แหล่งข้อมูลถูก archive
10. ทุก mutation ของข้อมูลผลิตภัณฑ์เขียน Activity Log แบบ immutable ใน transaction เดียวกัน พร้อม snapshot ที่ผ่าน allowlist
11. “ประวัติการเปลี่ยนแปลง” แยก household log จาก account log และค้นตามสมาชิก สัตว์ การกระทำ และวันที่ได้
12. บ้านในถังขยะไม่แสดงในรายการปกติและไม่มีใครเข้าถึงข้อมูลได้; เฉพาะ Owner เห็นถังขยะและกู้คืนได้

## Non-functional requirements

- Thai-first, responsive ที่ 375px, keyboard/focus/label ใช้งานได้ และปุ่มหลักอย่างน้อย 44px
- PostgreSQL migration ต้อง additive/rerunnable และไม่ทำลายข้อมูลเดิม
- API ใช้ error envelope `{ error: { code, message, fields? } }`
- task mutation ใช้ optimistic version และรองรับ `Idempotency-Key`
- แยกข้อมูลทุกบ้านด้วย membership/role checks; ไม่เก็บ secret ใน Activity snapshot
- เวลาทางธุรกิจและการแสดงผลใช้ `Asia/Bangkok`

## Out of scope ของรุ่นปัจจุบัน

ไฟล์/รูปแนบ, email/push notification, AI/LLM, คำแนะนำทางการแพทย์, การวินิจฉัย, dose calculation, invite expiry/rotation และ Jenkins/Course Container

## Planned product requirements (Phase 5–11; ยังไม่ implement)

1. ขยายโปรไฟล์สัตว์และ Health Passport ให้เก็บสายพันธุ์ เพศ ทำหมัน น้ำหนักตั้งต้น แพ้ยา โรคประจำตัว ยาประจำ วัคซีน และวันนัดครั้งถัดไปแบบข้อความ/ตัวเลข
2. Daily Wellness Log ต้องเลือกกรอกอาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก และข้อสังเกตย้อนหลังได้ โดยช่องว่างไม่เท่ากับศูนย์
3. Learning Mode และ baseline ต้องแยกตามสัตว์/metric ใช้หน้าต่าง 14 วัน และแสดงข้อมูลไม่เพียงพอแทนการคาดเดา
4. Rule-based detection ต้องสร้าง Alert จากการเบี่ยงเบนต่อเนื่องแบบ deterministic พร้อมหลักฐานและ lifecycle โดยไม่วินิจฉัยโรค
5. Wellness Dashboard ต้องแสดงสถานะ Learning/Stable/Changes Detected/Insufficient Data และกราฟ 7/14/30/90 วันโดยไม่สร้างค่าทดแทนวันที่ไม่มีข้อมูล
6. Reminders, shared monitoring และ Vet Report ต้องทำงานจากข้อมูลจริงและไม่พึ่ง AI
7. AI เป็น optional Phase สุดท้าย ใช้เฉพาะ context/ผลคำนวณที่ระบบเตรียมให้ มี logging/guardrail/fallback และปิดได้โดย core Wellness ยังทำงานครบ

ขอบเขตไฟล์/รูปแนบ, email/push, การวินิจฉัย, dose calculation และ Behavior Coach ยังคง deferred แม้เริ่ม Phase 5–10
