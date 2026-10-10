# PawRoutine Project Memory

## Product decisions

- Thai-first household care coordinator สำหรับสุนัข/แมว; `Asia/Bangkok` เป็นเวลาอ้างอิง
- Today เป็นหน้าหลัก Complete กดได้ทันทีและเปิดหมายเหตุได้; Skip ต้องมีเหตุผล
- Quick Add ใช้ร่วมกันบน desktop/mobile และมี routine/template/appointment/care/health
- health data เป็นข้อความ/ตัวเลขที่ผู้ใช้กรอกเอง ไม่มีไฟล์และไม่ให้คำแนะนำแพทย์
- schedule canonical v2 รองรับ weekly หลายวัน/เวลา, interval, once, bounds และ pauses โดยอ่าน legacy ได้
- สมาชิกเปลี่ยน occurrence ได้ Owner ดูแล routine/pet lifecycle; care/health ให้ creator หรือ Owner แก้/archive
- ทุก product mutation ต้องมี Activity แบบ sanitized และ transactional; account log ต้องไม่รั่วเข้าบ้าน
- Undo งานได้ 8 วินาทีและต้องไม่ย้อนทับการเปลี่ยนของสมาชิกคนอื่น
- Owner เท่านั้นที่ย้ายบ้านลงถังขยะ/กู้คืนได้ บ้าน archived ต้องถูกซ่อนและปิดทุก data access โดยข้อมูลลูกยังอยู่ครบ
- ทุก child mutation ต้องถือ shared lock ของ household ใน transaction เดียวกัน ส่วน archive ถือ update lock; data query ต้องตรวจ `households.archived_at IS NULL` ซ้ำเพื่อไม่ให้ check/use แยกกันเปิดช่อง race หรือข้อมูลรั่ว
- เมนู Handover ถูกนำออก; ใช้ชื่อ “ประวัติการเปลี่ยนแปลง” แทน Activity เพื่ออธิบาย audit log ให้ชัดเจน
- อนุมัติทิศทางรวม PawRoutine กับ Pet Wellness Intelligence แบบ Wellness-first: structured daily data → baseline 14 วัน → rule-based detection → dashboard/report → AI optional ท้ายสุด
- Phase 5–10 ต้องทำงานครบโดยไม่พึ่ง AI; AI Phase 11 ห้ามคำนวณตัวเลขเอง วินิจฉัยโรค หรือคำนวณยา และต้อง fallback ไป Rule-based ได้
- Daily Wellness ช่องว่างหมายถึงไม่มีข้อมูล ไม่ใช่ค่า 0; baseline/alert ต้องแยก pet+metric, deterministic และตรวจย้อนกลับข้อมูลต้นทางได้

## Technology decisions

Next.js 15 + React 19 + PostgreSQL 16 + Node/Playwright Docker Compose ใช้ named volume Migration 001–005 เป็น additive โปรเจกต์ไม่มี `.git`; ห้าม initialize เอง

- Deployment contract: ผู้ใช้เข้าระบบผ่าน `http://localhost:3000` เพียงพอร์ตเดียว
- Web และ API อยู่ origin เดียวกัน; PostgreSQL ไม่แชร์ host port กับเว็บและอยู่หลัง Docker private network ที่ `db:5432`
- `docker-compose.dev.yml` เป็นเครื่องมือเฉพาะงานพัฒนา ไม่ใช่ค่าเริ่มต้นสำหรับการใช้งานระบบ

## Verification memory

- Unit/API tests ครอบคลุม migration, schedule boundaries, permissions, idempotency, conflict, Undo, care/health, Activity isolation, Timeline และ household trash/restore
- Playwright runner สร้าง schema สุ่ม เริ่ม Next dev server และลบเฉพาะ schema นั้น
- Compose ปกติเปิดสู่ host เฉพาะ web ที่ `localhost:3000`; PostgreSQL อยู่ใน private Docker network ที่ `db:5432`
- เมื่อต้องพัฒนา/ทดสอบจาก host ให้ใช้ `docker-compose.dev.yml` ซึ่ง bind PostgreSQL เฉพาะ `127.0.0.1:55430`
- 11 ต.ค. 2026: `npm test` ผ่าน 41/41, production build ผ่าน, Playwright desktop/mobile ผ่าน 2 และ skip 2 ตาม project guard รวม typed confirmation, trash/restore และ preservation ของ pet/routine/care/health; Docker health `ok/ok`, host เปิดเฉพาะ port 3000 และผู้ใช้เดิม 5 รายการยังอยู่
- 11 ต.ค. 2026: cleanup ก่อนเตรียม GitHub ลบ legacy app, starter copy, generated output/log, local SDD ledger, เอกสารแผนเก่า และ `AppShell.jsx` ที่ไม่มี runtime import; เปลี่ยนชื่อ Activity/Timeline test และ AI doc ให้ตรงผลิตภัณฑ์ พร้อมขยาย `.gitignore`/`.dockerignore`; หลัง cleanup `npm test` ผ่าน 41/41 และ production build ผ่าน

## Known limitations

ไม่มี upload, push/email, AI/LLM, Daily Wellness, baseline, change detection, Wellness Dashboard หรือ Vet Report ในรุ่นปัจจุบัน; invite expiry/rotate, advanced member management และ Jenkins/Course Container ยังไม่มี Catch-all API route และ page orchestrator ยังควรแยกเพิ่มเติมในงาน maintainability ภายหลัง

## Guardrails

อย่าอ้างว่า Phase 5–11 implement แล้วหรือว่ามี medical intelligence; อย่าตีความ missing wellness data เป็น 0; อย่าลบข้อมูล care history หรือ household graph เมื่อ archive; อย่าเปิด archive/restore ให้ member; อย่าใช้ `docker compose down -v` กับข้อมูลผู้ใช้; อย่า publish PostgreSQL ออกทุก network interface; อย่าเปลี่ยน public URL จาก `localhost:3000` โดยไม่มีการตัดสินใจใหม่
