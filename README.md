# PawRoutine

## ส่งมอบตามเกณฑ์รายวิชา

เริ่มจาก [Delivery runbook ทีละขั้น](docs/delivery/README.md), [Course/Jenkins](docs/delivery/course-and-ci.md), [Traceability](docs/delivery/traceability.md) และ [ผล Course ล่าสุด](docs/delivery/course-results.md) ชุดนำเสนอเปิดจาก [HTML slides](docs/delivery/presentation.html) พร้อม [บท Demo](docs/delivery/demo-script.md)

ผล local เดิมไม่แทนการตรวจ Course Container การมี Jenkinsfile ไม่ใช่หลักฐานว่า pipeline ผ่าน ต้องอ่าน build result และ commit ที่ใช้จริง ส่วนผลวิจัย/ทีม/ต้นทุนที่ยังไม่มีข้อมูลถูกระบุ Pending ในเอกสารส่งมอบ

## UX ล่าสุด — 23 ตุลาคม 2026

กิจวัตรหลักแสดงแถวกระชับ ค้นหา/กรองสัตว์และแบ่ง 10 รายการ รายละเอียดเสริมพับได้ UI ใช้ “ลบ” พร้อมยืนยันก่อนดำเนินการ โดย backend ยัง soft archive รักษาประวัติ ฟอร์มและการเปลี่ยนสถานะสำคัญมีหน้าต่างยืนยันของระบบ ดู [UX/UI](docs/ux-ui.md), [Popup fields](docs/popup-fields.md) และ [สถานะล่าสุด/ข้อจำกัดการทดสอบ](docs/project-status.md)

การปรับปรุงประสบการณ์ใช้งานล่าสุดและขอบเขต AI สำหรับค้น/สรุปข้อมูล: [Care experience update](docs/care-experience.md)

PawRoutine คือระบบภาษาไทยสำหรับจัดกิจวัตรและประวัติการดูแลสุนัข/แมวร่วมกันในครอบครัว ใช้ข้อมูลที่ผู้ใช้กรอกเอง ไม่มี AI วินิจฉัยโรค คำนวณยา หรือแนะนำการรักษา

## ความสามารถปัจจุบัน

