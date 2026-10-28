# Environment และโหมดรัน

ค่าตั้งต้นอยู่ที่ [`.env.example`](../.env.example) ใช้ `node scripts/setup-local.mjs` จาก checkout ใหม่เพื่อสร้าง `.env` พร้อม JWT secret สุ่ม หากมี `.env` อยู่แล้วสคริปต์จะไม่เขียนทับ ต้องแก้ค่าที่ต้องการในไฟล์เดิมเอง

## ค่าใน .env

| ตัวแปร | ค่าเริ่มต้น/หน้าที่ |
|---|---|
| `NODE_ENV` | ตัวอย่างใช้ development สำหรับ host; Compose กำหนด web เป็น production |
| `DATABASE_URL` | Host dev/tests/migration ใช้ PostgreSQL ที่ `127.0.0.1:55430` |
| `JWT_SECRET` | ต้องมีค่า; setup สร้าง random secret 32 bytes เป็น hex ไม่แชร์ข้ามเครื่อง |
| `PAWROUTINE_PORT` | 3000: port เว็บที่ Compose เปิดบน loopback ของ host |
| `PAWROUTINE_DB_PORT` | 55430: port DB ที่เปิดเฉพาะเมื่อใช้ dev override |
| `PAWROUTINE_AI_ENABLED` | false: เปิดความสามารถ AI ระดับ server เมื่อพร้อม config |
| `PAWROUTINE_AI_HOURLY_LIMIT` | 10 คำขอต่อผู้ใช้ต่อชั่วโมง; 0 ไม่จำกัด ใช้เฉพาะการทดสอบที่ควบคุมได้ |
| `AI_PROVIDER` | openai-compatible ตาม adapter ปัจจุบัน |
| `AI_API_KEY` | เว้นว่างเมื่อปิด AI; ใส่ key ที่มีสิทธิ์ใช้เมื่อจะเรียก provider |
| `AI_MODEL` | ชื่อ model ตาม provider ของผู้ทดสอบ ไม่มี model กลางที่แจกให้ทีม |
| `AI_BASE_URL` | เมื่อเว้นว่าง adapter ใช้ค่าเริ่มต้นของบริการ OpenAI-compatible ตามโค้ด; ดู [AI guide](ai-phase-11.md) ก่อนเปิดใช้งาน |

Compose ปกติกำหนด `DATABASE_URL` ภายใน web เป็น `db:5432` โดยตรง การแก้ `DATABASE_URL` ใน `.env` เปลี่ยนการเชื่อมต่อของสคริปต์/Next.js ที่รันบน host ไม่ได้ย้าย DB ของ Docker web ไปที่อื่น บัญชี DB ใน Compose ปกติเป็น local development credentials สำหรับการส่งมอบแยกให้ใช้ [Delivery runbook](delivery/README.md)

## เปลี่ยน port

ถ้าเว็บ port 3000 ไม่ว่าง ตั้ง `PAWROUTINE_PORT=3002` ใน `.env` แล้วใช้:

```bash
docker compose up -d --wait
```

เปิด `http://127.0.0.1:3002` แทน port เดิม หากเปลี่ยน DB port เป็น 55431 ต้องตั้งทั้ง `PAWROUTINE_DB_PORT=55431` และแก้ port ใน `DATABASE_URL` เป็น 55431 จากนั้นรัน dev override ตาม README ใหม่ `npm run dev` ใช้ port 3001 แยกจากตัวแปร PAWROUTINE_PORT

## เปิด AI

1. ตั้ง server flag, key, model และ base URL ตามบัญชี provider ของผู้ทดสอบใน `.env`
2. สำหรับ Docker ใช้ `docker compose up -d --force-recreate --wait web`; สำหรับ host dev ให้หยุดแล้วเริ่ม dev server ใหม่
3. Owner เปิด AI ใน Settings ของบ้าน สมาชิกต้องให้ consent ก่อนใช้
4. ใช้ข้อมูลสังเคราะห์ ตรวจ source และให้ผู้ใช้ยืนยัน draft ก่อนบันทึก ดูข้อจำกัด/การประเมินใน [AI guide](ai-phase-11.md)

การเปิด server flag ไม่แทนการเปิดใช้รายบ้านและ consent ไม่ส่ง key ไป browser หรือใส่ `.env` ใน Issue โควตาในแอปไม่ใช่วงเงินรายเดือนของ provider

## Local, verification และ delivery

| ชุดตั้งค่า | ใช้เมื่อใด | ข้อมูล |
|---|---|---|
| `docker-compose.yml` + `.env` | เปิดเว็บ local | named volume คงข้อมูล |
| เพิ่ม `docker-compose.dev.yml` | Node/DBeaver บน host ต้องเข้าถึง DB | volume เดียวกับ local project; เปิด DB เฉพาะ loopback |
| `compose.verify.yml` | Automated tests ใน Docker | DB แยกแบบ tmpfs ไม่ใช้ `.env` ของผู้ใช้ตามคำสั่งใน README |
| `compose.delivery.yml` + `.delivery.env` | isolated delivery/Course | config และ volume แยกตาม DELIVERY_PROJECT; สร้างด้วย delivery.sh init |

ถ้าแก้รหัส DB ใน config ของ volume ที่มีอยู่แล้ว รหัสในฐานข้อมูลจะไม่เปลี่ยนตามไฟล์โดยอัตโนมัติ ให้รักษา config เดิมไว้และทำ migration/สำรองข้อมูลตามขั้นตอน แทนการลบ volume เพื่อแก้ปัญหา
