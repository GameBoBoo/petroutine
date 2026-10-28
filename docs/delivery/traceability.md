# Traceability และหลักฐาน

ผลตรวจต้องอ่านร่วมกับ [ผล Course baseline](course-results.md) และ [ผลหลัง cleanup](../maintenance.md); `../delivery-verification.md` เป็นประวัติ local ก่อนตรวจ Course ตารางนี้ระบุวิธีตรวจ ไม่ได้แปลว่าผ่านทุกกรณีแยกข้อโดยอัตโนมัติ หนึ่งไฟล์ test มีหลายเคสและต้องเปิด log ตรวจผลจริง

| ข้อผูกพัน | Implementation | วิธีตรวจ/หลักฐาน | สถานะที่ยืนยันได้ |
|---|---|---|---|
| AC-01 บัญชี บ้าน สัตว์ | catch-all API, household/pet/access services | `api-regression.test.mjs`, `phase4.test.mjs`, delivery smoke | Local unit/API ผ่าน; smoke ตรวจใหม่ใน Course |
| AC-02 ตารางกิจวัตร | `lib/schedule.js`, routine/task services | `routine-v2-api.test.mjs`, `phase4.test.mjs` | Local suite ผ่าน |
| AC-03 Today/timezone | TodayView, task service | `activity-timeline.test.mjs`, product-refinement E2E | Local E2E ผ่าน |
| AC-04 งานรายครั้ง/confirmation | TaskOptions, ConfirmationProvider | `task-mutations.test.mjs`, product-refinement E2E | Local suite ผ่าน; ไม่อ้างว่าทดสอบทุก keyboard path แล้ว |
| AC-05 idempotency/conflict | task/idempotency services | `task-mutations.test.mjs` | Local unit/API ผ่าน |
| AC-06 Undo/expiry/version | task service | `task-mutations.test.mjs` | Local unit/API ผ่าน |
| AC-07 care/health permissions | care-entry/health-record services | `care-health-api.test.mjs` | Local unit/API ผ่าน |
| AC-08 Timeline/history | timeline/activity services | `activity-timeline.test.mjs` | Local unit/API ผ่าน |
| AC-09 transactional audit | transaction/activity services | API mutation tests | Local suite ผ่าน; audit snapshot allowlist ต้องคงไว้ |
| AC-10 mobile 375px | responsive views | product-refinement/workspace-consistency E2E | Local E2E ผ่าน |
| AC-11 health boundary | HealthRecords, validation | care-health tests + demo disclaimer | มี disclaimer; ไม่ใช่ผล clinical validation |
| AC-12 migration rerun | migrations 004–018, migrate.mjs | API schema setup + production startup | Local startup ผ่าน; recovery drill บันทึกแยก |
| AC-13 household archive | household/access services | `household-trash-api.test.mjs` | Local suite ผ่าน; UI เดิมกับเอกสารต้องสอดคล้อง |
| AC-14 profile/passport | passport service | `pet-wellness-foundation.test.mjs` | Local unit/API ผ่าน |
| AC-15 wellness logs | wellness-log service | `daily-wellness-api.test.mjs` | Local unit/API ผ่าน |
| AC-16 deterministic baseline | wellness-baseline engine | baseline unit/API tests | Local unit/API ผ่าน |
| AC-17 alerts/lifecycle | wellness-detection/alert services | detection/alerts tests, health-follow-up E2E | Local suite ผ่าน |
| AC-18 dashboard/gaps | wellness-dashboard engine/view | dashboard unit/API/static, E2E | Local suite ผ่าน; static test อย่างเดียวไม่พิสูจน์ rendering ทุกกรณี |
| AC-19 reminders/follow-up/PDF | reminder/vet-report services | phase10 tests, product-refinement E2E | Local E2E ดาวน์โหลด PDF ผ่าน |
| AC-20 AI access/consent | ai-insight service/settings | `ai-insight-api.test.mjs`, ai-phase E2E | Mocked API และ consent E2E ผ่าน |
| AC-21 source/JSON/empty data | AI parser/context | `ai-insight-unit.test.mjs`, `ai:evaluate` | Synthetic provider eval แยกจาก mocked tests |
| AC-22 AI error/privacy/rate | provider adapter/audit | ai-insight API tests, synthetic eval | Error paths มี tests; ไม่อ้างว่า provider uptime ผ่าน SLA |
| AC-23 AI care draft confirmation | ai-care-draft service/QuickAdd | `ai-care-draft-unit.test.mjs`, care-experience API, `evaluate-ai-draft.mjs` | Draft ไม่บันทึกเอง ต้องผู้ใช้ตรวจยืนยัน; live synthetic 3/3 ผ่านในกรณีที่เลือก ไม่ครอบคลุมทุกข้อความ |
| DEL-01 Course environment | compose.verify/delivery + scripts | `artifacts/verification/*`, `course-results.md` | ใช้ผลที่บันทึกจริงเท่านั้น |
| DEL-02 Jenkins publish/deploy | Jenkinsfile, compose.ci | Jenkins build number/console + image revision | ต้องมี build result จริงก่อน Accepted |
| DEL-03 backup/recovery | delivery.sh | `artifacts/recovery.txt` | Drill ใช้ DB แยก; ไม่ทดแทน full disaster-recovery plan |
| RES-01 ปัญหาผู้ใช้ | research protocol | user-validation.md + ข้อมูลจริงที่ปกปิดตัวตน | Pending เก็บข้อมูลจริง |
| IMP-01 ลดงานลืม/ซ้ำ | measurement protocol | impact-and-sustainability.md | สมมติฐาน ยังไม่มีผลทดลองจริง |

Source revision ต้องอยู่ใน `artifacts/revision.txt` และ `artifacts/verification/verification.json` ผลจาก working-tree snapshot ห้ามนำไปติดป้ายว่าเป็น remote commit ที่ยังไม่ได้ push
