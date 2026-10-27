# Acceptance Criteria และ Test Plan

| ID | เกณฑ์ยอมรับ |
|---|---|
| AC-01 | สมัคร เข้าสู่ระบบ สร้าง/เข้าร่วมบ้าน และเพิ่มสัตว์ได้ด้วยข้อมูลจริง |
| AC-02 | weekly หลายวัน/หลายเวลา, interval, once, bounds และ pause สร้าง occurrence ถูกต้องตามเวลาไทย |
| AC-03 | Today กรองคน/สัตว์/สถานะ แสดง overdue, next, completed/skipped และรวม care/health/wellness ที่บันทึกในวันเดียวกันตามเวลา Asia/Bangkok |
| AC-04 | Complete มีหมายเหตุแบบเลือกได้, Skip มีเหตุผล, reschedule/reassign ไม่เปลี่ยน parent routine และต้องยืนยันก่อนเปลี่ยนข้อมูล |
| AC-05 | คำขอซ้ำด้วย idempotency key เดิมเกิด mutation/log เดียว; payload ต่างกันตอบ 409 |
| AC-06 | Undo สำเร็จภายใน 8 วินาที และตอบ 409 หากหมดเวลา/ถูกเปลี่ยนต่อแล้ว |
| AC-07 | care/health create-edit-archive เคารพสิทธิ์และไม่ลบประวัติ |
| AC-08 | Timeline และประวัติการเปลี่ยนแปลงอ่านข้อมูลจริง แยก household/account และ paginate ได้ |
| AC-09 | ทุก product-data mutation ที่สำเร็จมี Activity ภายในพร้อม actor/time และ sanitized before/after โดยไม่มีหน้า Change History ใน UI |
| AC-10 | มือถือ 375px ไม่มี horizontal overflow และเมนูคือ วันนี้ ปฏิทิน เพิ่ม สัตว์เลี้ยง เพิ่มเติม |
| AC-11 | Health เป็นข้อความ/ตัวเลขเท่านั้น และแสดงคำชี้แจงว่าไม่ใช่คำวินิจฉัย |
| AC-12 | migration 004–005 รันซ้ำได้และรักษาข้อมูล legacy |
| AC-13 | เฉพาะ Owner ลบบ้านได้หลังพิมพ์ชื่อยืนยัน บ้านถูกซ่อนจากสมาชิกและไม่แสดงรายการถังขยะใน UI ขณะที่ข้อมูลเดิมยังคงอยู่ |
| AC-14 | โปรไฟล์ Wellness และ Health Passport ทั้ง 5 ประเภทสร้าง/อ่าน/แก้/archive ตามสิทธิ์ได้ ข้อมูลเดิมยังอยู่ มี Activity/Timeline และบ้านในถังขยะเข้าถึงไม่ได้ |
| AC-15 | Daily Wellness เลือกกรอกข้อมูลบางส่วน ย้อนหลัง และหลายรายการต่อวันได้ ช่องว่างไม่เป็นศูนย์ ผู้สร้างหรือ Owner แก้/archive ได้ และมี Activity/Timeline แม้รายการถูก archive |
| AC-16 | Baseline ใช้ 14 วัน Bangkok แยก pet+metric นับหนึ่งค่าต่อวัน แสดง progress/ข้อมูลไม่เพียงพอ ตรวจย้อนกลับ source ได้ และให้ผลใหม่แบบ deterministic หลัง edit/archive |
| AC-17 | Alert เกิดเมื่อครบกฎ 3 วันต่อเนื่องเท่านั้น วันที่ขาดตัดลำดับ มีหลักฐานและสถานะรับทราบ/ติดตาม ปิดหลังกลับปกติ 2 วันหรือ source เปลี่ยน แสดงใน Activity/Timeline และไม่ใช้ข้อความวินิจฉัย |
| AC-18 | Wellness Dashboard แสดงสถานะรวมและ 7 metrics ในช่วง 7/14/30/90 วันพร้อม baseline band/active alerts, คงวันที่ไม่มีข้อมูลเป็นช่องว่าง, มีตารางข้อมูลที่เข้าถึงได้ และไม่ล้น viewport 375px |
| AC-19 | Notification รวม task/health due/Wellness follow-up ตามระยะที่ตั้งและลบแบบ persistent รายผู้ใช้ได้, สมาชิกมอบหมาย shared follow-up พร้อม Activity ได้ และ Vet Report ช่วงไม่เกิน 366 วันพิมพ์หรือ Save as PDF ได้โดยไม่พึ่ง AI หรือรั่วข้ามบ้าน |
| AC-20 | AI ตรวจ membership, เปิดใช้รายบ้าน, consent ของสมาชิก และ quota ก่อนส่ง context; ถอน consent หรือปิด AI แล้ว core care ยังทำงานได้ |
| AC-21 | AI chatbot ตอบจาก context ตามสิทธิ์ ตรวจ JSON/source IDs กับ allowlist; ข้อมูลไม่พอต้องไม่สร้างข้อเท็จจริงขึ้นเอง และแจ้งเมื่อ context ถูกตัด |
| AC-22 | เมื่อ provider timeout, HTTP error หรือ output ผิดรูปแบบ UI แสดงข้อผิดพลาดที่เข้าใจได้ ไม่มี key รั่ว และไม่ทำให้ข้อมูลดูแลเปลี่ยนเอง |
| AC-23 | AI care draft ตรวจ mode/type/ค่าตัวเลขและความยาว ไม่สร้าง record จนผู้ใช้ตรวจและยืนยันผ่าน mutation ปกติ; ไม่สร้างคำวินิจฉัยหรือปรับขนาดยา |

เกณฑ์ AI ด้านเนื้อหาต้องตรวจด้วย provider จริงเพิ่มเติมจาก mocked API tests โดยเฉพาะหลายสัตว์ ข้อมูลไม่พอ medical boundary และ prompt injection ผล heuristic evaluation ไม่ใช่การรับรองทุกคำตอบ ดู [Traceability](delivery/traceability.md)

## Verification commands

เกณฑ์เพิ่มเติมของ UX วันที่ 23 ต.ค. 2026: กิจวัตรหลักค้นหา/กรอง/แบ่ง 10 รายการได้ รายละเอียดพับได้ ใช้ “ลบ” พร้อม confirmation, cancel ไม่ส่ง mutation, ยืนยันแล้วส่งครั้งเดียว และ keyboard/Escape/focus ทำงานบน desktop/mobile ผล E2E ล่าสุดดู delivery-verification.md; test ผ่านบาง flow ไม่ได้ยืนยันทุก keyboard path

```powershell
npm test
npm run build
npm run test:e2e
docker compose config
```

E2E ใช้ schema แยกต่อรอบ ครอบคลุม note, Undo, Skip, occurrence mutation, care/health, โปรไฟล์ Wellness/Health Passport, Daily Wellness Quick Check-in, Learning Mode progress, Wellness Alert evidence/lifecycle/shared follow-up, Wellness Dashboard, notification dismissal, Vet Report/print media, Timeline, การซ่อน Change History/บ้านที่ลบ และ desktop/mobile 375px
