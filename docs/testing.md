# ผลทดสอบและขอบเขตหลักฐาน

อัปเดต 28 ตุลาคม 2026 · Source ที่ตรวจ: `94313500fd5a9012a9d911f1722db90b1d1f9f26`

[สรุปผล JSON](delivery/evidence/main-9431350-verification.json) ระบุ source, environment และ image ที่ตรวจ การเปลี่ยนเอกสารหลังจาก commit นี้ไม่ใช่ Jenkins run ใหม่ และผลนี้ไม่ยืนยันโค้ดที่แก้ภายหลังโดยอัตโนมัติ

## ผลที่ยืนยันแล้ว

| ชุดตรวจ | ผลจริง | ขอบเขต |
|---|---|---|
| Production dependency audit | 0 vulnerabilities ที่ npm รายงาน ณ รอบตรวจ | ไม่ใช่ penetration test |
| Unit/API | 76/76 ผ่าน | รวม business rules, permissions, transactions, wellness และ AI mocked paths ตามเคสที่มี |
| Production build / Docker image | ผ่าน | สร้างจาก source ของรุ่นที่ระบุ |
| E2E บน dev server | 14 ผ่าน / 4 platform skips / 0 ไม่ผ่าน | Chromium desktop และ mobile emulation 375px |
| E2E บน production image | 12 ผ่าน / 4 platform skips / 0 ไม่ผ่าน | Core flows; AI settings/consent อยู่ใน suite แรก |
| Fresh deploy / health / API smoke | ผ่าน | Project และ DB สังเคราะห์แยกจากของเดิม |
| Stop/start persistence | ผ่าน | ข้อมูล synthetic users/households/pets คงอยู่ |
| Backup/restore | ผ่าน | checksum, pg_restore และ core row counts ลง DB ใหม่ |
| AI chat กับ provider stub ภายใน | ผ่าน | UI → API → network stub → parser/source validation → UI |
| AI draft กับ provider stub | ผ่าน | API คืน health/weight 4.2 กก. และไม่สร้าง health record เอง |
| Provider stub ตอบ 503 | ผ่าน error path | API ตอบ 502, UI แสดง fallback และ core read ยังทำงาน |
| Source/setup/docs | ผ่าน | syntax JS/scripts 83 ไฟล์, ลิงก์ Markdown 48 ไฟล์ในรอบนั้น, setup สร้าง secret ใหม่และรักษา .env เดิม |

## Feature ที่อยู่ในชุดตรวจ

Auth/บัญชี, บ้าน/สมาชิกและสิทธิ์, pets/passport, schedules/Today/Calendar, confirmation/cancel, idempotency/conflict/Undo, care/health records/Timeline, wellness logs/baseline/alert lifecycle/dashboard, follow-up/reminders, Vet Report/PDF และ mobile layout ตาม tests ที่รัน

ไม่ได้เก็บ line coverage และไม่ได้รับรองทุก permutation ของทุก feature การผ่าน mobile emulation ไม่เท่ากับการทดสอบบนอุปกรณ์จริงทุกชนิด รายละเอียด AC/implementation อยู่ [Traceability](delivery/traceability.md)

## สิ่งที่พบระหว่างทดสอบ

- Docker หยุดจากพื้นที่ดิสก์ไม่พอและ image ที่สร้างค้างเสียหาย จึงกู้ environment และใช้ dependency runner ที่สมบูรณ์ โดยเทียบ package/lockfile ก่อนรัน source จาก Git archive ใหม่ ไม่ลบฐานข้อมูลหรือ volumes เดิม
- Browser tests รอบแรกผ่าน `http://web:3000` พบว่าไม่เป็น secure context และไม่มี `crypto.randomUUID` เมื่อใช้ loopback `http://127.0.0.1:3004` ตามรูปแบบการใช้งาน local ชุดเดียวกันผ่านครบโดยไม่แก้แอป หากนำไปเปิดผ่าน IP/ชื่อเครื่องอื่นต้องจัด HTTPS/secure context
- ปุ่มแชตลอยถูกซ่อนบน Today ตามการออกแบบ จึงทดสอบแชตผ่าน Settings; Today มีทางเข้าผ่าน “เปิดเครื่องมือช่วยดูแล”

## สถานะ provider จริง

รอบนี้ยังไม่มีผลใหม่จาก provider จริง ผู้ใช้อนุญาต API-key testing แล้ว แต่ automatic approval review ยังปฏิเสธการคัดลอก credential เข้า Course และส่งไป provider ภายนอก จึงไม่มีการอ้างว่ารอบ live ผ่าน

ผล synthetic live Chat 5/5 และ Draft 3/3 ที่บันทึกในเอกสารเดิมเป็นคนละรอบและคนละ environment ไม่ใช้แทนการตรวจ UI/API/provider จริงของ commit นี้ และไม่ใช่ clinical validation

## ทำซ้ำและอ่านต่อ

- [README: ติดตั้ง/รัน/ทดสอบ](../README.md)
- [Configuration](configuration.md) และ [Team testing](team-testing.md)
- [Course/Jenkins](delivery/course-and-ci.md) สำหรับ environment รายวิชา
- [Known limitations](delivery/known-limitations.md)

Raw logs และรายงานละเอียดในเครื่องเจ้าของอยู่ `artifacts/qa-main-9431350/` ซึ่ง Git ignore สรุปที่แนบใน repository ไม่รวม credentials, session-private.json หรือ database dump
