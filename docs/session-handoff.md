# ส่งต่องานให้ทีม

อัปเดต 28 ตุลาคม 2026

1. เริ่มติดตั้งจาก [README](../README.md) และสร้าง `.env` ของตนด้วย `node scripts/setup-local.mjs`
2. ทดสอบตาม [คู่มือทีม](team-testing.md) และบันทึกผลพร้อม commit จริง
3. อ่าน [สถานะ](project-status.md), [Architecture](architecture.md) และ [AC](acceptance-criteria.md) ก่อนแก้โค้ด
4. งานส่งมอบมีผล baseline Jenkins #10 ที่ commit 9d6ef80 ก่อน cleanup; ผลหลัง cleanup ดู [Maintenance](maintenance.md)
5. เก็บ secret/dump ไว้เฉพาะในเครื่อง ไม่มีข้อมูลผู้ใช้จริงหรือผลสัมภาษณ์จริงแนบให้ทีม

รุ่นสำหรับร่วมทดสอบใช้ `main` แล้ว อ่าน [Configuration](configuration.md) สำหรับ env/พอร์ต และ [Contributing](../CONTRIBUTING.md) สำหรับ workflow แก้ไขและ review ผลหลัง cleanup ผ่าน unit/API 76/76 และ E2E 14 ผ่าน/4 platform skips พร้อมเปิดระบบจาก DB ใหม่และตรวจข้อมูลหลัง stop/start หลักฐานอยู่ใน Maintenance

Phase 0–11 มี implementation ตามขอบเขตปัจจุบัน AI รวม read-only chatbot และ care draft ที่ต้องตรวจยืนยันก่อนบันทึก ไม่ใช่การวินิจฉัย Course delivery ปิด provider จริงเป็นค่าเริ่มต้น มี mock tests และ live synthetic evaluation แยก environment ต้องไม่กล่าวว่าเป็น integration จริงครบทุกเส้นทางใน Course

หน้าประวัติ Activity แยกไม่ได้เปิดใช้แล้ว แต่ immutable activity/audit ใน backend ยังจำเป็นต่อ transaction และ Undo Migration ทุกไฟล์ต้องเก็บไว้สำหรับฐานข้อมูลใหม่และอัปเกรดข้อมูลเดิม

ผลผู้ใช้จริง การยืนยันผลงานสมาชิก และ GitHub trigger ของรุ่นส่งยังต้องมีหลักฐานจริง ไม่ใช้บันทึก handoff หรือชื่อบทบาทแทนหลักฐานเหล่านั้น
