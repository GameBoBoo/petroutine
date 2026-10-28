> เอกสารแผน/การออกแบบย้อนหลัง ไม่ใช่คู่มือติดตั้งหรือสถานะล่าสุด อ่าน [README](../../../README.md), [Requirements](../../requirements.md) และ [Project Status](../../project-status.md) ประกอบ

# Phase 7 Personal Baseline & Learning Mode — Implementation Plan

สถานะ: เสร็จสมบูรณ์และผ่าน production verification — 11 ตุลาคม 2026

## ขอบเขต

1. เพิ่ม Baseline Engine แบบ deterministic รายสัตว์และราย metric สำหรับอาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ และน้ำหนัก
2. ใช้หน้าต่าง 14 วันตามปฏิทิน `Asia/Bangkok` สิ้นสุดที่ `as_of`; ค่าเริ่มต้นคือวันปัจจุบัน
3. หนึ่ง metric นับได้สูงสุดหนึ่งตัวอย่างต่อวัน โดยใช้ค่าล่าสุดที่ไม่เป็น `NULL` ของวันนั้น จึงไม่ให้หลายเช็กอินในวันเดียวเร่ง Learning Mode
4. metric พร้อมเมื่อมีข้อมูลครบ 14 วัน; ก่อนครบต้องตอบ `learning` หรือ `insufficient_data` และไม่มี baseline ที่คาดเดา
5. categorical metric ใช้ mode แบบลำดับ tie-break คงที่; น้ำหนักใช้ median พร้อมค่าเฉลี่ย ต่ำสุด และสูงสุด โดยคำนวณเฉพาะเมื่อพร้อม
6. ผลตอบกลับมีวันต้นทางและ log id ที่ใช้ เพื่อให้ตรวจย้อนกลับและคำนวณซ้ำจากข้อมูลเดียวกันได้
7. Baseline เป็น derived read model ไม่สร้างตาราง snapshot จึงเปลี่ยนทันทีเมื่อ Daily Wellness ถูกสร้าง แก้ไข หรือ archive และไม่มี state ค้าง

## API และสิทธิ์

- `GET /pets/:id/wellness-baseline?as_of=YYYY-MM-DD`
- สมาชิกบ้านอ่านได้เฉพาะสัตว์ active ในบ้าน active
- `as_of` ต้องเป็นวันที่ถูกต้องและไม่อยู่ในอนาคตตาม `Asia/Bangkok`
- ไม่มี mutation และไม่มี Alert/diagnosis ใน Phase นี้

## UI

- เพิ่มส่วน “Learning Mode 14 วัน” เหนือรายการเช็กอินในแท็บ “เช็กอินรายวัน”
- แสดงสถานะรวมด้วยข้อความและ badge ไม่ใช้สีอย่างเดียว
- แสดง progress `เก็บแล้ว X/14 วัน` และ `เหลือ Y วัน` แยกราย metric ด้วย native `<progress>` ที่มี accessible label
- เมื่อพร้อม แสดงค่าปกติที่คำนวณได้และช่วงวันที่ต้นทาง; เมื่อยังไม่พร้อมใช้ข้อความ “ข้อมูลยังไม่เพียงพอ”
- loading/error/empty state มีทาง retry และ layout ต้องไม่ล้นที่ viewport 375px

## การทดสอบ

- Unit: 14-day boundary, missing data, latest non-null per day, stable tie-break, median และ deterministic output
- API: member/outsider/trash isolation, invalid/future `as_of`, metric isolation, multiple logs per day, edit/archive recomputation และ source traceability
- Static/E2E: Learning Mode, accessible progress, 1/14 หลัง Quick Check-in และ mobile 375px
- Gate: `npm test`, `npm run build`, `npm run test:e2e`, Docker deploy, health และ production read-only smoke

## นอกขอบเขต

Change Detection, Alert lifecycle, Wellness Dashboard/กราฟ, reminders, Vet Report และ AI อยู่ Phase 8–11

## ผลส่งมอบ

- `npm test`: 49/49 ผ่าน
- `npm run build`: ผ่าน
- `npm run test:e2e`: 2 passed, 2 project skips
- Docker deploy ที่ `http://localhost:3000`: health `ok/ok`, Baseline API ตอบ 200 พร้อม 7 metrics และไม่พบ 500 ใน log
- ข้อมูลเดิมยังอยู่: ผู้ใช้ 5, บ้าน 5, สัตว์ 6; PostgreSQL ไม่เปิด host port
