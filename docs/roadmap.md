# Project Roadmap

## Delivery track — 28 ตุลาคม 2026

งานเทคนิค delivery มีผลตรวจจริงแล้ว: Jenkins #7 ผ่าน audit, unit/API 76/76, build, E2E 14 ผ่าน/4 ข้าม, registry, Course deploy, health/API smoke และ backup/recovery หลัง patch Next.js 15.5.28 พร้อม traceability, demo และสไลด์ ดู [Runbook](delivery/README.md) และ [ผลตรวจจริง](delivery/course-results.md) ได้รับรายชื่อสมาชิกและจัดแผนหน้าที่ 4 คนแล้ว ยังรอผลผู้ใช้จริง หลักฐานร่วมงาน และต้นทุนเพื่อปิดหลักฐานด้านคน/ผลกระทบ สถานะเก่าด้านล่างเป็นประวัติก่อน delivery รอบนี้

โค้ดปัจจุบันมี AI Care Brief และ care draft ที่ต้องผู้ใช้ตรวจยืนยันก่อนบันทึก รายการนี้ต้องแยกผลตรวจจาก read-only chatbot และไม่ถือว่า live quality ผ่านจนมีหลักฐาน ดู AC-20–23

## ขอบเขตเพิ่มเติมที่ผู้ใช้อนุมัติ (23 ตุลาคม 2026)

ปรับการเริ่มใช้ บ้าน/สมาชิก โปรไฟล์ Today การแก้งาน ผู้รับผิดชอบ Quick Add ปฏิทิน Baseline/Alerts/Dashboard การติดตามร่วม Timeline/ประวัติ Vet Report กู้คืน และ Settings ตาม [Care experience update](care-experience.md)

AI ในรอบนี้จำกัดเฉพาะถามค้นและสรุปข้อมูลที่มีอยู่พร้อมแหล่งอ้างอิง การร่างบันทึกและสร้าง/แก้ไขกิจวัตรด้วย AI ไม่อยู่ในขอบเขตที่อนุมัติ

## เสร็จแล้ว

- Phase 0–3.5: problem/requirements, PostgreSQL API และ Next.js full-stack MVP
- Phase 4: edit/archive, assignment, notes, filters และ Docker Compose
- Phase 4.5: CI refresh, Calendar, Settings และ in-app notifications
- Phase 4.6: Product Refinement — flexible schedules, Quick Add/templates, occurrence control+Undo, care/health text records, Timeline, Activity Log และ automated E2E
- Phase 4.7: Household safety — Owner-only trash/restore พร้อมรักษาข้อมูล, activity audit และนำ Handover ออกจากผลิตภัณฑ์
- Phase 5: Pet & Wellness Data Foundation — โปรไฟล์สายพันธุ์/เพศ/ทำหมัน/น้ำหนักตั้งต้น และ Health Passport สำหรับแพ้ยา โรค ยา วัคซีน และวันนัด พร้อม Activity/Timeline และ migration 006
- Phase 6: Daily Wellness Log — Quick Check-in แบบเลือกกรอกสำหรับอาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ น้ำหนัก และข้อสังเกต รองรับย้อนหลัง หลายบันทึกต่อวัน Activity/Timeline และ migration 007
- Phase 7: Personal Baseline & Learning Mode — baseline รายสัตว์/ราย metric จาก 14 วันล่าสุด พร้อม progress, source traceability และสถานะข้อมูลไม่เพียงพอแบบ deterministic
- Phase 8: Change Detection & Alerts — กฎการเปลี่ยนแปลง 3 วันต่อเนื่อง, weight threshold 10%, alert lifecycle, หลักฐานย้อนกลับ, Activity/Timeline และข้อความไม่วินิจฉัย
- Phase 9: Wellness Dashboard — สถานะรวม กราฟ baseline/แนวโน้ม 7/14/30/90 วัน, active alerts, missing-day gaps และตารางข้อมูลที่เข้าถึงได้
- Phase 10: Reminders, Shared Monitoring & Vet Report — เตือนวัคซีน/นัดหมายและ follow-up ในเว็บ, มอบหมายการติดตาม Alert ร่วมกัน และรายงานข้อเท็จจริง พร้อม migration 009; ปุ่มดาวน์โหลด PDF สร้างไฟล์ฝั่ง browser โดยตรง
- Phase 11: Grounded AI Chatbot (optional) — เจ้าของบ้านเปิดใช้ AI รายบ้าน สมาชิกยินยอมครั้งเดียวและถอนได้ ถามข้อมูลสัตว์เลี้ยงรายตัวหรือทุกตัวในบ้านย้อนหลัง 7/30/365 วัน พร้อมอ้างอิงข้อมูลต้นทาง ตรวจสิทธิ์และ source ID ที่ server เก็บ audit เฉพาะ metadata และมี fallback เมื่อ Provider ไม่พร้อมใช้งาน; migration 011–014 หน้าสรุป AI แยกถูกนำออกแล้ว

