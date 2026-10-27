# Phase 10 Reminders, Shared Monitoring & Vet Report — Implementation Plan

สถานะ: เสร็จและ deploy แล้ว 12 ตุลาคม 2026

## ขอบเขต

1. เพิ่ม reminder ในเว็บจาก `next_due_date` ของวัคซีน/นัดหมาย และวันติดตาม Wellness Alert โดยใช้วันตาม `Asia/Bangkok`; ไม่ส่ง email หรือ push
2. เพิ่มค่าตั้งจำนวนวันเตือนสุขภาพล่วงหน้า 7/14/30/60/90 วัน โดยเคารพการเปิด/ปิด notifications เดิม
3. เพิ่ม shared monitoring ให้ Alert ระบุผู้ติดตาม วันติดตาม และหมายเหตุได้ สมาชิกบ้านทุกคนอ่าน/อัปเดตได้ พร้อม membership validation, row lock และ Activity Log
4. เพิ่ม Vet Report แบบ read-only ต่อสัตว์และช่วงวันที่ไม่เกิน 366 วัน รวมโปรไฟล์, Health Passport, health records, Daily Wellness, Alert และ care timeline จากข้อมูลจริง
5. เพิ่มแท็บ `รายงาน` ใน Pet Workspace พร้อมหน้าเอกสารสำหรับพิมพ์หรือ Save as PDF จาก browser โดยไม่มี AI, diagnosis หรือ dose calculation

## Database และ API

- Migration 009 เพิ่ม `user_settings.health_reminder_days` และข้อมูล follow-up บน `wellness_alerts` แบบ additive/rerunnable
- `PATCH /wellness-alerts/:id/follow-up`
- `GET /pets/:id/vet-report?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /households/:id/notifications` รวม task, passport due date และ Wellness Alert/follow-up reminder โดยทุกแถวมี `type`
- Vet Report และ reminders ตรวจ archived household/pet และ household membership ซ้ำใน query

## UI และ accessibility

- notification panel แยกข้อความงาน, กำหนดสุขภาพ และ Alert โดยใช้ข้อความร่วมกับสถานะสี
- follow-up form มี label ชัดเจน, member/date/note, loading/error/success feedback และปุ่มอย่างน้อย 44px
- Vet Report มีช่วงวันที่, loading/error/empty states, semantic tables, หัวกระดาษ/ท้ายกระดาษสำหรับงานพิมพ์ และ print CSS ที่ซ่อน app chrome
- รองรับ viewport 375px, keyboard/focus, no horizontal overflow และข้อมูลยาว wrap ได้

## การทดสอบ

- Migration rerun และ preservation
- API: reminder boundaries/status/settings, membership/trash isolation, follow-up assignment validation/Activity, report date validation/content/isolation
- Static/E2E: labels, print action, report sections, notification types, shared follow-up และ mobile overflow
- Gate: `npm test`, `npm run build`, `npm run test:e2e`, Docker deploy, health/log smoke และตรวจข้อมูลเดิม

## ผลการส่งมอบ

- `npm test`: 62/62 ผ่าน
- `npm run build`: ผ่าน; route หลัก 35.5 kB, First Load JS 138 kB
- `npm run test:e2e`: 6 passed, 2 project skips ครอบคลุม desktop/mobile, reminders, shared follow-up, Vet Report และ print media
- Docker deploy: `http://localhost:3000`, health `ok/ok`, log ไม่มี 500 และ PostgreSQL ไม่เปิด host port
- Migration 009 มี `health_reminder_days`, `assigned_to`, `follow_up_due_date`, `follow_up_note` ครบ และข้อมูลเดิมยังอยู่ (ผู้ใช้ 5, บ้าน 5, สัตว์ 6)

## นอกขอบเขต

Email/push, ไฟล์แนบ, server-generated binary PDF, e-signature และ AI/LLM อยู่ภายนอก Phase 10; ผู้ใช้ใช้คำสั่งพิมพ์ของ browser เพื่อบันทึกเป็น PDF
