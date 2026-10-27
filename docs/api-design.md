# REST API Design

## AI Chatbot (Phase 11)

`POST /pets/:id/ai-insights` ใช้ `intent: "chat_question"`, `question` ไม่เกิน 500 ตัวอักษร, `from`/`to` ไม่เกิน 365 วัน และ `history` สูงสุด 6 ข้อความ ผู้ส่งต้องเป็นสมาชิกบ้านที่เปิด AI และมีความยินยอมที่ยังไม่ถูกถอน `POST /households/:id/ai-insights` ใช้รูปแบบเดียวกันสำหรับสัตว์เลี้ยงทุกตัวในบ้าน คำถามแนวโน้มยังจำกัด 30 วัน `PATCH /households/:id/ai-consent` รับ `{ "consented": true|false }` สำหรับสมาชิกจัดการความยินยอมของตนเอง `GET /pets/:id/ai-insights/status` คืน `consented` ให้ UI คำตอบใช้รูปแบบเดียวกับ AI Insight (`answer`, `sources`, `range`, `disclaimer`) พร้อม `sources[].pet_id/pet_name` ประวัติสนทนาไม่บันทึกในฐานข้อมูล จำกัดข้อมูลต้นทาง 240 รายการต่อคำขอ โควตา 10 คำขอต่อผู้ใช้ต่อชั่วโมงรวมทุก intent

`hourly_limit` ใน endpoint สถานะเป็น `0` เมื่อปิดโควตาของแอปสำหรับทดสอบผ่าน `PAWROUTINE_AI_HOURLY_LIMIT=0`; ค่าเริ่มต้นคือ 10 คำขอต่อผู้ใช้ต่อชั่วโมง

Base path: `/api/v1` ใช้ Bearer JWT ยกเว้น register/login/health ผลผิดพลาดอยู่ในรูป `{ "error": { "code", "message", "fields"? } }`

## Endpoints

| กลุ่ม | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET|PATCH /auth/me`, `GET|PATCH /auth/settings`, `GET /auth/activity` |
| Household | `GET|POST /households`, `POST /households/join`, `GET|PATCH /households/{id}`, `GET /households/{id}/members`, `GET /households/trash`, `POST /households/{id}/archive`, `POST /households/{id}/restore` |
| Pet | `GET|POST /households/{id}/pets`, `PATCH /pets/{id}`, `POST /pets/{id}/archive` |
| Routine | `GET|POST /pets/{id}/routines`, `PATCH /routines/{id}`, `POST /routines/{id}/archive` |
| Today/task | `GET /households/{id}/tasks/today`, `POST /tasks/{id}/complete`, `POST /tasks/{id}/skip`, `PATCH /tasks/{id}`, `POST /activity/{id}/undo` |
| Care | `GET|POST /households/{id}/care-entries`, `PATCH /care-entries/{id}`, `POST /care-entries/{id}/archive` |
| Health | `GET|POST /pets/{id}/health-records`, `PATCH /health-records/{id}`, `POST /health-records/{id}/archive` |
| Health Passport | `GET|POST /pets/{id}/passport`, `PATCH /passport/{id}`, `POST /passport/{id}/archive` |
| Daily Wellness | `GET|POST /pets/{id}/wellness-logs`, `PATCH /wellness-logs/{id}`, `POST /wellness-logs/{id}/archive` |
| Wellness Baseline | `GET /pets/{id}/wellness-baseline?as_of=YYYY-MM-DD` |
| Wellness Alerts | `GET /pets/{id}/wellness-alerts?status=active|resolved|all`, `POST /wellness-alerts/{id}/acknowledge`, `POST /wellness-alerts/{id}/monitor`, `PATCH /wellness-alerts/{id}/follow-up` |
| Wellness Dashboard | `GET /pets/{id}/wellness-dashboard?range=7|14|30|90&as_of=YYYY-MM-DD` |
| Vet Report | `GET /pets/{id}/vet-report?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| Views | `GET /households/{id}/calendar`, `/history`, `/notifications`, `/activity`, `GET /pets/{id}/timeline` |
| Notification dismissal | `POST /households/{id}/notifications/dismiss`, `POST /households/{id}/notifications/dismiss-all` with `notification_keys` array |