- Today แบ่งงานเป็นต้องดูแลก่อน รายการถัดไป บันทึกวันนี้ และเสร็จแล้ว พร้อมรวมรายการ Quick Add ที่มีวันเวลาเป็นวันนี้และกรองผู้รับผิดชอบ สัตว์เลี้ยง และสถานะ
- Complete มีหมายเหตุ optional; Skip ต้องระบุเหตุผล; เลื่อนเวลา/เปลี่ยนผู้รับผิดชอบเฉพาะครั้งนั้นได้ โดยมีหน้าต่างยืนยันก่อนเปลี่ยนข้อมูล
- Undo การเปลี่ยนสถานะงานภายใน 8 วินาที พร้อม optimistic concurrency และ idempotency
- Quick Add สำหรับเช็กอินสุขภาพรายวัน กิจวัตร งานครั้งเดียว บันทึกการดูแลนอกตาราง และข้อมูลสุขภาพแบบข้อความ/ตัวเลข
- กิจวัตรรองรับรายสัปดาห์หลายวัน/หลายเวลา ทุก X วัน ครั้งเดียว วันเริ่ม/สิ้นสุด และช่วงพัก
- Pet Workspace มีภาพรวม กิจวัตร Wellness Dashboard เช็กอินรายวัน สุขภาพ สมุดสุขภาพ (Health Passport) และ Timeline พร้อมโปรไฟล์สายพันธุ์/เพศ/ทำหมัน/น้ำหนักตั้งต้น
- Daily Wellness Log เลือกกรอกอาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก หรือข้อสังเกตได้ รองรับย้อนหลัง หลายบันทึกต่อวัน การแก้ไข และ soft archive โดยช่องว่างยังคงเป็น “ไม่มีข้อมูล” ไม่ใช่ศูนย์
- Learning Mode คำนวณ baseline แยกสัตว์และ metric จาก 14 วันล่าสุด แสดงจำนวนวันที่เก็บ/เหลือและ “ข้อมูลยังไม่เพียงพอ” โดยคำนวณใหม่ทันทีเมื่อแก้หรือ archive บันทึกย้อนหลัง
- Change Detection ตรวจแนวโน้มต่อเนื่อง 3 วันเทียบ baseline พร้อม Alert ที่แสดงหลักฐาน รับทราบ/เริ่มติดตาม และกลับสู่ปกติอัตโนมัติ โดยไม่วินิจฉัยโรค
- Wellness Dashboard แสดงสถานะรวม แนวโน้ม 7/14/30/90 วัน ช่วง baseline และ Alert ที่กำลังติดตาม โดยเว้นช่องวันที่ไม่มีข้อมูลและมีตารางข้อมูลสำหรับการเข้าถึง
- การแจ้งเตือนในเว็บรวมงาน วัคซีน/นัดหมายที่ใกล้ถึงกำหนด และวันติดตาม Alert โดยตั้งระยะเตือนสุขภาพล่วงหน้า 7/14/30/60/90 วันและลบแจ้งเตือนเฉพาะบัญชีได้
- Shared Monitoring ให้สมาชิกบ้านมอบหมายผู้ติดตาม วันติดตาม และหมายเหตุของ Wellness Alert ร่วมกัน พร้อมบันทึก Activity
- Vet Report เลือกช่วงวันที่สูงสุด 366 วัน รวมโปรไฟล์ สมุดสุขภาพ เช็กอิน Alert และ Timeline พร้อมดาวน์โหลด PDF จาก browser โดยตรง โดยไม่พึ่ง AI
- ระบบยังเก็บ Activity audit ภายในแบบ immutable สำหรับความสอดคล้องและ Undo แต่ไม่นำหน้า “ประวัติการเปลี่ยนแปลง” มาแสดงในผลิตภัณฑ์
- เจ้าของบ้านลบบ้านได้ด้วยการพิมพ์ชื่อยืนยัน บ้านที่ลบจะถูกซ่อนและไม่แสดงรายการถังขยะในหน้า “บ้านของเรา” โดยข้อมูลเดิมยังไม่ถูกลบถาวร
- Calendar, History, notifications, Household และ Settings ใช้ PostgreSQL จริงและแสดงเวลา `Asia/Bangkok`

ข้อมูลสุขภาพเป็นข้อมูลที่ผู้ใช้กรอกเองเท่านั้น และรุ่นนี้ยังไม่รองรับการอัปโหลดไฟล์/รูป

## ทิศทางถัดไป: Pet Wellness Intelligence

PawRoutine จะรักษาความสามารถด้าน Shared Care เดิมและเพิ่มระบบติดตามสุขภาวะตามลำดับ: ขยาย Pet/Health Passport → Daily Wellness Log → Learning Mode และ baseline 14 วัน → ตรวจจับความเปลี่ยนแปลงด้วยกฎ → Wellness Dashboard → reminders/shared monitoring/Vet Report → AI แบบ optional เป็น Phase สุดท้าย

Phase 5–10 ตั้งแต่ Pet & Wellness Data Foundation ถึง Reminders, Shared Monitoring และ Vet Report พร้อมใช้งานแล้ว Phase 11 มี AI Chatbot สำหรับอ่าน/สรุปข้อมูล และ care draft ที่ผู้ใช้ต้องตรวจยืนยันผ่าน API ปกติก่อนบันทึก ถามข้อมูลสัตว์เลี้ยงรายตัวหรือทุกตัวในบ้าน พร้อมลิงก์บันทึกต้นทาง เจ้าของบ้านเปิดใช้ AI ใน Settings และสมาชิกยินยอมครั้งแรกต่อบ้านก่อนส่งข้อมูลให้ Provider รายละเอียดอยู่ใน [AI Phase 11](docs/ai-phase-11.md) และ [Roadmap](docs/roadmap.md)

