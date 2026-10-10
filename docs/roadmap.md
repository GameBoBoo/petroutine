# Project Roadmap

## เสร็จแล้ว

- Phase 0–3.5: problem/requirements, PostgreSQL API และ Next.js full-stack MVP
- Phase 4: edit/archive, assignment, notes, filters และ Docker Compose
- Phase 4.5: CI refresh, Calendar, Settings และ in-app notifications
- Phase 4.6: Product Refinement — flexible schedules, Quick Add/templates, occurrence control+Undo, care/health text records, Timeline, Activity Log และ automated E2E
- Phase 4.7: Household safety — Owner-only trash/restore พร้อมรักษาข้อมูล, activity audit และนำ Handover ออกจากผลิตภัณฑ์

## แผนผลิตภัณฑ์ถัดไป (ยังไม่ implement)

- Phase 5: Pet & Wellness Data Foundation — โปรไฟล์เพิ่มสายพันธุ์/เพศ/ทำหมัน/น้ำหนักตั้งต้น และ Health Passport สำหรับแพ้ยา โรค ยา วัคซีน และวันนัด โดยยังไม่มีไฟล์แนบ
- Phase 6: Daily Wellness Log — Quick Check-in แบบเลือกกรอกสำหรับอาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก และข้อสังเกต รองรับย้อนหลังและหลายบันทึกต่อวัน
- Phase 7: Personal Baseline & Learning Mode — baseline รายสัตว์/ราย metric จากข้อมูล 14 วัน พร้อม progress และสถานะข้อมูลไม่เพียงพอ
- Phase 8: Change Detection & Alerts — กฎการเบี่ยงเบนต่อเนื่อง, alert lifecycle, หลักฐาน และข้อความไม่วินิจฉัย
- Phase 9: Wellness Dashboard — สถานะรวม กราฟ baseline/แนวโน้ม 7/14/30/90 วัน และ Alert ที่กำลังติดตาม
- Phase 10: Reminders, Shared Monitoring & Vet Report — เตือนวัคซีน/นัดหมาย, ติดตาม Alert ร่วมกัน และรายงานข้อเท็จจริงสำหรับพิมพ์/PDF
- Phase 11: AI Insight Layer (optional) — ทำท้ายสุดเมื่อมีเวลาและ Phase 5–10 เสถียร ต้องมีหลักฐาน, guardrail, logging และ fallback ไป Rule-based

รายละเอียดที่อนุมัติ: [Pet Wellness Integration Design](superpowers/specs/2026-10-11-pet-wellness-integration-design.md)

## Delivery track

ทำหลัง freeze ของแต่ละ milestone: เตรียม Git remote ตามที่ผู้ใช้กำหนด, Jenkins checkout, isolated PostgreSQL tests, production image, registry, Compose deploy, health/smoke/persistence verification, demo script, screenshots/logs, rollback/runbook และตรวจ Course Container

## Deferred นอกแผนหลัก

อัปโหลดรูป/ไฟล์, email/push, invite lifecycle, member administration, Behavior Coach และ baseline ขั้นสูงตามอายุ/ฤดูกาล ห้ามนำ AI ไปวินิจฉัยหรือคำนวณยา
