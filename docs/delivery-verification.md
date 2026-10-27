# Delivery Verification — 27 ตุลาคม 2026

**อ่านผลต่อเนื่องวันที่ 28 ตุลาคมใน [Course results](delivery/course-results.md)** พบและแก้การตั้ง migration ของ full-schema tests ที่ไม่ครบจาก clean DB แล้ว ผล local เดิมในหน้านี้เป็นประวัติ ไม่ใช่ผลรับรอง Course ตัว Jenkins/registry และ runbook ใหม่อยู่ใน `docs/delivery/`

บันทึกผลตรวจใน workspace รอบนี้ แยกจากผลตรวจเดิมใน `project-status.md` และ `session-handoff.md`

## ผลตรวจรอบนี้

| รายการ | ผล | รายละเอียด |
|---|---|---|
| Production build | ผ่าน | `npm run build` สำเร็จด้วย Next.js 15.5.27 |
| Unit/API suite | ผ่าน | `npm test` ผ่าน 76/76 หลังปรับ static checks ให้ตรงกับ UI ปัจจุบัน |
| Docker Compose syntax | ผ่าน | `docker compose config --quiet` สำเร็จ |
| Docker production build/deploy | ผ่าน | `docker compose up -d --build` สำเร็จ; PostgreSQL healthy และ log ระบุ `Database migration completed` |
| Health endpoint | ผ่าน | `http://127.0.0.1:3000/api/v1/health` ตอบ `{"status":"ok","database":"ok"}` |
| AI provider smoke | บางส่วน | model endpoint ตอบ HTTP 200 (`gemini-3.5-flash-lite`); completion timeout ก่อนตรวจ JSON สำเร็จ ใช้ข้อมูลสังเคราะห์และไม่แสดง key |
| Playwright E2E | ผ่าน | ชุดเต็มล่าสุด 18 tests: 14 ผ่าน, 4 ข้าม, 0 ไม่ผ่าน บน desktop/mobile หลังแก้ assertion onboarding |
| AI synthetic evaluation | ผ่านบางส่วน | 4/5 scenarios ผ่าน; multi-pet separation หมดเวลาใน provider completion (35 วินาที) |
| Course Container | ยังไม่ได้ตรวจ | ไม่มี Course Container ในสภาพแวดล้อมที่เข้าถึงได้ |
| Git delivery | ยังไม่ส่ง | branch `main`, มี remote `origin`; มีการเปลี่ยนแปลง/ไฟล์ใหม่จำนวนมากที่ยังไม่ commit/push |
| Jenkins / registry | ยังไม่ตั้งค่าใน repository | พบ Dockerfile, Compose และ seed SQL; ไม่พบ Jenkinsfile หรือ workflow สำหรับ build/publish registry |

## สิ่งที่ปรับเพื่อให้ verification ตรงกับโค้ด

- เพิ่ม migrations 017–018 ใน schema setup ของ `scripts/run-e2e.mjs`
- ปรับ static checks ใน `tests/product-ui-static.test.mjs` ให้ตรวจ `TaskOptions`, form options และข้อความลบปัจจุบันแทน selector/copy เก่า
- `tests/product-ui-static.test.mjs` ผ่าน 5/5 และ `npm test` ผ่าน 76/76 หลังแก้

## รายละเอียด E2E

ปรับ test ให้ใช้ navigation ภาษาไทยและยืนยัน confirmation dialog ตาม UX ปัจจุบัน รวมถึงแก้ scope ของ select/date picker ที่ render เป็น portal และชื่อไฟล์ PDF ที่ดาวน์โหลด. ชุดเต็มหลังแก้ assertion ให้ตรวจ `.onboarding` ผ่าน 14/18; 4 รายการถูก skip ตามเงื่อนไขใน test, 0 ล้มเหลว.

## วิธีทำซ้ำ

```powershell
npm test
npm run build
npm run test:e2e
npm run ai:check
docker compose config --quiet
docker compose up -d --build
Invoke-RestMethod http://localhost:3000/api/v1/health
```

`npm test` และ E2E ต้องมี PostgreSQL test endpoint ที่ `127.0.0.1:55430` ตาม `.env`/`docker-compose.dev.yml` ส่วน AI check ต้องเชื่อมต่อ provider ที่ตั้งค่าไว้ใน `.env` สคริปต์ส่งเฉพาะ synthetic record

## งานก่อนส่งมอบ

1. รัน Playwright E2E เต็มอีกครั้งหลังแก้ onboarding assertion
2. รัน AI completion smoke/evaluation ซ้ำเมื่อ provider ตอบทัน; ผลรอบนี้ 4/5 และหนึ่ง completion หมดเวลา
3. ตรวจ deploy ใน Course Container เมื่อมี environment ให้เข้าถึง; ในรอบนี้ตรวจได้เฉพาะ Docker local
4. เตรียม demo evidence ใน environment แยกต่างหาก; ไม่โหลด seed demo ลงฐานข้อมูล production
5. ก่อน deploy ให้สำรองฐานข้อมูลและบันทึกวิธีย้อน image tag ก่อนหน้า; ห้ามลบ named volume
6. กำหนด registry/Jenkins สำหรับส่งจริง; repository ยังไม่มี Jenkinsfile/workflow และไม่มี registry destination

## Git ที่พบ

มีไฟล์ tracked ที่แก้ไขและ untracked จำนวนมาก รวมถึง migration, source code, tests, public assets และ `pawroutine-before-testdata.dump`. ยังไม่มีการ stage หรือ commit ในรอบนี้
