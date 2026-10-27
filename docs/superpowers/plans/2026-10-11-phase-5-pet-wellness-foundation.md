# Phase 5 Pet & Wellness Data Foundation — Implementation Plan

สถานะ: เสร็จและผ่าน test gate เมื่อ 11 ตุลาคม 2026

## ขอบเขต

1. เพิ่มโปรไฟล์สัตว์แบบ optional: สายพันธุ์ เพศ สถานะทำหมัน น้ำหนักตั้งต้น และวันที่ชั่ง
2. เพิ่ม Health Passport แยกจาก Health Record เดิม รองรับ allergy, condition, medication, vaccination และ appointment
3. รองรับข้อความ ตัวเลข/หน่วย วันที่เริ่ม วันที่สิ้นสุด และกำหนดครั้งถัดไป โดยไม่มีไฟล์แนบ
4. ใช้ membership isolation; ผู้สร้างหรือ Owner แก้ไข/soft archive ได้; บ้านหรือสัตว์ที่ archived เข้าถึงไม่ได้
5. บันทึก Activity แบบ allowlist ใน transaction เดียวกันและแสดง Passport ใน Pet Timeline
6. เพิ่ม UI ภาษาไทยใน Pet Workspace พร้อม responsive 375px, label, keyboard-accessible controls และสถานะ loading/error

## การเปลี่ยนแปลง

- Migration `006_pet_wellness_foundation.sql`
- Service `passport-service.js`
- REST endpoints `/pets/{id}/passport` และ `/passport/{id}`
- Pet profile create/update API และ form
- แท็บ “สมุดสุขภาพ” และข้อมูลโปรไฟล์ใน Pet Workspace
- Activity allowlist, household activity pet filtering และ Timeline source ใหม่
- Unit/API, migration, regression และ E2E coverage

## Test gate

- `npm run db:migrate` ผ่านและ migration 006 รันซ้ำได้
- `npm test` ผ่าน 43/43
- `npm run build` ผ่าน
- `npm run test:e2e` ผ่าน 2 flows และ skip 2 ตาม project guard
- E2E desktop ยืนยันโปรไฟล์ Phase 5, Health Passport และ Timeline; mobile ยืนยัน navigation/375px ไม่มี horizontal overflow

## นอกขอบเขต

Daily Wellness, baseline, detection/alerts, dashboard, reminders, Vet Report, AI, upload และ push/email อยู่ Phase ถัดไปหรือ deferred
