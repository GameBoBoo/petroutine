# Course verification และ Jenkins results

เริ่มตรวจ 28 ตุลาคม 2026 เวลาไทย ใช้ `tuchsanai/devtools:2569_1` ที่ติดตั้งอยู่บนเครื่อง โดยเปิดกล่องแยกชื่อ `pawroutine-course` และใช้ Docker daemon ภายในกล่อง เว็บเดิม port 3000 ไม่ใช่ระบบที่ใช้ตรวจรอบนี้

## Defect ที่พบจาก clean database

Precheck แรก: unit/API 66 ผ่าน 10 ไม่ผ่านจาก 76 tests สาเหตุหลักคือ test setup บางไฟล์ระบุ migration ถึง 016 จึงไม่มี `scheduled_health_outcomes` ใน schema สะอาด ผล local เดิม 76/76 ไม่เพียงพอจะยืนยัน isolated schema เพราะ search_path ยังอ่าน public ได้

การแก้: เพิ่ม `db/migrations.mjs` ให้ runtime/full-schema tests/E2E ใช้ migration set เดียวกัน ส่วน migration-specific tests ยังคงสร้าง schema รุ่นเก่าเพื่อทดสอบการอัปเกรดตามเดิม

## ผลหลังแก้

Pending — จะบันทึกจาก verification.json, Jenkins build result และ smoke/recovery artifacts หลังตรวจสำเร็จ ห้ามใช้ข้อความนี้อ้างว่า Accepted

Jenkins build #1 ใช้ precheck source และจบ FAILURE โดย stage build image/publish/deploy ถูกข้าม Build #2 หลังแก้ migration ผ่าน unit/API 76/76 และ production build แต่ E2E 12 ผ่าน 4 ข้าม 2 ไม่ผ่าน เพราะ Chromium ใน Course ให้ชื่อไฟล์ PDF ว่า `download` แทนชื่อรายงาน แก้ production download ให้สร้าง Blob link พร้อม download filename โดยตรงและตรวจซ้ำใน build ถัดไป

## AI provider evaluation (host, synthetic only)

รอบแรก auto checks 5/5 แต่ manual review พบปี `2526` ที่ไม่ตรง source จึงบันทึกเป็น defect เพิ่มการตรวจปี/ISO date และใช้ prompt เดียวกับ production ที่ให้คัดลอก ISO date ตรงจากหลักฐาน รอบหลังแก้ผ่าน 5/5 รวม multi-pet/no-evidence/medical boundary/injection พร้อมอ่านคำตอบจริงประกอบ

Care draft ใช้ production prompt/parser ตรวจ feeding, weight 4.2 kg และ observation ผ่าน 3/3 ไม่บันทึก record ผลนี้ไม่ใช่ clinical validation และยังไม่ครอบคลุมทุกคำถาม/ข้อความ

ผล JSON อยู่ที่ `artifacts/ai-evaluation.json`, `artifacts/ai-evaluation-before-date-fix.json` และ `artifacts/ai-draft-evaluation.json` ไม่มี key และใช้ข้อมูลสมมติ

## Provenance

รอบ precheck ใช้ local working-tree snapshot ที่ตัด .env/dump/Git metadata ออก และสร้าง commit ภายในกล่องเพื่อให้ checkout ได้ Snapshot นี้เป็น artifact ของ automation ไม่ใช่หลักฐานแบ่งงานของสมาชิก และยังไม่ใช่ remote release

หลักฐานที่สร้างอัตโนมัติอยู่ใน `artifacts/` ซึ่งถูก ignore เพื่อไม่ส่ง log/ข้อมูลทดสอบ/backup ขึ้น Git โดยไม่ตรวจ ผู้ส่งควรเลือกเฉพาะผลที่ปลอดภัยแนบกับรุ่นส่งหรือ Jenkins archive
