# Acceptance Criteria และ Test Plan

| ID | เกณฑ์ยอมรับ |
|---|---|
| AC-01 | สมัคร เข้าสู่ระบบ สร้าง/เข้าร่วมบ้าน และเพิ่มสัตว์ได้ด้วยข้อมูลจริง |
| AC-02 | weekly หลายวัน/หลายเวลา, interval, once, bounds และ pause สร้าง occurrence ถูกต้องตามเวลาไทย |
| AC-03 | Today กรองคน/สัตว์/สถานะ และแสดง overdue, next, completed/skipped ถูกต้อง |
| AC-04 | Complete มีหมายเหตุแบบเลือกได้, Skip มีเหตุผล, reschedule/reassign ไม่เปลี่ยน parent routine |
| AC-05 | คำขอซ้ำด้วย idempotency key เดิมเกิด mutation/log เดียว; payload ต่างกันตอบ 409 |
| AC-06 | Undo สำเร็จภายใน 8 วินาที และตอบ 409 หากหมดเวลา/ถูกเปลี่ยนต่อแล้ว |
| AC-07 | care/health create-edit-archive เคารพสิทธิ์และไม่ลบประวัติ |
| AC-08 | Timeline และประวัติการเปลี่ยนแปลงอ่านข้อมูลจริง แยก household/account และ paginate ได้ |
| AC-09 | ทุก product-data mutation ที่สำเร็จมี Activity พร้อม actor/time และ sanitized before/after |
| AC-10 | มือถือ 375px ไม่มี horizontal overflow และเมนูคือ วันนี้ ปฏิทิน เพิ่ม สัตว์เลี้ยง เพิ่มเติม |
| AC-11 | Health เป็นข้อความ/ตัวเลขเท่านั้น และแสดงคำชี้แจงว่าไม่ใช่คำวินิจฉัย |
| AC-12 | migration 004–005 รันซ้ำได้และรักษาข้อมูล legacy |
| AC-13 | เฉพาะ Owner ย้ายบ้านลงถังขยะ/กู้คืนได้ บ้านถูกซ่อนจากสมาชิก ข้อมูลเดิมคงอยู่ และมี Activity สำหรับทั้งสองการกระทำ |

## Verification commands

```powershell
npm test
npm run build
npm run test:e2e
docker compose config
```

E2E ใช้ schema แยกต่อรอบ ครอบคลุม note, Undo, Skip, occurrence mutation, care/health, Timeline, ประวัติการเปลี่ยนแปลง, ถังขยะ/กู้คืนบ้าน และ mobile Quick Add/More
