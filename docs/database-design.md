# Database Design

PostgreSQL schema มาจาก migration 001–005 และทุก migration รันซ้ำได้

## Core tables

- `users`, `user_settings`
- `households` มี `archived_at`/`archived_by` สำหรับถังขยะที่กู้คืนได้ และ `household_members` เก็บสิทธิ์สมาชิก
- `pets` ใช้ `archived_at` สำหรับ soft archive
- `routines` เก็บ canonical schedule JSON v2 ใน `schedule_value` และยังอ่าน legacy ได้
- `care_tasks` เก็บ occurrence จริง พร้อม `assigned_user_id`, `original_scheduled_at`, `mutation_version`, `mutation_reason`, `skip_reason`

## Product refinement tables (migration 004)

- `activity_logs`: immutable actor/scope/action/entity, sanitized `before_data`/`after_data`, metadata, entity version, Undo window/link
- `care_entries`: บันทึกการดูแลนอกตาราง มี creator และ soft archive
- `pet_health_records`: weight/vaccination/medication/appointment/observation/other แบบข้อความ/ตัวเลข มี creator และ soft archive
- `idempotency_records`: unique ตาม user + operation + request key พร้อม fingerprint/response

## Household trash (migration 005)

การย้ายบ้านลงถังขยะอัปเดต `households.archived_at` และ `archived_by` โดยไม่ลบ row ลูก จึงรักษาสัตว์ กิจวัตร งาน ประวัติ สมาชิก และ Activity ทั้งหมดไว้ การกู้คืนล้างสองค่านี้ใน transaction และทั้ง archive/restore เขียน Activity Log

## Integrity

ใช้ UUID primary key, foreign key, CHECK constraint สำหรับชนิดข้อมูล, partial index สำหรับ active rows และ unique occurrence ต่อ routine+scheduled time การ mutation และ Activity ที่เกี่ยวข้องต้อง commit/rollback ใน transaction เดียวกัน

ข้อมูล archived ไม่แสดงใน active list แต่ยังถูกอ้างถึงใน Timeline/Activity ไม่มี binary/file column สำหรับ health record

PostgreSQL ไม่ publish host port ใน Compose ปกติและรับการเชื่อมต่อจาก web ผ่าน private network `db:5432` เท่านั้น สำหรับ development/test/DBeaver ให้เปิด `docker-compose.dev.yml` ซึ่ง bind ที่ `127.0.0.1:55430` โดยไม่เปิดรับจากเครือข่ายภายนอก

## Runtime connection modes

- Production-like Docker: web ใช้ `postgres://pawroutine:...@db:5432/pawroutine`; host เชื่อมต่อฐานข้อมูลโดยตรงไม่ได้
- Local development: `.env` ใช้ `127.0.0.1:55430` และต้องเริ่ม db ผ่าน `docker-compose.dev.yml`
- Test/E2E: สร้าง schema แยกสำหรับแต่ละรอบและลบเฉพาะ schema นั้นหลังจบ

ข้อมูลถาวรอยู่ใน named volume `pawroutine_pawroutine-postgres`; การ recreate หรือ restart container ไม่ลบข้อมูล
