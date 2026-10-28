> เอกสารแผน/การออกแบบย้อนหลัง ไม่ใช่คู่มือติดตั้งหรือสถานะล่าสุด อ่าน [README](../../../README.md), [Requirements](../../requirements.md) และ [Project Status](../../project-status.md) ประกอบ

# Phase 6 Daily Wellness Log & Quick Check-in — Implementation Plan

สถานะ: เสร็จสมบูรณ์และผ่าน production verification — 11 ตุลาคม 2026

## ขอบเขต

1. เพิ่ม Daily Wellness Log รายสัตว์ โดยเลือกกรอกอาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก และข้อสังเกตได้
2. ช่องที่ไม่กรอกเก็บเป็น `NULL` เสมอและไม่ถูกแปลงเป็นศูนย์; ต้องมีอย่างน้อยหนึ่ง metric หรือหมายเหตุจึงบันทึกได้
3. รองรับวัน/เวลาย้อนหลัง หลายบันทึกต่อวัน และแสดงผู้บันทึกตามเวลา `Asia/Bangkok`
4. สมาชิกบ้านสร้างและอ่านได้; ผู้สร้างหรือ Owner แก้ไข/soft archive ได้; บ้านหรือสัตว์ที่ archive เข้าถึงไม่ได้
5. ทุก mutation เขียน Activity Log แบบ allowlist ใน transaction เดียวกัน และรายการทั้ง active/archived ปรากฏใน Pet Timeline
6. เพิ่ม Quick Check-in ใน Quick Add และแท็บ “เช็กอินรายวัน” ใน Pet Workspace พร้อมรายการ แก้ไข และเก็บข้อมูลเก่า
7. ฟอร์มมี label/helper text ชัดเจน, loading/error feedback, ปุ่มสัมผัสอย่างน้อย 44px และ responsive ที่ 375px

## แบบข้อมูล

- Migration `007_daily_wellness_log.sql`
- ตาราง `pet_wellness_logs`: `pet_id`, `recorded_at`, metric แบบ nullable, `weight_kg`, `notes`, `created_by`, timestamps และ `archived_at`
- metric เชิงสัมพัทธ์ใช้อ enum ที่แยก “ไม่ได้กรอก” (`NULL`) ออกจากค่าที่ผู้ใช้เลือกอย่างชัดเจน
- น้ำหนักต้องมากกว่า 0 และข้อความมีขีดจำกัดความยาว
- index สำหรับรายการ active ตามสัตว์/เวลาและ Timeline

## API และบริการ

- `GET|POST /pets/:id/wellness-logs`
- `PATCH /wellness-logs/:id`
- `POST /wellness-logs/:id/archive`
- GET รองรับ `from`, `to`, `limit`; validation ใช้วันที่ Bangkok และช่วงไม่เกิน 366 วัน
- Service แยก validation, permission, transaction และ response shape ออกจาก catch-all route
- Activity entity `wellness_log`; Timeline source `wellness_log`; household Activity รองรับ pet filter

## UI

- Quick Add เพิ่ม “เช็กอินสุขภาพวันนี้” และเปิดฟอร์มแบบ progressive disclosure
- Pet Workspace เพิ่มแท็บ “เช็กอินรายวัน” พร้อม empty/loading/error state
- ใช้ native `select`, `datetime-local`, `number`, `textarea`; ทุกช่อง optional แต่ฟอร์มตรวจว่ามีข้อมูลอย่างน้อยหนึ่งค่า
- ค่าที่ไม่ได้บันทึกไม่แสดงเป็น “0” และไม่สร้างข้อความสรุปแทน
- รายการแสดงเฉพาะ metric ที่มีข้อมูล พร้อมชื่อผู้บันทึกและเวลาจริง

## การทดสอบ

- Migration รันซ้ำได้และ constraint ปฏิเสธค่าผิดรูปแบบ
- API ครอบคลุม partial input, empty input, หลายรายการต่อวัน, backfill, date filters, creator/Owner/reader/outsider, archive, Activity, Timeline และ trash isolation
- Regression ทุก migration fixture ใช้ migration 007
- Static/UI และ Playwright ครอบคลุม Quick Add, Pet Workspace, edit/archive และ viewport 375px
- Gate: `npm test`, `npm run build`, `npm run test:e2e`, Docker migration/deploy, health และ production smoke

## นอกขอบเขต

Baseline 14 วัน, Learning Mode, change detection, Alert, Wellness Dashboard, reminders, Vet Report, AI, upload และ push/email อยู่ Phase 7–11 หรือ deferred

## ผลส่งมอบ

- `npm test`: 45/45 ผ่าน
- `npm run build`: ผ่าน
- `npm run test:e2e`: 2 passed, 2 project skips
- Docker deploy ที่ `http://localhost:3000`: health `ok/ok`, migration 007 ครบ และ authenticated read-only smoke 19 เส้นทางตอบ 200
- ข้อมูลเดิมหลัง migration ยังอยู่: ผู้ใช้ 5, บ้าน 5, สัตว์ 6; PostgreSQL ไม่เปิด host port
