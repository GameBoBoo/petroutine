# PawRoutine · PetRoutine

เว็บภาษาไทยสำหรับจัดกิจวัตรและบันทึกการดูแลสุนัข/แมวร่วมกันในบ้าน ใช้ Next.js 15, React 19 และ PostgreSQL 16 ชื่อใน UI คือ **PetRoutine** ระบบไม่วินิจฉัยโรคหรือแนะนำขนาดยา

## ให้สมาชิกทีมเริ่มใช้งาน

ต้องมี **Git, Docker Desktop พร้อม Docker Compose และ Node.js 22** เปิด Docker Desktop ก่อนเริ่ม Node ใช้เตรียม config; การรันเว็บด้วย Docker ไม่ต้องติดตั้ง npm dependencies บนเครื่อง

รุ่นสำหรับทีมทดสอบใช้ branch **`main`** ผู้ดูแลต้อง push `main` ที่รวมงานล่าสุดแล้วก่อนส่งลิงก์ให้ทีม

```bash
git clone --branch main https://github.com/GameBoBoo/pawroutine.git
cd pawroutine
node scripts/setup-local.mjs
docker compose up -d --build --wait --wait-timeout 180
```

สคริปต์ setup สร้าง `.env` พร้อม JWT secret สุ่มและปิด AI เป็นค่าเริ่มต้น ถ้ามี `.env` อยู่แล้วจะเก็บไว้ ไฟล์นี้ไม่ถูกส่งขึ้น Git แต่ละเครื่องต้องสร้างของตน ไม่ใช้ secret ของคนอื่น

เปิด **http://127.0.0.1:3000** และตรวจ **http://127.0.0.1:3000/api/v1/health** ซึ่งควรตอบ `{"status":"ok","database":"ok"}` ครั้งแรกอาจใช้เวลาสักครู่เพื่อดาวน์โหลด image และ build

1. สมัครบัญชีใหม่ → สร้างบ้าน → เพิ่มสุนัข/แมว → สร้างกิจวัตร
2. อีกบัญชีเข้าร่วมบ้านด้วยรหัสเชิญ เจ้าของและสมาชิกต้องใช้เว็บ/ฐานข้อมูลชุดเดียวกัน
3. ทดลอง Today, Calendar, ทำงานเสร็จ/ข้าม/Undo, เช็กอิน Wellness, Timeline และ Vet Report
4. ส่งปัญหาตาม [คู่มือทีมทดสอบ](docs/team-testing.md) รวมถึงกรณี Cancel, ไม่มีสิทธิ์ และข้อมูลเปลี่ยนพร้อมกัน

แต่ละคนรันบนเครื่องตนเองจะได้ฐานข้อมูลคนละชุด การทดสอบร่วมบ้านสองคนบนเครื่องเดียวใช้ browser profile หรือ incognito แยกกัน ค่าเริ่มต้นรับเฉพาะเครื่องตัวเอง ยังไม่เปิดเว็บให้เครื่องอื่นใน LAN

## คำสั่งดูแลเว็บและข้อมูล

```bash
docker compose ps
docker compose logs --tail 100 web
docker compose logs --tail 100 db
docker compose stop
docker compose start
docker compose down
```

`stop`/`down` เก็บข้อมูลใน named volume ไว้ เปิดใหม่ด้วย `docker compose up -d --wait` Migration 001–018 รันอัตโนมัติก่อนเว็บเริ่ม ห้ามใช้ `docker compose down -v` หากต้องการเก็บข้อมูล

อัปเดตรุ่นหลังผู้ดูแล push แล้ว:

```bash
git pull --ff-only
node scripts/setup-local.mjs
docker compose up -d --build --wait --wait-timeout 180
```

หาก port 3000 ถูกใช้ ให้ตั้ง `PAWROUTINE_PORT=3002` ใน `.env` แล้วรัน Compose ใหม่ เปิดเว็บที่ port 3002 ตามที่ตั้ง ฐานข้อมูลปกติไม่เปิด port ออกสู่ host บัญชี DB แบบ local ใน Compose ใช้เฉพาะเครื่องพัฒนา/ทดสอบ; สำหรับส่งมอบแยกใช้ [Delivery runbook](docs/delivery/README.md)

## พัฒนาโดยรัน Next.js บนเครื่อง

ใช้โค้ดบน host และ PostgreSQL ใน Docker เหมาะกับการแก้โค้ดแล้วเห็นผลทันที:

```bash
node scripts/setup-local.mjs
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --wait db
npm ci
npm run db:migrate
npm run dev
```

