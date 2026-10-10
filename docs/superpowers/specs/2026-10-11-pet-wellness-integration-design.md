# PawRoutine Pet Wellness Integration Design

สถานะ: Product design ที่ผู้ใช้อนุมัติเมื่อ 11 ตุลาคม 2026; ยังไม่ได้ implement ฟีเจอร์ใน Phase 5–11

## เป้าหมาย

รวมระบบจัดกิจวัตรและช่วยกันดูแลของ PawRoutine กับแนวคิด Pet Wellness Intelligence ให้เป็นผลิตภัณฑ์เดียว ผู้ใช้ต้องจัดงานดูแลร่วมกันได้เหมือนเดิม พร้อมเก็บข้อมูลสุขภาวะรายวัน เรียนรู้ค่าปกติเฉพาะสัตว์แต่ละตัว และแจ้งว่า “พบการเปลี่ยนแปลง” โดยไม่วินิจฉัยโรคหรือคำนวณยา

## หลักการออกแบบ

- รักษาฟีเจอร์ปัจจุบันทั้งหมด ได้แก่ Household, Today, Routine, Quick Add, Calendar, History, Health Record, Timeline, Activity Log และ Trash/Restore
- ใช้แนวทาง Wellness-first: ข้อมูลที่มีโครงสร้าง → Baseline → Rule-based Detection → Dashboard/Report → AI
- วันที่ไม่มีข้อมูลหมายถึง “ไม่มีข้อมูล” ไม่ใช่ค่า 0 และช่อง Daily Wellness ไม่บังคับกรอกครบ
- Baseline และ Alert ต้องแยกตามสัตว์และประเภทข้อมูล ตรวจย้อนกลับถึงข้อมูลต้นทางได้ และคำนวณซ้ำจากข้อมูลเดิมแล้วได้ผลเดิม
- ข้อความต้องสื่อว่าเป็นการเปลี่ยนแปลงจากพฤติกรรมปกติ ไม่ใช่คำวินิจฉัย
- ทุก mutation ใหม่ต้องมีสิทธิ์ตาม household, soft archive เมื่อเหมาะสม และ Activity Log แบบ sanitized ใน transaction เดียวกัน
- รุ่นหลักยังไม่รองรับไฟล์/รูป, email/push, การวินิจฉัย, dose calculation หรือ Behavior Coach

## ข้อมูลที่ยังขาด

1. โปรไฟล์: สายพันธุ์ เพศ สถานะทำหมัน และน้ำหนักตั้งต้น
2. Health Passport: แพ้ยา โรคประจำตัว ยาประจำ วัคซีน และวันนัดครั้งถัดไป
3. Daily Wellness: อาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก และข้อสังเกต พร้อมวันย้อนหลัง
4. Intelligence: Learning Mode 14 วัน, baseline ราย metric, rule-based detection และ alert lifecycle
5. Presentation: กราฟแนวโน้ม ช่วงค่าปกติ สถานะ Wellness และหลักฐานของ Alert
6. Operational use: แจ้งเตือนสุขภาพตามวัน, shared alert follow-up และรายงานสำหรับสัตวแพทย์

## Phase 5 — Pet & Wellness Data Foundation

ขยายโปรไฟล์สัตว์และ Health Passport แบบข้อความ/ตัวเลข เพิ่มข้อมูลแพ้ยา โรคประจำตัว ยาประจำ วัคซีน วันที่เริ่ม/สิ้นสุด และวันนัดครั้งถัดไป โดยข้อมูลเดิมต้องยังอ่านได้ ไม่มีไฟล์แนบ และทุกการเปลี่ยนแปลงต้องมี Activity Log

## Phase 6 — Daily Wellness Log & Quick Check-in

เพิ่ม Quick Check-in แบบเลือกกรอกสำหรับอาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก และข้อสังเกต รองรับการกรอกย้อนหลัง หลายบันทึกต่อวัน ผู้บันทึก การแก้ไข และ soft archive รายการต้องปรากฏใน Pet Timeline โดยช่องว่างห้ามถูกตีความเป็นศูนย์

## Phase 7 — Personal Baseline & Learning Mode

สร้าง baseline รายสัตว์/ราย metric จากหน้าต่างข้อมูลย้อนหลัง 14 วัน แสดงจำนวนวันที่เก็บแล้ว วันที่เหลือ และความพร้อมของแต่ละ metric หากจำนวนตัวอย่างไม่พอต้องแสดง “ข้อมูลยังไม่เพียงพอ” การแก้ข้อมูลย้อนหลังต้องทำให้ baseline คำนวณใหม่ได้อย่าง deterministic

## Phase 8 — Change Detection & Wellness Alerts

เทียบข้อมูลล่าสุดกับ baseline ด้วยกฎแบบเปอร์เซ็นต์/จำนวนวันต่อเนื่อง รองรับสถานะใหม่ รับทราบ กำลังติดตาม และกลับสู่ปกติ Alert ต้องแสดง metric, ค่าปกติ, ค่าที่พบ, ช่วงเวลา และกฎที่ทำงาน พร้อมคำแนะนำให้ติดตามหรือปรึกษาสัตวแพทย์โดยไม่ระบุโรค

## Phase 9 — Wellness Dashboard

เพิ่มแท็บ Wellness ใน Pet Workspace แสดง Learning, Stable, Changes Detected หรือ Insufficient Data พร้อมกราฟ 7/14/30/90 วัน ช่วง baseline การ์ดสรุปราย metric และ Alert ที่กำลังติดตาม กราฟต้องไม่เชื่อมวันที่ไม่มีข้อมูลเป็นค่าที่สร้างขึ้น