## Schedule v2

`schedule` รองรับ `{ type: "weekly", days, times }`, `{ type: "interval", interval_days, start_date, times }` และ `{ type: "once", date, times }` เพิ่ม `end_date` และ `pauses: [{from,to}]` ได้ ระบบยังอ่าน legacy `time/days/schedule_type` ได้

## Task mutation

Complete/Skip/PATCH รับ `expected_version`; Complete รับ `notes` แบบ optional, Skip ต้องมี `skip_reason`, PATCH action เป็น `reschedule` หรือ `reassign` Client ควรส่ง `Idempotency-Key` หาก version ไม่ตรงตอบ `409 STALE_TASK` การตอบสำเร็จมี `{ task, activity: { id, reversible_until } }`

## Query/pagination

Activity และ Timeline ตอบ `{ items, next_cursor }` ค่าเริ่มต้น 25 สูงสุด 100 Calendar จำกัดช่วง 42 วัน Daily Wellness จำกัด `limit` ที่ 100 และช่วง `from`–`to` ไม่เกิน 366 วัน ทุก date filter ตีความตาม `Asia/Bangkok`

Baseline ใช้หน้าต่าง 14 วันสิ้นสุดที่ `as_of` (ค่าเริ่มต้นวันนี้) และตอบสถานะ `ready`, `learning` หรือ `insufficient_data` แยกราย metric พร้อม `source_dates`/`source_log_ids`; ไม่รับวันที่อนาคตและไม่สร้างข้อมูลทดแทนวันที่ไม่มีบันทึก

Wellness Alerts คืน baseline/observation window, rule, direction, status, source log ids และ shared follow-up วันที่ตอบเป็น `YYYY-MM-DD` ตาม `Asia/Bangkok` สมาชิกบ้านอ่าน รับทราบ เริ่มติดตาม และกำหนดผู้ติดตาม/วัน/หมายเหตุได้ การอัปเดต follow-up เปลี่ยนสถานะเป็น `monitoring` และเขียน Activity; alert ที่ resolved แล้วแก้ follow-up ไม่ได้

Wellness Dashboard เป็น read-only derived response รวมสถานะ, coverage, baseline readiness, จุดข้อมูล/ช่วง baseline แยก 7 metrics และ active alerts ค่า `range` ต้องเป็น 7, 14, 30 หรือ 90 และ `as_of` ห้ามเป็นอนาคต วันที่ไม่มีข้อมูลไม่ถูกเติมค่าและกราฟต้องคงเป็นช่องว่าง

Notifications รวม `task`, `health_due` จาก vaccination/appointment ที่ active และ `wellness_alert` follow-up โดยเคารพ `notifications_enabled`, `lead_minutes` และ `health_reminder_days` 7/14/30/60/90 วัน แต่ละรายการมี `notification_key`; dismissal ซ่อนเฉพาะผู้ใช้และกำหนดเดิม โดยกำหนดใหม่สามารถแจ้งอีกครั้ง ส่วน Vet Report เป็น read-only response ช่วงวันที่ไม่เกิน 366 วันและห้ามวันที่อนาคต รวมข้อมูลจริงสำหรับ browser print โดยไม่สร้างคำวินิจฉัย

## Permissions

ทุก endpoint ตรวจ household membership สมาชิกแก้ task occurrence และสร้าง/อ่าน Daily Wellness ได้ ผู้สร้างหรือ Owner แก้/archive care/health/wellness ได้ และ Owner เท่านั้นที่จัดการ lifecycle ของ routine/pet/household บ้านที่ archived ปฏิเสธการเข้าถึงทุก endpoint ยกเว้นรายการถังขยะและการกู้คืนของ Owner