หลังเปิด AI สำหรับบ้านแล้ว ปุ่ม **ถาม AI** มุมขวาล่างใช้พิมพ์คำถามเกี่ยวกับสัตว์เลี้ยงที่เลือกได้จากทุกหน้า โดยเลือกดูบันทึกย้อนหลัง 7, 30 หรือ 365 วัน ประวัติแชตอยู่เฉพาะในหน้าเว็บที่เปิดอยู่

## เทคโนโลยี

Next.js 15, React 19, PostgreSQL 16, `pg`, JWT, bcryptjs, Docker Compose, Node test runner และ Playwright

## เริ่มใช้งานด้วย Docker (แนะนำ)

ต้องมี Docker Desktop ระบบเปิดสู่เครื่องเฉพาะเว็บที่ port 3000 ส่วน PostgreSQL อยู่ใน Docker private network และไม่เปิด port สู่ภายนอก

```powershell
cd "C:\Users\Chawa\OneDrive\เดสก์ท็อป\PawRoutine"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d --build
```

เปิด <http://localhost:3000> และตรวจ health ที่ <http://localhost:3000/api/v1/health>

โครงสร้างปกติ:

```text
localhost:3000 → PawRoutine Web/API → db:5432 (Docker private network)
```

พอร์ต `5432` ในแผนภาพเป็นพอร์ตภายใน Docker ไม่ใช่พอร์ตที่เปิดบนเครื่องผู้ใช้ ดังนั้นการใช้งานปกติมีทางเข้าเพียง `localhost:3000` จุดเดียว

คำสั่งดูแลระบบที่ใช้บ่อย:

```powershell
docker compose ps              # ดูสถานะ
docker compose logs -f web     # ดู log ของเว็บและ API
docker compose logs -f db      # ดู log ของฐานข้อมูล
docker compose restart         # เริ่ม container ใหม่โดยไม่ลบข้อมูล
docker compose down            # หยุดระบบโดยเก็บ named volume ไว้
```

## โหมดพัฒนาและทดสอบจากเครื่อง

เมื่อต้องใช้ `npm run dev`, `npm test`, migration หรือ DBeaver จาก host ให้เปิดฐานข้อมูลผ่าน dev override ซึ่ง bind เฉพาะ loopback:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
npm install
npm run db:migrate
npm test
```

ค่าเริ่มต้นของ dev database คือ `127.0.0.1:55430` และไม่รับ connection จาก network interface อื่น คำสั่ง `npm run dev` ใช้ `127.0.0.1:3001` โดยตั้งใจ เพื่อไม่ให้แย่ง `localhost:3000` ของ Docker หรือเกิดกรณี IPv4/IPv6 ชี้ไปคนละเซิร์ฟเวอร์

| โหมด | URL เว็บ | การเข้าถึงฐานข้อมูลจาก host |
| --- | --- | --- |
| ใช้งานปกติด้วย Docker | `http://localhost:3000` | ปิด |
| พัฒนา/ทดสอบด้วย dev override | `http://127.0.0.1:3001` | `127.0.0.1:55430` เท่านั้น |

ตั้ง `JWT_SECRET` ใน `.env` เป็นค่าสุ่มยาวก่อนใช้จริง ฐานข้อมูลอยู่ใน named volume จึงยังอยู่หลัง `docker compose restart`; ห้ามใช้ `docker compose down -v` หากต้องการเก็บข้อมูล

## Migration และการทดสอบ

Migration 001–018 ใช้ผ่าน `db/migrations.mjs` ชุดเดียวกันใน runtime และ full-schema tests โดยรันตามลำดับชื่อไฟล์ ครอบคลุม core care, wellness, AI consent/context, follow-up outcomes และ care draft; migration-specific tests แยกตรวจการอัปเกรดและการรันซ้ำ

```powershell
npm run db:migrate
npm test
npm run build
npm run test:e2e
docker compose config
docker compose -f docker-compose.yml -f docker-compose.dev.yml config
```