โครงแท็บเป้าหมาย: ภาพรวม → กิจวัตร → Wellness → Health Passport → Timeline

## Phase 10 — Reminders, Shared Monitoring & Vet Report

เพิ่มการเตือนวัคซีน/นัดหมายตามวันจริง การแจ้ง Alert แก่สมาชิก การมอบหมายผู้ติดตาม และการอัปเดตสถานะร่วมกันโดยอัตโนมัติ เพิ่มรายงานตามช่วงวันที่สำหรับพิมพ์/PDF ซึ่งรวมข้อมูลสัตว์ แพ้ยา โรค ยา วัคซีน น้ำหนัก Daily Wellness, Alert และ Timeline รายงานต้องเป็นข้อเท็จจริงและใช้งานได้โดยไม่พึ่ง AI

## Phase 11 — AI Insight Layer (Optional)

ทำเมื่อ Phase 5–10 เสถียรและมีเวลาเท่านั้น AI ตอบคำถามจากข้อมูลและผลคำนวณที่ระบบเตรียมให้ ต้องแสดงช่วงวันที่/หลักฐาน ไม่สร้างตัวเลขเอง ไม่วินิจฉัยหรือคำนวณยา เก็บ log คำถาม/คำตอบ และ fallback ไปยัง Rule-based result ได้เสมอ ระบบ Wellness และ Vet Report ต้องทำงานครบเมื่อปิด AI

## ขอบเขตส่วนประกอบและการไหลของข้อมูล

- Pet Profile และ Health Passport เป็นข้อมูลอ้างอิงระยะยาวของสัตว์
- Daily Wellness Log รับข้อมูลตามเวลาและเป็นแหล่งข้อมูลเดียวสำหรับ baseline เชิงพฤติกรรม
- Baseline Engine อ่านข้อมูลย้อนหลังโดยไม่แก้บันทึกต้นทาง และให้ผลแยกตาม pet+metric
- Detection Engine อ่านค่าล่าสุดกับ baseline แล้วสร้าง/อัปเดต Alert พร้อมหลักฐานของกฎ
- Wellness Dashboard อ่าน Daily Log, baseline และ Alert เพื่อแสดงผลเท่านั้น
- Vet Report รวมข้อมูลที่เลือกตามช่วงวันที่และต้องสร้างได้โดยไม่เรียก AI
- AI Phase 11 รับเฉพาะ context ที่ผ่านการ query และผลคำนวณจากระบบ ไม่อ่านข้อมูลข้าม household และไม่เขียนบันทึกสำคัญโดยไม่มีผู้ใช้ยืนยัน

## สถานะผิดพลาดและข้อมูลไม่ครบ

- ข้อมูลไม่ถึงเกณฑ์ต้องตอบ `Insufficient Data` และไม่สร้าง Alert
- วันที่หรือหน่วยไม่ถูกต้องต้องปฏิเสธพร้อมข้อความระดับช่องกรอก
- การคำนวณใหม่ล้มเหลวต้องรักษา Daily Log ต้นทางและแสดงสถานะคำนวณไม่สำเร็จ ห้ามใช้ผลบางส่วนเป็น Alert
- ผู้ใช้ไม่มีสิทธิ์หรือบ้านอยู่ในถังขยะต้องเข้าถึง Daily Wellness, baseline, Alert, Dashboard และ Report ไม่ได้
- AI ล้มเหลวต้องแสดง Rule-based result เดิมและให้ผู้ใช้ใช้ฟอร์มปกติได้

## กลยุทธ์การทดสอบ

- Unit: normalization/validation ของแต่ละ metric, 14-day window, missing data, baseline และกฎต่อเนื่อง
- API: household isolation, role permissions, archive behavior, Activity Log และ deterministic recomputation
- Integration: Daily Log → baseline → detection → alert lifecycle → Dashboard/Report
- E2E: กรอกข้อมูลปกติย้อนหลัง 14 วัน ตามด้วยข้อมูลเบี่ยงวันที่ 15–18 แล้วตรวจ Alert/กราฟ/หลักฐาน
- Regression: Today, Routine, Quick Add, Timeline, Trash/Restore และข้อมูลเดิมต้องทำงานเหมือนก่อนเพิ่ม Wellness

## เกณฑ์ความสำเร็จหลัก

- ใส่ข้อมูลปกติย้อนหลัง 14 วัน แล้วใส่ค่าที่เบี่ยงตามกฎต่อเนื่องในวันที่ 15–18 ต้องสร้าง Alert ซ้ำได้อย่าง deterministic
- ค่าผิดปกติเพียงวันเดียวที่ยังไม่ครบเงื่อนไขต้องไม่แจ้งเตือน
- สัตว์คนละตัวต้องไม่มี baseline หรือ alert ปะปนกัน
- ผู้ใช้เห็นเหตุผลและข้อมูลต้นทางของทุก Alert
- สมาชิกบ้านอื่นเห็นสถานะล่าสุดและการรับผิดชอบติดตาม โดยข้อมูลไม่รั่วข้าม household
- ทุกหน้าต้องคงแนวทาง Thai-first, responsive และ accessible ของ PawRoutine

## ลำดับและข้อกำหนดก่อนเริ่ม

แต่ละ Phase ต้องมี design/implementation plan และ test gate ของตนเอง เริ่ม Phase ถัดไปหลัง Phase ก่อนหน้าผ่าน unit/API/E2E และเอกสารอัปเดตแล้วเท่านั้น Phase 11 ห้ามเริ่มก่อน Rule-based Wellness ทำงานได้ครบโดยไม่พึ่ง AI