## สถานะปัจจุบัน (23 ตุลาคม 2026)

UX รอบล่าสุดทำแล้ว: กิจวัตรกระชับ ค้นหา/กรอง/แบ่งหน้า คำว่า “ลบ” ทั่ว UI พร้อม confirmation ก่อนเปลี่ยนข้อมูลสำคัญ ไม่มี UI เริ่มต้น/กู้คืน/รูปและติดต่อ/ลิงก์แม่แบบ Quick Add Docker production build/deploy และ health ผ่าน แต่ยังไม่ได้รัน unit/API/E2E ใหม่หลังเพิ่ม confirmation ดู [Care experience](care-experience.md)

Phase 0–11 ในขอบเขตผลิตภัณฑ์ปัจจุบันทำแล้ว ยังไม่มี Phase 12 ที่อนุมัติหรือกำหนดขอบเขตไว้ AI Chatbot เป็นแบบอ่านอย่างเดียว ไม่วินิจฉัยหรือแนะนำยา แต่ละบ้านยังเริ่มโดยปิด AI จนเจ้าของเปิดใน Settings โหมดทดสอบของเครื่องนี้ตั้ง `PAWROUTINE_AI_HOURLY_LIMIT=0`; หากไม่ตั้ง ค่าเริ่มต้นคือ 10 คำขอต่อผู้ใช้ต่อชั่วโมง และโควตาของ Provider ยังมีผล

ผลตรวจล่าสุดวันที่ 20 ต.ค.: unit/API 68/68, Playwright E2E 10 ผ่าน/2 ข้ามตามแพลตฟอร์ม, production build ผ่าน, AI Provider model/completion ตอบ HTTP 200, ดาวน์โหลด PDF จริงผ่าน และ Docker ที่ `localhost:3000` ตอบ health `ok/ok` ดู [สถานะโปรเจกต์](project-status.md) และ [AI Phase 11](ai-phase-11.md)

รายละเอียดที่อนุมัติ: [Pet Wellness Integration Design](superpowers/specs/2026-10-11-pet-wellness-integration-design.md)

## Delivery track

งานส่งมอบที่ยังเหลือ: ประเมินคุณภาพคำตอบ AI กับชุดข้อมูลสังเคราะห์หลายกรณี, ทดสอบใน Course Container, จัดการ Git remote/commit/push ตามที่ผู้ใช้กำหนด, Jenkins/registry และหลักฐานเดโมพร้อม rollback/runbook การทดสอบ local, production image, Compose deploy และ health check ทำแล้ว แต่ยังไม่ใช่การรับรองสภาพแวดล้อม Course Container

## Deferred นอกแผนหลัก

ไฟล์แนบ, email/push, Behavior Coach และ baseline ขั้นสูงตามอายุ/ฤดูกาล; invite expiry/rotation และนำสมาชิกออก/โอนเจ้าของทำแล้ว ส่วน UI รูป/กู้คืนถูกนำออกตามคำขอ ห้ามนำ AI ไปวินิจฉัยหรือคำนวณยา
