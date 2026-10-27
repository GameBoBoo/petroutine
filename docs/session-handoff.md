# PawRoutine Session Handoff

อัปเดต 23 ตุลาคม 2026

## สถานะล่าสุด

### UX ล่าสุด 23 ตุลาคม 2026

- กิจวัตรหลักเป็นแถวกระชับ มีค้นหา/กรองสัตว์/แบ่ง 10 รายการ แท็บกิจวัตรของสัตว์ใช้ `RoutineRows` ร่วมกันและพับรายละเอียดได้
- คำว่า “เก็บข้อมูลเก่า” เปลี่ยนเป็น “ลบ” ใน UI; การลบยังเป็น soft archive รักษาประวัติ มีหน้าทบทวนก่อนลบ และลบบ้านต้องพิมพ์ชื่อ
- Root layout ครอบ `ConfirmationProvider`; ฟอร์มและการเปลี่ยนสถานะสำคัญต้องยืนยันก่อนเรียก mutation รวม Complete/Skip/Reopen/Undo, เลื่อนเวลา/มอบหมาย, สุขภาพ/ติดตาม, สมาชิก และ Settings/AI consent
- Dropdown ใช้ตัวเลือกกลางและ control ของระบบ ผู้รับผิดชอบอยู่ในฟอร์มหลัก ดู [Popup fields](popup-fields.md)
- ไม่แสดง Getting Started, Recovery Tools, รูป/ข้อมูลติดต่อ, ลิงก์แม่แบบ Quick Add และ pause toggle ใน UI; API/ข้อมูลเดิมยังอยู่
- Owner เปลี่ยนรหัสเชิญอายุ 7 วัน นำสมาชิกออก และโอนเจ้าของได้แล้ว; migration ล่าสุด 016

### หลักฐานรอบ UX

ก่อนเพิ่ม confirmation รอบล่าสุด: E2E 12 ผ่าน/2 ข้าม และ targeted care screens desktop/mobile 2 ผ่าน หลังเพิ่ม confirmation และแถวกิจวัตร: Docker production build ผ่าน อัปเดต web ที่ localhost แล้ว `/api/v1/health` ตอบ `{"status":"ok","database":"ok"}` ยังไม่ได้รัน unit/API/E2E ใหม่กับ flow ยืนยัน ไม่ใช้ผลเก่าอ้างว่าครอบคลุม UI ล่าสุด

Phase 0–11 ในขอบเขตปัจจุบันทำแล้ว ไม่มี Phase 12 ที่อนุมัติ Phase 11 ใช้ AI Chatbot แบบอ่านอย่างเดียวแทนหน้าผู้ช่วยสรุปข้อมูลแยก แชตมุมขวาล่างเลือกสัตว์เลี้ยงรายตัวหรือทุกตัวในบ้าน เลือกย้อนหลัง 7/30/365 วัน ตอบจากข้อมูลที่มีสิทธิ์เข้าถึงพร้อมลิงก์บันทึกต้นทาง เจ้าของบ้านเปิดใช้ AI รายบ้าน สมาชิกยินยอมครั้งเดียวต่อบ้านและถอนได้ใน Settings คำถาม/คำตอบไม่ถูกบันทึกใน server audit; ประวัติบนหน้าเว็บอยู่ใน client memory เท่านั้น

Today/Calendar รวมงาน กำหนดจากสมุดสุขภาพ และวันติดตาม Wellness Alert วันติดตามกดเสร็จแล้วใน Today ได้และ Calendar แสดงสถานะเสร็จโดยไม่ปิด Alert อัตโนมัติ Vet Report ดาวน์โหลด PDF ฝั่ง browser โดยตรง

## Verification ล่าสุด (20 ตุลาคม 2026)

- `npm test`: 68/68 ผ่าน
- `npm run test:e2e`: 10 ผ่าน, 2 ข้ามตามเงื่อนไขแพลตฟอร์ม; ครอบคลุม desktop/mobile, AI activation/consent, follow-up, Quick Add, Wellness Alert, reminder และ PDF download จริงพร้อมลายเซ็น `%PDF-`
- `npm run build`: ผ่าน
- `npm run ai:check`: Gemini 3.5 Flash Lite model/completion HTTP 200 และ JSON ถูกต้อง โดยใช้ข้อมูลสังเคราะห์
- `docker compose up -d --build`: ผ่าน; `localhost:3000` และ `/api/v1/health` ตอบ HTTP 200, ฐานข้อมูล `ok`
- แก้ CSS ของ Today/task list ที่ทำให้ viewport มือถือกว้างเกินและบังปุ่ม Add; E2E มือถือผ่านหลังแก้

## Environment และข้อจำกัด

Compose ปกติเปิดเว็บที่ `http://localhost:3000` เท่านั้น PostgreSQL อยู่ใน private Docker network เมื่อต้องใช้ DBeaver/dev/E2E จาก host ให้รัน `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db` เพื่อเปิด `127.0.0.1:55430` ชั่วคราว อย่าใช้ `docker compose down -v` กับข้อมูลที่ต้องเก็บ

AI key/model อยู่ใน `.env` ที่ Git ไม่ติดตาม บ้านใหม่ยังเริ่มโดยปิด AI เครื่องนี้ตั้ง `PAWROUTINE_AI_HOURLY_LIMIT=0` เพื่อทดสอบ; ค่าเริ่มต้นหากไม่ตั้งคือ 10 คำขอต่อผู้ใช้ต่อชั่วโมง ข้อจำกัด 500 ตัวอักษรต่อคำถามและโควตาของ Provider ยังมีผล ไม่เผยแพร่ API key หรืออ้างว่า AI วินิจฉัยโรค/คำนวณยาได้

## งานต่อ

1. ประเมินคุณภาพและการอ้างอิงคำตอบ AI กับชุดข้อมูลสังเคราะห์หลายกรณี
2. ตรวจใน Course Container และเตรียม demo evidence, rollback/runbook ก่อนอ้างว่าพร้อมส่งงาน
3. จัดการ Git remote/commit/push ตามคำสั่งผู้ใช้; working tree ปัจจุบันมีงาน Phase 5–11 ที่ยังไม่ได้ commit/push
4. Jenkins/registry publishing, ไฟล์แนบ, push/email และ Behavior Coach ยังไม่ทำ ส่วน invite expiry/rotation และนำสมาชิกออก/โอนเจ้าของทำแล้ว; UI รูป/กู้คืนถูกนำออกตามคำขอ
5. หากผู้ใช้ขอทดสอบ ให้ปรับ E2E สำหรับหน้ากิจวัตรใหม่และ dialog ยืนยันก่อน ตรวจทั้งยกเลิก/ยืนยันและ keyboard/mobile โดยไม่แก้ข้อมูลใช้งานจริง

เอกสารรายละเอียด: [Roadmap](roadmap.md), [Project Status](project-status.md), [AI Phase 11](ai-phase-11.md)
