> เอกสารแผน/การออกแบบย้อนหลัง ไม่ใช่คู่มือติดตั้งหรือสถานะล่าสุด อ่าน [README](../../../README.md), [Requirements](../../requirements.md) และ [Project Status](../../project-status.md) ประกอบ

# Phase 9 Wellness Dashboard — Implementation Plan

สถานะ: เสร็จและ deploy แล้ว 12 ตุลาคม 2026 — `npm test` 60/60, production build ผ่าน, Playwright 4 passed/2 skipped, Docker health `ok/ok`, ไม่มี 500 และข้อมูลเดิมครบ

## ขอบเขต

1. เพิ่ม read-only derived dashboard ต่อสัตว์จาก Daily Wellness, baseline ปัจจุบัน และ active alerts โดยไม่เพิ่ม snapshot table
2. รองรับช่วงแนวโน้ม 7, 14, 30 และ 90 วันตาม `Asia/Bangkok`; วันที่ไม่มีข้อมูลต้องคงเป็นช่องว่างและห้ามลากเส้นเชื่อมข้ามวัน
3. สถานะรวมมี `learning`, `stable`, `changes_detected` และ `insufficient_data` โดย active alert มีลำดับความสำคัญสูงสุด
4. การ์ดราย metric แสดงค่าล่าสุด ความพร้อม baseline ช่วง baseline และแนวโน้ม โดย categorical ใช้ลำดับที่ประกาศไว้และน้ำหนักใช้ค่าจริงหน่วยกิโลกรัม
5. แสดง active alerts ที่กำลังติดตามและทางลัดไปยังเช็กอิน/หลักฐานเดิมของ Phase 8

## API และการคำนวณ

- `GET /pets/:id/wellness-dashboard?range=7|14|30|90&as_of=YYYY-MM-DD`
- Pure aggregation ที่ `lib/wellness-dashboard.js`
- Service ตรวจ membership, archived household/pet, validation และดึงข้อมูลเท่าที่จำเป็นสูงสุด 90 วัน
- Response คืน status, coverage, baseline readiness, metric points, baseline band, latest value และ active alerts

## UI

- เพิ่มแท็บ `Wellness` ใน Pet Workspace โดยยังคงแท็บ `เช็กอินรายวัน` สำหรับการกรอกและจัดการข้อมูล
- ใช้ line chart สำหรับแนวโน้ม มี legend, หน่วย, baseline band, missing-day gaps, text summary และตารางข้อมูลทางเลือก
- สถานะใช้ข้อความและรูปแบบร่วมกับสี, controls อย่างน้อย 44px, loading/error/empty states และ responsive 375px
- ไม่มี diagnosis, score สุขภาพแบบแต่งขึ้น หรือการแทนค่าข้อมูลที่หายไป

## การทดสอบ

- Unit: range boundary, same-day latest value, missing-day gaps, categorical/numeric scale และ overall status
- API: validation, household isolation, archived isolation, 7/14/30/90 ranges, active alerts และ deterministic response
- Static/E2E: tab, range controls, chart/table accessibility, alert shortcut และ mobile overflow
- Gate: `npm test`, `npm run build`, `npm run test:e2e`, Docker deploy, health/log smoke และรักษาข้อมูลเดิม

## นอกขอบเขต

Reminders, shared alert assignment, Vet Report/PDF และ AI อยู่ Phase 10–11
