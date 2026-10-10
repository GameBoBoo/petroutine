# REST API Design

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
| Views | `GET /households/{id}/calendar`, `/history`, `/notifications`, `/activity`, `GET /pets/{id}/timeline` |

## Schedule v2

`schedule` รองรับ `{ type: "weekly", days, times }`, `{ type: "interval", interval_days, start_date, times }` และ `{ type: "once", date, times }` เพิ่ม `end_date` และ `pauses: [{from,to}]` ได้ ระบบยังอ่าน legacy `time/days/schedule_type` ได้

## Task mutation

Complete/Skip/PATCH รับ `expected_version`; Complete รับ `notes` แบบ optional, Skip ต้องมี `skip_reason`, PATCH action เป็น `reschedule` หรือ `reassign` Client ควรส่ง `Idempotency-Key` หาก version ไม่ตรงตอบ `409 STALE_TASK` การตอบสำเร็จมี `{ task, activity: { id, reversible_until } }`

## Query/pagination

Activity และ Timeline ตอบ `{ items, next_cursor }` ค่าเริ่มต้น 25 สูงสุด 100 Calendar จำกัดช่วง 42 วัน ทุก date filter ตีความตาม `Asia/Bangkok`

## Permissions

ทุก endpoint ตรวจ household membership สมาชิกแก้ task occurrence ได้ ผู้สร้างหรือ Owner แก้/archive care/health ได้ และ Owner เท่านั้นที่จัดการ lifecycle ของ routine/pet/household บ้านที่ archived ปฏิเสธการเข้าถึงทุก endpoint ยกเว้นรายการถังขยะและการกู้คืนของ Owner
