> เอกสารแผน/การออกแบบย้อนหลัง ไม่ใช่คู่มือติดตั้งหรือสถานะล่าสุด อ่าน [README](../../../README.md), [Requirements](../../requirements.md) และ [Project Status](../../project-status.md) ประกอบ

# Phase 8 Change Detection & Wellness Alerts — Implementation Plan

สถานะ: เสร็จสิ้นและ deploy แล้ว 11 ตุลาคม 2026

## ขอบเขต

1. เพิ่ม Detection Engine แบบ deterministic แยกสัตว์และ metric โดยใช้ baseline 14 วันก่อนหน้าและ observation 3 วันปฏิทินต่อเนื่อง
2. อาหาร น้ำ กิจกรรม และการนอนแจ้งเมื่อค่าขยับจาก mode อย่างน้อยหนึ่งระดับในทิศทางเดียวกันครบ 3 วัน
3. ขับถ่ายและอารมณ์แจ้งเมื่อพบค่าชนิดใหม่ค่าเดียวกันครบ 3 วัน; น้ำหนักแจ้งเมื่อเบี่ยงจาก median อย่างน้อย 10% ในทิศทางเดียวกันครบ 3 วัน
4. วันขาดข้อมูลจะตัดความต่อเนื่องและไม่ถูกเติมค่า; ความเปลี่ยนแปลงวันเดียวไม่สร้าง Alert
5. Alert เก็บ baseline, ค่าที่พบ, ช่วงเวลา, rule, source dates/log ids และ lifecycle `new → acknowledged → monitoring → resolved`
6. ระบบปิด Alert เป็น `resolved` เมื่อกลับเข้า baseline ต่อเนื่อง 2 วัน หรือเมื่อข้อมูลต้นทางของ Alert ถูกแก้/archive จนหลักฐานเดิมไม่ครบ
7. การสร้าง/อัปเดต/ปิด Alert ทำใน transaction เดียวกับ Daily Wellness mutation และเขียน Activity แบบ sanitized

## แบบข้อมูลและ API

- Migration `008_wellness_alerts.sql` เพิ่ม `wellness_alerts` พร้อม partial unique index สำหรับ active alert ต่อ pet+metric+rule
- `GET /pets/:id/wellness-alerts?status=active|resolved|all&limit=...`
- `POST /wellness-alerts/:id/acknowledge`
- `POST /wellness-alerts/:id/monitor`
- สมาชิกบ้านอ่าน/รับทราบ/เริ่มติดตามได้; บ้านหรือสัตว์ที่ archive เข้าถึงไม่ได้

## UI

- แสดง “พบการเปลี่ยนแปลง” เหนือ Learning Mode พร้อมจำนวน Alert ที่กำลังติดตาม
- การ์ดระบุ metric, สถานะ, baseline, ค่าที่พบ, ช่วงวันที่ และกฎที่ทำงาน โดยไม่วินิจฉัยโรค
- ใช้ข้อความร่วมกับสี, ปุ่มอย่างน้อย 44px, loading/error/empty state และรายละเอียดหลักฐานแบบ `<details>`
- ตัวกรอง active/resolved/all และ responsive ที่ 375px โดยไม่ล้นแนวนอน

## การทดสอบ

- Unit: one-day/no alert, missing-day break, three-day categorical/weight rules, direction และ two-day resolution
- API: migration rerunnable, duplicate prevention, lifecycle permissions, Activity/Timeline, edit/archive invalidation และ trash isolation
- Regression/E2E: baseline 14 วัน → deviation 3 วัน → Alert → acknowledge/monitor พร้อม mobile 375px
- Gate: `npm test`, `npm run build`, `npm run test:e2e`, Docker migration/deploy, health และ production read-only smoke

## นอกขอบเขต

Wellness Dashboard/กราฟ, notification/reminder, shared assignee workflow, Vet Report และ AI อยู่ Phase 9–11

## ผลยืนยัน

- `npm test`: 55/55 ผ่าน
- `npm run build`: ผ่าน
- `npm run test:e2e`: 3 ผ่าน และ 3 ข้ามตาม project guard
- Production Docker: migration 008 สำเร็จ, health `ok/ok`, PostgreSQL ไม่เปิด host port และข้อมูลเดิมครบ
