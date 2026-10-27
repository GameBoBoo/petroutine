# Course verification และ Jenkins results

เริ่มตรวจ 28 ตุลาคม 2026 เวลาไทย ใช้ `tuchsanai/devtools:2569_1` ที่ติดตั้งอยู่บนเครื่อง โดยเปิดกล่องแยกชื่อ `pawroutine-course` และใช้ Docker daemon ภายในกล่อง เว็บเดิม port 3000 ไม่ใช่ระบบที่ใช้ตรวจรอบนี้

## Defect ที่พบจาก clean database

Precheck แรก: unit/API 66 ผ่าน 10 ไม่ผ่านจาก 76 tests สาเหตุหลักคือ test setup บางไฟล์ระบุ migration ถึง 016 จึงไม่มี `scheduled_health_outcomes` ใน schema สะอาด ผล local เดิม 76/76 ไม่เพียงพอจะยืนยัน isolated schema เพราะ search_path ยังอ่าน public ได้

การแก้: เพิ่ม `db/migrations.mjs` ให้ runtime/full-schema tests/E2E ใช้ migration set เดียวกัน ส่วน migration-specific tests ยังคงสร้าง schema รุ่นเก่าเพื่อทดสอบการอัปเกรดตามเดิม

## ผลหลังแก้

Pending — จะบันทึกจาก verification.json, Jenkins build result และ smoke/recovery artifacts หลังตรวจสำเร็จ ห้ามใช้ข้อความนี้อ้างว่า Accepted

## Provenance

รอบ precheck ใช้ local working-tree snapshot ที่ตัด .env/dump/Git metadata ออก และสร้าง commit ภายในกล่องเพื่อให้ checkout ได้ Snapshot นี้เป็น artifact ของ automation ไม่ใช่หลักฐานแบ่งงานของสมาชิก และยังไม่ใช่ remote release

หลักฐานที่สร้างอัตโนมัติอยู่ใน `artifacts/` ซึ่งถูก ignore เพื่อไม่ส่ง log/ข้อมูลทดสอบ/backup ขึ้น Git โดยไม่ตรวจ ผู้ส่งควรเลือกเฉพาะผลที่ปลอดภัยแนบกับรุ่นส่งหรือ Jenkins archive
