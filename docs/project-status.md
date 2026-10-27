# Project Status

สถานะ delivery ล่าสุด 28 ตุลาคม 2026: เพิ่ม Jenkins/Course verification และเอกสารส่งมอบ ผลที่ตรวจจริงและ defect อยู่ใน [Course results](delivery/course-results.md) รวมถึงปัญหา test migration ที่พบจากฐานข้อมูลสะอาด ผล local ในข้อความเก่าด้านล่างไม่แทนผลรอบนี้

อัปเดต 25 ตุลาคม 2026 (AI Care Brief, สรุปส่งต่อ/ก่อนพบสัตวแพทย์ และแบบร่างบันทึกจากข้อความผ่านการทดสอบบน localhost)

## สถานะผลิตภัณฑ์

Phase 0–11 ในขอบเขตปัจจุบันทำแล้ว ยังไม่มี Phase 12 ที่อนุมัติ Auth, Household, Pets, Routines, Today, Calendar, History, Daily Wellness, Personal Baseline, Wellness Alerts, Dashboard, Shared Follow-up, Health Passport, Vet Report และ AI Chatbot ใช้งานผ่านเว็บ/API ที่ `http://localhost:3000`

Today และ Calendar แสดงงาน กำหนดสุขภาพจากสมุดสุขภาพ และวันติดตามสุขภาวะ วันติดตามกดเสร็จแล้วใน Today ได้โดยบันทึกผู้ทำและเวลา การกดเสร็จไม่ปิด Wellness Alert อัตโนมัติ Vet Report ดาวน์โหลด PDF ฝั่ง browser ไม่เปิดหน้าต่าง Print

Phase 11 มี AI Care Brief บน Today ที่ชี้ไปยัง Wellness Alert ต้นทาง กดสร้างสรุปส่งต่อคนในบ้านหรือเตรียมคุยกับสัตวแพทย์ได้ และ Quick Add เตรียมแบบร่างจากข้อความธรรมชาติให้ผู้ใช้ตรวจและยืนยันก่อนบันทึก Chatbot ยังอยู่สำหรับคำถามเฉพาะ เจ้าของบ้านเปิด AI รายบ้านใน Settings สมาชิกยินยอมครั้งเดียวต่อบ้านและถอนความยินยอมได้ ตรวจสิทธิ์ฝั่ง server เก็บ audit เฉพาะ metadata ไม่บันทึก prompt/คำตอบ และไม่ให้ AI วินิจฉัยหรือคำนวณยา Provider/model อยู่ใน `.env` ที่ Git ไม่ติดตาม บ้านใหม่ยังเริ่มโดยปิด AI

หน้า Today ไม่โหลดสถานะ/Alert ของการ์ดผู้ช่วยจนกดเปิดเครื่องมือ การเปิดไม่เรียกโมเดล; สรุปและแบบร่างเรียก AI เฉพาะเมื่อกดใช้งาน ไม่มี retry อัตโนมัติ หากบริการ AI ขัดข้อง UI แจ้งสถานะและยังบันทึกแบบปกติได้

เครื่องทดสอบนี้ตั้ง `PAWROUTINE_AI_HOURLY_LIMIT=0` เพื่อปิดโควตาคำขอต่อชั่วโมงของแอปชั่วคราว หากไม่ตั้งค่า ค่าเริ่มต้นคือ 10 คำขอต่อผู้ใช้ต่อชั่วโมง ข้อจำกัดคำถาม 500 ตัวอักษร, การยินยอม, การตรวจสิทธิ์ และโควตาของ Provider ยังมีผล

## ผลตรวจล่าสุด

- 23 ต.ค. 2026: ปรับกิจวัตรเป็นแถวกระชับ ค้นหา/กรอง/แบ่ง 10 รายการ ใช้คำว่า “ลบ” ทั่ว UI และเพิ่ม confirmation ก่อนบันทึก/เปลี่ยนสถานะสำคัญ ดู [Care experience](care-experience.md)
- E2E ก่อนเพิ่ม confirmation รอบล่าสุด: 12 ผ่าน/2 ข้าม; targeted care screens desktop/mobile 2 ผ่าน ผลนี้ไม่ครอบคลุม flow ยืนยันที่เพิ่มภายหลัง
- หลังเพิ่ม confirmation: `docker compose build web` และ `docker compose up -d web` สำเร็จ health ตอบ `{"status":"ok","database":"ok"}` ยังไม่ได้รัน unit/API/E2E ใหม่

- 20 ต.ค. 2026: `npm test` ผ่าน 68/68, Playwright E2E เต็มชุดผ่าน 10 เคสและข้าม 2 เคสตามเงื่อนไข desktop/mobile, `npm run build` ผ่าน
- ตรวจดาวน์โหลด Vet Report เป็น PDF จริงด้วย Playwright และยืนยันลายเซ็น `%PDF-`
- `npm run ai:check` ทดสอบข้อมูลสังเคราะห์กับ Gemini 3.5 Flash Lite: model และ JSON completion ตอบ HTTP 200
- `docker compose up -d --build` สำเร็จ; web และ PostgreSQL ทำงาน, `http://localhost:3000/` ตอบ HTTP 200 และ `/api/v1/health` ตอบ `{"status":"ok","database":"ok"}`
- E2E ใช้ schema ทดสอบแยกจากข้อมูลใช้งาน การทดสอบที่ผ่านไม่ใช่การรับรองทุกกรณีหรือสภาพแวดล้อม Course Container

## งานที่เหลือ

Delivery track: ประเมินคุณภาพคำตอบ AI กับข้อมูลตัวอย่างหลายกรณี, ตรวจใน Course Container, จัดการ Git remote/commit/push ตามที่ผู้ใช้กำหนด, Jenkins/registry, หลักฐานเดโม และ rollback/runbook งาน Phase 5–11 จำนวนมากยังอยู่ใน working tree และไม่ได้ commit หรือ push

Owner เปลี่ยนรหัสเชิญอายุ 7 วัน นำสมาชิกออก และโอนเจ้าของได้แล้ว (migration 016) ส่วนรูป/ข้อมูลติดต่อและการกู้คืนมี API รองรับแต่ถูกนำออกจาก UI ตามคำขอ

Deferred นอกขอบเขตปัจจุบัน: ไฟล์แนบ, email/push notifications, Behavior Coach และ server-generated PDF; ยังไม่เปิด UI รูป/กู้คืนกลับมา

## การรัน

- URL หลัก: `http://localhost:3000`; เว็บและ API ใช้ origin เดียวกัน
- Compose ปกติเปิดเฉพาะ web ที่ loopback; PostgreSQL อยู่ใน Docker network ที่ `db:5432` และเก็บข้อมูลใน named volume
- เมื่อต้องใช้ DBeaver หรือรันทดสอบจาก host ให้เปิด `docker-compose.dev.yml` เพื่อ expose ฐานข้อมูลที่ `127.0.0.1:55430` ชั่วคราว
- ห้ามใช้ `docker compose down -v` กับข้อมูลที่ต้องเก็บ
