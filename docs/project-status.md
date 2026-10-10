# Project Status

อัปเดต 11 ตุลาคม 2026

## สถานะ

Phase 4.7 Household Safety ลงโค้ดแล้ว: Owner ย้ายบ้านไปถังขยะและกู้คืนพร้อมข้อมูลเดิมได้ สมาชิกไม่มีสิทธิ์ บ้านในถังขยะถูกซ่อนและปิดการเข้าถึง พร้อม Activity archive/restore และ migration 005; นำ Handover ออกจาก UI/API แล้ว และเปลี่ยนชื่อ Activity เป็น “ประวัติการเปลี่ยนแปลง”

ผลตรวจล่าสุด: Unit/API 41/41, production build และ Playwright desktop+375px ผ่าน (2 passed, 2 intentionally skipped by project) รวม typed confirmation, การปิด read/mutation ระหว่าง archived และการกู้คืนข้อมูลเดิม Docker health `ok/ok`, หน้าเว็บตอบ 200 และข้อมูลผู้ใช้เดิม 5 รายการยังอยู่ ระบบเปิดสู่ host เฉพาะ `localhost:3000`; PostgreSQL อยู่ใน private Docker network ระบบไม่มี Git repository จึงไม่มี commit/worktree และยังไม่ได้เริ่ม Jenkins/Course Container

Repository cleanup สำหรับเตรียม GitHub เสร็จแล้ว: ลบ legacy/starter/generated artifacts และเอกสาร implementation เก่าที่ไม่ใช้งาน, ลบ component ที่ไม่มี runtime import, เปลี่ยนชื่อไฟล์ที่ยังใช้คำว่า Handover/AI Phase 2 และเพิ่ม ignore rules สำหรับ secrets, build/test output, logs, editor และ agent artifacts โดยยังไม่ได้ initialize Git หรือสร้าง remote แทนผู้ใช้

## พร้อมใช้งาน

Auth, Household collaboration, Owner-only trash/restore, Pets, Routines, Today, Calendar, History, Settings/notifications, Quick Add, text health records, Timeline และประวัติการเปลี่ยนแปลงเชื่อม PostgreSQL จริง Desktop/mobile navigation และ viewport 375px อยู่ใน E2E suite

## รูปแบบการรันที่รับรอง

- URL หลักเพียงจุดเดียว: `http://localhost:3000`
- หน้าเว็บและ API ใช้ origin เดียวกัน จึงไม่ต้องเปิด API port เพิ่ม
- PostgreSQL ไม่เปิด host port ในโหมดปกติและสื่อสารผ่าน Docker network ที่ `db:5432`
- Dev override เปิดฐานข้อมูลเฉพาะ loopback `127.0.0.1:55430` เมื่อจำเป็น
- ข้อมูลเก็บใน named volume และได้รับการยืนยันแล้วว่ายังคงอยู่หลัง recreate

## งานที่ยังไม่อยู่ในรุ่นนี้

- Daily Wellness, baseline 14 วัน, change detection, Wellness Dashboard, Vet Report และ AI/LLM — อนุมัติ design แล้วแต่ยังไม่ implement
- upload รูป/ไฟล์, push/email notifications และคำแนะนำทางการแพทย์
- invite expiry/rotation และการจัดการสมาชิกขั้นสูง
- Jenkins, registry publishing, Course Container และ demo evidence package

## ขั้นถัดไป

Product Refinement พร้อม freeze MVP และอนุมัติ [Pet Wellness Integration Design](superpowers/specs/2026-10-11-pet-wellness-integration-design.md) แล้ว ขั้นถัดไปคือเขียน implementation plan แยก Phase 5 ก่อนเริ่มโค้ด จากนั้นดำเนิน Phase 6–10 ตามลำดับ ส่วน AI อยู่ Phase 11 แบบ optional เมื่อมีเวลา Delivery pipeline เป็น track แยกหลัง freeze ของแต่ละ milestone
