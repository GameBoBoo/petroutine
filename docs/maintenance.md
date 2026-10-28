# การจัดระเบียบโครงการ — 28 ตุลาคม 2026

## สิ่งที่ปรับ

- ลบ `features/activity/ActivityView.jsx` ซึ่งไม่มี import/route ที่เปิดใช้; backend audit/Activity/Undo ยังอยู่
- ลบ `features/today/useToday.js` ซึ่งถูกแทนด้วย mutation flow ใน app/page.jsx และไม่มี caller ปรับ static test ให้อ่าน implementation ที่ใช้งานจริง
- ลบ public assets เก่า 10 ไฟล์ที่ไม่มี runtime reference รวมภาพ PNG รุ่นก่อนและโลโก้ PawRoutine เดิม ปรับ brand asset test ให้ตรวจ BrandLogo และ pet avatars ปัจจุบัน เก็บโลโก้ PetRoutine ที่สไลด์ใช้และฟอนต์/ใบอนุญาตไว้
- ลบ `scripts/seed-demo-data.sql` ที่ TRUNCATE ข้อมูลเก่า ใช้ synthetic API seed ที่สร้างบ้านใหม่แทน
- เพิ่ม `scripts/setup-local.mjs` สร้าง .env แบบไม่เขียนทับ พร้อม random JWT secret; ตัวอย่าง env ไม่แจก JWT secret ร่วมกัน
- เพิ่ม healthcheck ของ web และเลิกล็อก container_name ของ DB เพื่อให้ Compose แยก project ได้
- ปรับ README/คู่มือทีม/ดัชนีเอกสารและ handoff ให้ตรงขั้นตอน clone/run/test แยก historical plans จากเอกสารปัจจุบัน
- ignore tmp/ และเอา exclude ของโฟลเดอร์ legacy ที่ไม่มีใน repo ออกจาก Docker ignore

ไม่ได้ลบ migrations, tests, operational scripts หรือ historical requirements เพียงเพราะชื่อเก่า CSS ที่ root layout import ยังใช้งานอยู่จึงคงไว้ ไม่มีการลบข้อมูลใน DB หรือ volumes

## ผลตรวจของรอบนี้

ตรวจ working-tree snapshot หลัง cleanup ภายใน Course `tuchsanai/devtools:2569_1` ใน Compose project และฐานข้อมูลใหม่แยกจากของเดิม (ไม่ได้เป็น Jenkins run ใหม่) [JSON และ hash ของ source ที่ตรวจ](delivery/evidence/team-cleanup-verification.json)

| รายการ | ผลจริง |
|---|---|
| setup-local | สร้าง JWT secret สุ่ม/AI ปิด; เรียกซ้ำและ custom .env ไม่ถูกเขียนทับ |
| Production audit | ผ่าน high/critical gate |
| Unit/API | 76/76 ผ่าน, 0 ล้มเหลว |
| Production build | ผ่าน |
| E2E | 14 ผ่าน, 4 platform skips, 0 ล้มเหลว |
| Fresh Compose startup | setup → config → build → up --wait → health/API smoke ผ่าน |
| Persistence | stop/start ผ่าน ข้อมูล synthetic users/households/pets คงอยู่ 1/1/1 |
| เอกสาร | ลิงก์ภายในไม่ขาด; ไม่พบโมดูล components/features/lib ที่ไม่มี import จากการตรวจ reference |

คำสั่ง verification ใช้ `DELIVERY_PROJECT=pawroutine-team-cleanup DELIVERY_REVISION=working-tree-cleanup bash scripts/delivery.sh verify` และทดสอบ Compose ปกติด้วย project `pawroutine-team-start` port 3003 เพื่อไม่ชนของเดิม Raw logs อยู่ artifacts/team-cleanup/ ที่ Git ignore ผลนี้ไม่ใช่ clinical/user validation และยังไม่ยืนยัน provider จริงผ่าน app ใน Course ไม่ได้รัน npm dev บนเครื่อง Windows ใหม่แยกต่างหาก

## รุ่นส่งเก่า

Tag submission-20261028 และ ZIP วันที่ 28 ต.ค. เป็น snapshot ก่อน cleanup ไม่แก้ทับเพื่อรักษาความตรงกับผล CI เดิม งานหลัง cleanup ถูกรวมเข้า `main` ในเครื่องเพื่อให้ผู้ดูแล push `main` เอง สมาชิกจึง clone `main` ตาม README และได้ source รุ่นใหม่
