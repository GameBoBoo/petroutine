# PawRoutine Session Handoff

อัปเดต 11 ตุลาคม 2026

## สถานะปัจจุบัน

Phase 4.7 Household Safety ถูกนำไปใช้แล้วต่อจาก Product Refinement: migration 005 เพิ่ม `households.archived_at/archived_by`, Owner-only archive/restore, ซ่อนและปิด data access ของบ้านในถังขยะ, เก็บ Activity archive/restore, นำ Handover ออกจาก UI/API และเปลี่ยนชื่อหน้า Activity เป็น “ประวัติการเปลี่ยนแปลง”

ผลยืนยันล่าสุด: `npm test` 41/41, `npm run build` ผ่าน, `npm run test:e2e` ผ่าน 2 flows และ skip 2 รายการตาม project guard โดย desktop E2E ครอบคลุมการยืนยันชื่อบ้าน, archive/restore และข้อมูลเดิม; API test ยืนยันว่าขณะ archived อ่านและแก้ pet/routine/care/health ไม่ได้

## Environment note

Compose ปกติเปิดสู่เครื่องผู้ใช้เพียง web ที่ `localhost:3000` ส่วน PostgreSQL อยู่ใน private Docker network ที่ `db:5432` และไม่มี host port

เมื่อต้องใช้ `npm run dev`, tests หรือ DBeaver จาก host ให้เปิดฐานข้อมูลแบบ loopback-only ด้วย:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
```

ค่า development คือ `127.0.0.1:55430` และ override ได้ด้วย `PAWROUTINE_DB_PORT` โปรเจกต์ไม่มี Git repository จึงไม่มี branch/commit/worktree

คำสั่งใช้งานปกติ:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

ผล runtime ล่าสุดหลัง deploy Phase 4.7: `http://localhost:3000` ตอบ 200, API และ database health เป็น `ok`, host port 3100 และ 55430 ปิด, migration 005 มีครบ 2 columns และข้อมูลผู้ใช้ 5 รายการยังอยู่หลัง recreate

## สิ่งที่ต้องทำต่อ

1. Design การรวม Pet Wellness Intelligence ได้รับอนุมัติและบันทึกที่ `docs/superpowers/specs/2026-10-11-pet-wellness-integration-design.md`
2. หากจะเริ่มพัฒนา ให้เขียน implementation plan สำหรับ Phase 5 Pet & Wellness Data Foundation ก่อน ห้ามเริ่มหลาย Phase พร้อมกัน
3. ลำดับ feature คือ Phase 5 foundation → 6 Daily Wellness → 7 baseline/Learning → 8 detection/alerts → 9 dashboard → 10 reminders/shared/Vet Report → 11 AI optional
4. Delivery pipeline เป็น track แยกหลัง freeze ของแต่ละ milestone
5. แยก `app/page.jsx` และ catch-all API เพิ่มเติมได้ในงาน maintainability ที่เกี่ยวข้อง

## ข้อห้าม

อย่าใช้ `docker compose down -v` กับข้อมูลจริง อย่ากล่าวว่า Phase 5–11 รองรับแล้ว อย่าตีความข้อมูล Wellness ที่หายไปเป็นศูนย์ อย่าให้ AI วินิจฉัย/คำนวณยา และอย่ากล่าวว่ารองรับ upload/push
