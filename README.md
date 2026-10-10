# PawRoutine

PawRoutine คือระบบภาษาไทยสำหรับจัดกิจวัตรและประวัติการดูแลสุนัข/แมวร่วมกันในครอบครัว ใช้ข้อมูลที่ผู้ใช้กรอกเอง ไม่มี AI วินิจฉัยโรค คำนวณยา หรือแนะนำการรักษา

## ความสามารถปัจจุบัน

- Today แบ่งงานเป็นต้องดูแลก่อน รายการถัดไป และเสร็จแล้ว พร้อมกรองผู้รับผิดชอบ สัตว์เลี้ยง และสถานะ
- กด Complete ได้ทันที หรือเปิดช่องหมายเหตุ; Skip ต้องระบุเหตุผล; เลื่อนเวลา/เปลี่ยนผู้รับผิดชอบเฉพาะครั้งนั้นได้
- Undo การเปลี่ยนสถานะงานภายใน 8 วินาที พร้อม optimistic concurrency และ idempotency
- Quick Add สำหรับกิจวัตร เทมเพลต นัดหมาย บันทึกการดูแลนอกตาราง และข้อมูลสุขภาพแบบข้อความ/ตัวเลข
- กิจวัตรรองรับรายสัปดาห์หลายวัน/หลายเวลา ทุก X วัน ครั้งเดียว วันเริ่ม/สิ้นสุด และช่วงพัก
- Pet Workspace มีภาพรวม กิจวัตร สุขภาพ และ Timeline
- “ประวัติการเปลี่ยนแปลง” เก็บ audit log แบบ immutable ว่าใครเปลี่ยนข้อมูลอะไร เมื่อใด พร้อม before/after ที่ผ่าน allowlist
- เจ้าของบ้านย้ายบ้านไปถังขยะและกู้คืนพร้อมข้อมูลเดิมทั้งหมดได้ สมาชิกทั่วไปไม่มีสิทธิ์ดำเนินการ
- Calendar, History, notifications, Household และ Settings ใช้ PostgreSQL จริงและแสดงเวลา `Asia/Bangkok`

ข้อมูลสุขภาพเป็นข้อมูลที่ผู้ใช้กรอกเองเท่านั้น และรุ่นนี้ยังไม่รองรับการอัปโหลดไฟล์/รูป

## ทิศทางถัดไป: Pet Wellness Intelligence

PawRoutine จะรักษาความสามารถด้าน Shared Care เดิมและเพิ่มระบบติดตามสุขภาวะตามลำดับ: ขยาย Pet/Health Passport → Daily Wellness Log → Learning Mode และ baseline 14 วัน → ตรวจจับความเปลี่ยนแปลงด้วยกฎ → Wellness Dashboard → reminders/shared monitoring/Vet Report → AI แบบ optional เป็น Phase สุดท้าย

ฟีเจอร์ Phase 5–11 ยังเป็นแผนและยังไม่ใช่ความสามารถของรุ่นปัจจุบัน ระบบจะใช้ถ้อยคำ “พบการเปลี่ยนแปลง” โดยไม่วินิจฉัยโรค ไม่คำนวณยา และ Daily Wellness ที่ไม่กรอกต้องถือว่าไม่มีข้อมูล ไม่ใช่ค่า 0 รายละเอียดอยู่ใน [Pet Wellness Integration Design](docs/superpowers/specs/2026-10-11-pet-wellness-integration-design.md) และ [Roadmap](docs/roadmap.md)

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

ค่าเริ่มต้นของ dev database คือ `127.0.0.1:55430` และไม่รับ connection จาก network interface อื่น หากต้องเปิด dev server ให้หยุด Docker web ก่อน แล้วรัน `npm run dev`; ทั้งสองแบบใช้ URL เว็บ `localhost:3000` แต่ห้ามรันพร้อมกัน

| โหมด | URL เว็บ | การเข้าถึงฐานข้อมูลจาก host |
| --- | --- | --- |
| ใช้งานปกติด้วย Docker | `http://localhost:3000` | ปิด |
| พัฒนา/ทดสอบด้วย dev override | `http://localhost:3000` | `127.0.0.1:55430` เท่านั้น |

ตั้ง `JWT_SECRET` ใน `.env` เป็นค่าสุ่มยาวก่อนใช้จริง ฐานข้อมูลอยู่ใน named volume จึงยังอยู่หลัง `docker compose restart`; ห้ามใช้ `docker compose down -v` หากต้องการเก็บข้อมูล

## Migration และการทดสอบ

Migration 001–005 เป็นแบบ additive และรันซ้ำได้ โดย 004 เพิ่ม flexible schedules, task versions, Activity Log, care entries, health records และ idempotency records ส่วน 005 เพิ่มถังขยะของบ้านโดยไม่ลบข้อมูลเดิม

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
- บ้าน: `GET|POST /households`, `POST /households/join`, `GET|PATCH /households/:id`, `GET /households/:id/members`, `GET /households/trash`, `POST /households/:id/archive`, `POST /households/:id/restore`
- สัตว์: `GET|POST /households/:id/pets`, `PATCH /pets/:id`, `POST /pets/:id/archive`
- กิจวัตร: `GET|POST /pets/:id/routines`, `PATCH /routines/:id`, `POST /routines/:id/archive`
- งาน: `GET /households/:id/tasks/today`, `POST /tasks/:id/complete`, `POST /tasks/:id/skip`, `PATCH /tasks/:id`, `POST /activity/:id/undo`
- การดูแล/สุขภาพ: สร้าง แก้ไข และ soft archive ผ่าน `/households/:id/care-entries`, `/care-entries/:id`, `/pets/:id/health-records`, `/health-records/:id`
- มุมมองรวม: `/households/:id/calendar`, `/history`, `/activity`, `/pets/:id/timeline`, `/notifications`

Mutation งานรับ `expected_version` และควรส่ง `Idempotency-Key`; stale update ตอบ 409 เพื่อให้ client โหลดข้อมูลล่าสุด

## สิทธิ์

สมาชิกบ้านอ่านข้อมูลและจัดการงานรายครั้งได้ ผู้สร้างรายการหรือ Owner แก้/เก็บ care/health record ได้ ส่วนการแก้/เก็บกิจวัตร เก็บสัตว์ และย้าย/กู้คืนบ้านเป็นสิทธิ์ Owner บ้านในถังขยะถูกซ่อนและปิดการเข้าถึงจากสมาชิกทุกคนจนกว่าจะกู้คืน โดยคำสั่งแก้ข้อมูลล็อกสถานะบ้านใน transaction และคำสั่งอ่านตรวจ `archived_at` ใน query ข้อมูลจริงเพื่อป้องกัน race condition

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
