# Database Design

Migration 012 ขยาย `ai_insight_requests.intent` ให้รองรับ `chat_question` โดยใช้ตาราง audit metadata เดิม ไม่เพิ่มตารางข้อความแชตหรือเก็บ prompt/response
Migration 013 เพิ่ม `household_members.ai_consent_at` เพื่อจำความยินยอมของสมาชิกแยกตามบ้าน; ค่า `NULL` หมายถึงยังไม่ยินยอมหรือถอนแล้ว
Migration 014 เพิ่ม `ai_insight_requests.household_id` และอนุญาต `pet_id=NULL` สำหรับคำถามรวมทุกตัวในบ้าน โดยยังเก็บเฉพาะ metadata ไม่เก็บข้อความคำถามและคำตอบ

PostgreSQL schema มาจาก migration 001–010 และทุก migration รันซ้ำได้

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

## Pet & Wellness foundation (migration 006)

- `pets` เพิ่ม `breed`, `sex`, `neuter_status`, `baseline_weight_kg` และ `baseline_weight_recorded_on` แบบ optional เพื่อให้ข้อมูลเดิมยังอ่านได้
- `pet_passport_entries` เก็บ allergy/condition/medication/vaccination/appointment พร้อมข้อความ ตัวเลข/หน่วย วันที่เริ่ม/สิ้นสุด/ครั้งถัดไป ผู้สร้าง และ soft archive
- Passport แยกจาก `pet_health_records`: Passport เป็นข้อมูลอ้างอิงระยะยาว ส่วน Health Record เป็นเหตุการณ์สุขภาพตามเวลา

## Daily Wellness Log (migration 007)

- `pet_wellness_logs` เก็บเวลาที่บันทึก อาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก หมายเหตุ ผู้สร้าง และ `archived_at`
- ทุก metric เป็น nullable เพื่อแยก “ไม่ได้บันทึก” ออกจากค่าที่ผู้ใช้เลือก และแต่ละรายการต้องมีข้อมูลอย่างน้อยหนึ่งช่อง
- รองรับหลายรายการต่อสัตว์ต่อวัน พร้อม partial index สำหรับ active list และ Timeline ตามเวลา

## Personal Baseline (Phase 7)

Baseline เป็น derived read model จาก `pet_wellness_logs` active ในหน้าต่าง 14 วัน จึงไม่เพิ่ม migration หรือตาราง snapshot ที่เสี่ยงค้าง เมื่อสร้าง แก้ หรือ archive ข้อมูลย้อนหลัง API จะคำนวณผลใหม่จากต้นทางทันที หนึ่ง metric ใช้ค่าล่าสุดที่ไม่เป็น `NULL` ต่อวัน พร้อมคืนวันที่และ log id ที่ใช้คำนวณ

## Wellness Alerts (migration 008)

`wellness_alerts` เก็บ alert ราย pet+metric พร้อม rule/direction, lifecycle `new|acknowledged|monitoring|resolved`, baseline และ observation windows, ค่า JSONB, หลักฐาน และ `source_log_ids` มี partial unique index ป้องกัน active alert ซ้ำใน pet+metric+rule เดียวกัน และ foreign keys สำหรับผู้รับทราบ/ผู้เริ่มติดตาม

## Wellness Dashboard (Phase 9)

Dashboard เป็น read-only derived read model จาก `pet_wellness_logs` active, Baseline Engine และ `wellness_alerts` active จึงไม่มี migration หรือตาราง snapshot ใหม่ API query เฉพาะช่วงที่จำเป็นสูงสุด 90 วัน และคงวันที่ไม่มีข้อมูลเป็นช่องว่าง

## Reminders และ Shared Monitoring (migration 009)

- `user_settings.health_reminder_days` เก็บระยะเตือนสุขภาพล่วงหน้า 7/14/30/60/90 วัน โดยค่าเดิมของผู้ใช้ยังใช้ได้
- `wellness_alerts` เพิ่ม `assigned_to`, `follow_up_due_date` และ `follow_up_note`; ผู้ติดตามต้องเป็นสมาชิกบ้านและอ้างอิงผู้ใช้ด้วย foreign key
- Reminders และ Vet Report เป็น derived read model จาก task, Passport, Wellness, Alert และ Timeline จึงไม่เก็บ notification/report snapshot และไม่เพิ่ม binary PDF column

## Notification dismissal (migration 010)

`notification_dismissals` เก็บ `user_id + household_id + notification_key` เพื่อซ่อนแจ้งเตือนเฉพาะผู้ใช้โดยไม่แก้หรือลบข้อมูล task, Passport หรือ Alert ต้นทาง คีย์รวมวัน/เวลาของกำหนดเพื่อให้รายการกลับมาได้เมื่อกำหนดต้นทางเปลี่ยน

## Integrity

ใช้ UUID primary key, foreign key, CHECK constraint สำหรับชนิดข้อมูล, partial index สำหรับ active rows และ unique occurrence ต่อ routine+scheduled time การ mutation และ Activity ที่เกี่ยวข้องต้อง commit/rollback ใน transaction เดียวกัน

ข้อมูล archived ไม่แสดงใน active list แต่ยังถูกอ้างถึงใน Timeline/Activity ไม่มี binary/file column สำหรับ health record

PostgreSQL ไม่ publish host port ใน Compose ปกติและรับการเชื่อมต่อจาก web ผ่าน private network `db:5432` เท่านั้น สำหรับ development/test/DBeaver ให้เปิด `docker-compose.dev.yml` ซึ่ง bind ที่ `127.0.0.1:55430` โดยไม่เปิดรับจากเครือข่ายภายนอก

## Runtime connection modes

- Production-like Docker: web ใช้ `postgres://pawroutine:...@db:5432/pawroutine`; host เชื่อมต่อฐานข้อมูลโดยตรงไม่ได้
- Local development: `.env` ใช้ `127.0.0.1:55430` และต้องเริ่ม db ผ่าน `docker-compose.dev.yml`
- Test/E2E: สร้าง schema แยกสำหรับแต่ละรอบและลบเฉพาะ schema นั้นหลังจบ

ข้อมูลถาวรอยู่ใน named volume `pawroutine_pawroutine-postgres`; การ recreate หรือ restart container ไม่ลบข้อมูล
