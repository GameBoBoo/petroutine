# Project Status — 28 ตุลาคม 2026

ผลิตภัณฑ์มี Auth, Household, Pets, Routines, Today/Calendar, Activity/Timeline, wellness logs/baseline/alerts/dashboard, shared follow-up, Health Passport, Vet Report และ optional AI Chatbot/Care Brief/แบบร่างที่ต้องตรวจยืนยันก่อนบันทึก

## ผล delivery ที่ตรวจจริง

Next.js 15.5.28; Course Jenkins #7 ที่ revision `1bf3dc6` ผ่าน audit, unit/API 76/76, build, E2E 14 ผ่าน/4 ข้าม, registry publish, Compose deploy, health/API smoke และ backup/restore ดู [Course results](delivery/course-results.md) และ [JSON evidence](delivery/evidence/course-verification.json)

Live-provider synthetic Chat 5/5 และ Draft 3/3 ผ่านในกรณีที่เลือก หลังแก้ date grounding; ไม่ใช่ clinical validation

## งานที่ต้องใช้ข้อมูลจริง

ผลผู้ใช้จริง/ผลกระทบ สมาชิกและหน้าที่ ต้นทุน/ผู้สนับสนุนยังเป็น Pending มีแบบเก็บข้อมูลและชุดนำเสนอพร้อมเติม ไม่มีการ fabricate ผลวิจัยหรือหลักฐานร่วมงาน

Git อยู่บน branch local delivery/course-verification-20261028 ตามที่ผู้ใช้เลือกให้เก็บ commits ในเครื่อง รายการ deferred คือ email/push, attachment service, server PDF, การวินิจฉัย/ปรับยา และโมเดลธุรกิจที่ยังไม่พิสูจน์

[Runbook ทีละขั้น](delivery/README.md) · [Traceability](delivery/traceability.md) · [สไลด์](delivery/presentation.html)
