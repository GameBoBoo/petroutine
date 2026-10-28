# ส่งมอบ PawRoutine ทีละขั้น

เอกสารชุดนี้ใช้กับ source รุ่นปัจจุบัน ไม่ใช้จำนวนฟีเจอร์เป็นหลักฐานว่าผ่านรายวิชา ผลที่ยังไม่ได้ตรวจต้องระบุว่า Pending

สำหรับสมาชิกที่ต้องการลองใช้งานบนเครื่อง ให้เริ่ม [README หลัก](../../README.md), [Configuration](../configuration.md) และ [Team testing](../team-testing.md) โดยใช้ `main` ส่วนหน้านี้เป็นกระบวนการส่งมอบและตรวจใน Course/Jenkins ผลตรวจแต่ละชุดมี revision กำกับ; ZIP/tag เดิมเป็น snapshot คนละรุ่นกับ main หลัง cleanup

ข้อกำหนดอ้างอิง: https://github.com/Tuchsanai/DevTools/blob/main/Mini_Project/project-details/README.md

เริ่มอ่าน [รายงานหลัก 7 มิติ](submission-report.md), [Checklist ตามเกณฑ์](submission-checklist.md), [แนวซ้อมสมาชิก](team-review-and-qa.md) และ [งบพร้อมสูตร](impact-and-sustainability.md) หากเปิด ZIP ให้เริ่ม START-HERE.md ซึ่งระบุ revision และ CI รุ่นส่ง

## 1. ตรวจขอบเขตและข้อมูลจริง

- อ่าน [Traceability](traceability.md) และ [ข้อจำกัด](known-limitations.md)
- เติมผลจริงใน [User validation](user-validation.md), [Impact](impact-and-sustainability.md) และ [Team](team-and-ai-disclosure.md)
- ซ้อมด้วย [บทสัมภาษณ์จำลอง 4 บทบาท](interview-rehearsal.md) ก่อนเก็บผลจริง
- เก็บข้อมูลส่วนบุคคลนอก Git ใช้รหัส P01… แทนชื่อผู้ให้สัมภาษณ์

## 2. เตรียม Course Container

ใช้ `tuchsanai/devtools:2569_1` โดยเปิด Docker-in-Docker ตาม [คู่มือ](course-and-ci.md) Clone/checkout commit ที่ต้องการส่งเข้าไปภายในกล่อง แล้วสร้าง `.delivery.env` ด้วย `bash scripts/delivery.sh init`

## 3. Verify → Build → Deploy

```bash
bash scripts/delivery.sh verify
bash scripts/delivery.sh build
bash scripts/delivery.sh deploy
bash scripts/delivery.sh backup
bash scripts/delivery.sh recovery-check
```

คำสั่ง `verify` ตรวจ production dependency audit แล้วรัน unit/API, build และ E2E ใช้ testdb แยกแบบ tmpfs ไม่มี port บน host และไม่ใช้ฐานข้อมูล production หลัก เมื่อขั้นใดไม่ผ่านต้องหยุดและบันทึก defect ผลลัพธ์เก็บใน `artifacts/`

## 4. รัน Jenkins

ดู [Course และ CI](course-and-ci.md) Jenkinsfile ใช้ Linux agent label `pawroutine-course` ที่เข้าถึง nested Docker daemon และ workspace path เดียวกับ daemon ได้ Build ที่ผ่านจึง publish image และ deploy ไปโครงการ Compose แยก `pawroutine-course-delivery`

## 5. ตรวจการกู้คืน

ดู [Recovery](operations-and-recovery.md) ใช้ backup จริงและ restore ลงฐานข้อมูลชื่อใหม่ ห้าม restore ทับฐานข้อมูลที่มีผู้ใช้งานโดยอัตโนมัติ

## 6. เตรียม Demo และนำเสนอ

ซ้อมตาม [Demo script](demo-script.md) และใช้ [สไลด์](presentation.html) เปิดใน browser กดลูกศรซ้าย/ขวา หรือ Print เป็น PDF อ่าน [ต้นฉบับสไลด์และ speaker notes](presentation.md) ด้วย

## 7. กำหนดรุ่นส่ง

ตรวจ `git diff --cached --stat`, ตัด `.env`, `.delivery.env`, database dump, credentials และ raw research ออก แล้ว commit/tag รุ่นที่จะส่ง ผลทดสอบต้องระบุ commit หรือ source snapshot ให้ตรงกัน Working-tree snapshot ใช้เป็นผลพัฒนาประกอบ แต่ต้องทดสอบ checkout ของรุ่นส่งก่อนยืนยัน release

## รายการที่ต้องมีคนหรือบัญชีภายนอก

ผลสัมภาษณ์/ทดลองใช้จริง การยืนยันหน้าที่และผลงานของสมาชิก ความเข้าใจระบบของสมาชิก การยอมรับการเปลี่ยนขอบเขต และสิทธิ์ push/registry ของทีม ไม่สามารถแทนที่ด้วยข้อมูลสมมติได้ Jenkins/registry ใน Course เป็นสภาพแวดล้อมพิสูจน์กระบวนการภายในเครื่อง