Unit/API/E2E สร้าง PostgreSQL schema ชื่อสุ่มและลบเฉพาะ schema ทดสอบ ไม่แก้ schema ใช้งานจริง

## API หลัก

ทุก path อยู่ใต้ `/api/v1`

- Auth/บัญชี: `POST /auth/register`, `POST /auth/login`, `GET|PATCH /auth/me`, `GET|PATCH /auth/settings`, `GET /auth/activity`
- บ้าน: `GET|POST /households`, `POST /households/join`, `GET|PATCH /households/:id`, `GET /households/:id/members`, `POST /households/:id/archive`
- สัตว์: `GET|POST /households/:id/pets`, `PATCH /pets/:id`, `POST /pets/:id/archive`
- กิจวัตร: `GET|POST /pets/:id/routines`, `PATCH /routines/:id`, `POST /routines/:id/archive`
- งาน: `GET /households/:id/tasks/today`, `POST /tasks/:id/complete`, `POST /tasks/:id/skip`, `PATCH /tasks/:id`, `POST /activity/:id/undo`
- การดูแล/สุขภาพ: สร้าง แก้ไข และ soft archive ผ่าน `/households/:id/care-entries`, `/care-entries/:id`, `/pets/:id/health-records`, `/health-records/:id`
- สมุดสุขภาพ: `GET|POST /pets/:id/passport`, `PATCH /passport/:id`, `POST /passport/:id/archive`
- เช็กอินรายวัน: `GET|POST /pets/:id/wellness-logs`, `PATCH /wellness-logs/:id`, `POST /wellness-logs/:id/archive`
- Baseline: `GET /pets/:id/wellness-baseline?as_of=YYYY-MM-DD`
- Wellness Alerts: `GET /pets/:id/wellness-alerts?status=active|resolved|all`, `POST /wellness-alerts/:id/acknowledge`, `POST /wellness-alerts/:id/monitor`, `PATCH /wellness-alerts/:id/follow-up`
- Wellness Dashboard: `GET /pets/:id/wellness-dashboard?range=7|14|30|90&as_of=YYYY-MM-DD`
- Vet Report: `GET /pets/:id/vet-report?from=YYYY-MM-DD&to=YYYY-MM-DD`
- มุมมองรวม: `/households/:id/calendar`, `/history`, `/pets/:id/timeline`, `/notifications`; ลบแจ้งเตือนด้วย `POST /households/:id/notifications/dismiss`

Mutation งานรับ `expected_version` และควรส่ง `Idempotency-Key`; stale update ตอบ 409 เพื่อให้ client โหลดข้อมูลล่าสุด

## สิทธิ์

สมาชิกบ้านอ่านข้อมูลและจัดการงานรายครั้งได้ ผู้สร้างรายการหรือ Owner แก้/ลบ care/health record ได้ ส่วนการแก้/ลบกิจวัตร ลบสัตว์ และลบบ้านเป็นสิทธิ์ Owner บ้านที่ลบถูกซ่อนและปิดการเข้าถึง โดยคำสั่งแก้ข้อมูลล็อกสถานะบ้านใน transaction และคำสั่งอ่านตรวจ `archived_at` ใน query ข้อมูลจริงเพื่อป้องกัน race condition

## เอกสาร

- [Requirements](docs/requirements.md)
- [Acceptance Criteria](docs/acceptance-criteria.md)
- [User Flow](docs/user-flow.md)
- [UX/UI](docs/ux-ui.md)
- [API Design](docs/api-design.md)
- [Database Design](docs/database-design.md)
- [Architecture](docs/architecture.md)
- [Project Status](docs/project-status.md)
- [Project Memory](docs/project-memory.md)
- [Session Handoff](docs/session-handoff.md)
- [Pet Wellness Integration Design](docs/superpowers/specs/2026-10-11-pet-wellness-integration-design.md)
- [AI Phase 11 (Optional)](docs/ai-phase-11.md)
- [Phase 11 Implementation Plan and Status](docs/superpowers/plans/2026-10-19-phase-11-ai-insight-layer.md)