เปิด **http://127.0.0.1:3001** (ต่างจาก Docker web ที่ port 3000) กด Ctrl+C เพื่อหยุด dev server ฐานข้อมูลจาก host อยู่ที่ `127.0.0.1:55430` ถ้าเปลี่ยน `PAWROUTINE_DB_PORT` ต้องแก้ port ใน `DATABASE_URL` ให้ตรงด้วย

อย่ารัน `npm run dev` และ production build/E2E พร้อมกันใน checkout เดียว เพราะใช้ `.next` ร่วมกัน ใช้ verification container ด้านล่างเมื่อต้องการทดสอบแยก

## Automated tests

### แยกฐานข้อมูลและ dependencies ด้วย Docker

ไม่ใช้ `.env` หรือฐานข้อมูลของผู้ใช้งาน test DB เป็น tmpfs และไม่เปิด host port:

```bash
docker compose --env-file .env.example -p pawroutine-team-check -f compose.verify.yml up --build --abort-on-container-exit --exit-code-from verify
docker compose --env-file .env.example -p pawroutine-team-check -f compose.verify.yml down
```

รัน audit → unit/API → production build → E2E ทั้ง desktop/mobile ผลอยู่ที่ `artifacts/verification/` ครั้งแรกต้องดาวน์โหลด Chromium และ dependencies AI ในชุดนี้ใช้ mock ไม่ใช่ provider จริง

### รัน tests บน host

หลังเตรียม dev DB และ `npm ci` ตามด้านบน:

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

บน Linux หาก browser ขาด system libraries ใช้ `npx playwright install --with-deps chromium` ซึ่งอาจต้องสิทธิ์ติดตั้ง package Tests สร้าง schema สุ่มและลบ schema ของตน ควรใช้ DB ทดสอบส่วนตัว ไม่ชี้ไปฐานข้อมูล production

## AI เป็นตัวเลือก

งานดูแลหลักใช้ได้โดยไม่เปิด AI หากทีมต้องทดสอบ AI ให้กำหนด `PAWROUTINE_AI_ENABLED=true`, `AI_API_KEY`, `AI_MODEL` และ `AI_BASE_URL` ตามบริการที่ได้รับสิทธิ์ใน `.env` แล้วสร้าง web ใหม่ด้วย `docker compose up -d --force-recreate web`

จากนั้น Owner เปิด AI ใน Settings ของบ้าน และสมาชิกยินยอมก่อนใช้งาน ใช้ข้อมูล synthetic ทดสอบเท่านั้น เก็บ API key ฝั่ง server และไม่ commit `.env` ค่าโควตาปกติ 10 คำขอ/ผู้ใช้/ชั่วโมง ดู [AI configuration และข้อจำกัด](docs/ai-phase-11.md)

## เอกสารสำหรับทีม

ผู้ดูแลตรวจ `git status` ให้ไม่มีงานค้าง จากนั้นใช้ `git push origin main` ก่อนให้ทีม clone ส่งผล `git rev-parse --short HEAD` ให้ทีมตรวจว่าได้รุ่นเดียวกัน ใช้ source จาก `main` สำหรับทดสอบหลัง cleanup ส่วน ZIP/tag รุ่นส่งเก่าเก็บเป็นหลักฐานของ snapshot เดิม

- [ทดสอบระบบและรายงานปัญหา](docs/team-testing.md)
- [สรุปการจัดระเบียบไฟล์](docs/maintenance.md)
- [Requirements](docs/requirements.md) · [Acceptance Criteria](docs/acceptance-criteria.md)
- [Architecture](docs/architecture.md) · [API](docs/api-design.md) · [Database](docs/database-design.md)
- [สถานะและขอบเขต](docs/project-status.md) · [Roadmap](docs/roadmap.md)
- [Course / Jenkins](docs/delivery/course-and-ci.md) · [ผล Course ที่บันทึกไว้](docs/delivery/course-results.md)
- [รายงานหลัก](docs/delivery/submission-report.md) · [สไลด์](docs/delivery/presentation.html) · [ข้อจำกัด](docs/delivery/known-limitations.md)

ผล Jenkins #10 ของ commit `9d6ef80` เป็น baseline ก่อนจัดระเบียบไฟล์รอบนี้ ผลทดสอบของ source ที่แก้ล่าสุดดู [บันทึกการตรวจ](docs/maintenance.md) ยังไม่มีผลทดลองผู้ใช้จริง และต้องให้สมาชิกทบทวนส่วนที่รับผิดชอบก่อนนำเสนอ
