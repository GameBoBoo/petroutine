# System Architecture

## Runtime

Browser (React 19/Next.js 15 App Router) → `/api/v1/[...path]` Route Handler → domain services → `pg` transaction → PostgreSQL 16

Route ทำหน้าที่ auth, parse HTTP และ map error ส่วน logic อยู่ใน `lib/services`: access, transaction, household, routine, task, care entry, health record, activity และ timeline Schedule engine เป็น pure module ที่ `lib/schedule.js`

## Client structure

- `app/page.jsx`: session/workspace orchestration และ legacy screen composition
- `components/`: Icon, Modal, shell contract, UndoBar
- `features/today`: Today workflow และ task controls
- `features/quick-add`, `features/routines`, `features/pets`, `features/activity`, `features/household`: feature views

## Consistency and safety

- task mutation ล็อก row ตรวจ `mutation_version` และใช้ idempotency record
- Undo ล็อก Activity+entity ตรวจเวลาและ version ปัจจุบัน
- product mutations เขียน sanitized Activity ใน transaction เดียวกัน
- membership/Owner/creator guards ป้องกันข้อมูลข้ามบ้าน
- household trash เป็น soft delete: `archived_at` ซ่อนบ้านและปิดการเข้าถึง แต่เก็บ graph ข้อมูลเดิมไว้เพื่อกู้คืนโดย Owner
- schedule/date/display ใช้ `Asia/Bangkok`; projection อนาคตไม่สร้าง task row จนจำเป็น

## Operations

```text
Host browser
    │ http://localhost:3000 (พอร์ตสาธารณะเพียงจุดเดียว)
    ▼
Next.js Web + /api/v1
    │ postgres://...@db:5432 (Docker network ภายใน)
    ▼
PostgreSQL 16 + named volume
```

Docker Compose มี web+db, healthcheck และ named volume ค่าเริ่มต้น publish เฉพาะ web ที่ port 3000; PostgreSQL ใช้ private Docker network ที่ `db:5432` และไม่มี host binding ส่วน `docker-compose.dev.yml` เปิดฐานข้อมูลเฉพาะ `127.0.0.1:55430` เมื่อจำเป็นต้องใช้เครื่องมือจาก host เท่านั้น Web รัน migration ก่อน start และ E2E ใช้ schema สุ่มแยกก่อนลบเฉพาะ schema ของรอบนั้น

ห้ามรัน Docker web และ `npm run dev` พร้อมกัน เพราะทั้งคู่ยึด host port 3000 การหยุดด้วย `docker compose down` ยังเก็บข้อมูลไว้ แต่ `docker compose down -v` จะลบ named volume และไม่ควรใช้กับข้อมูลจริง

ข้อจำกัดปัจจุบัน: catch-all route และ `app/page.jsx` ยังมีขนาดใหญ่, ไม่มี push/email, file upload, AI, invite rotation หรือ CI/CD pipeline
