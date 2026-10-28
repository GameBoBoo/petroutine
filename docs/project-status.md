# Project Status — 28 ตุลาคม 2026

PawRoutine (UI: PetRoutine) มีระบบ Auth/Household/Pets/Routines, Today/Calendar, wellness logs/baseline/alerts/dashboard, Health Passport, shared follow-up, Timeline/Vet Report และ optional AI chatbot/Care Brief/care draft ที่ผู้ใช้ต้องตรวจยืนยันก่อนบันทึก

## สำหรับสมาชิกที่เริ่มทดสอบ

อ่าน [README](../README.md) เพื่อ clone/setup/run และ [Team testing](team-testing.md) สำหรับ checklist/ข้อมูลสังเคราะห์/รายงานปัญหา ฐานข้อมูลและ .env ของแต่ละเครื่องแยกกัน AI ปิดเป็นค่าเริ่มต้น

งาน cleanup ถูกรวมเข้า `main` แล้วในเครื่อง ใช้ main สำหรับแจกให้ทีมทดสอบหลังผู้ดูแล push ดู [Configuration](configuration.md) เมื่อต้องเปลี่ยนพอร์ตหรือเปิด AI และ [Contributing](../CONTRIBUTING.md) เมื่อต้องแก้โค้ด

## หลักฐานการตรวจ

หลัง cleanup: audit/build ผ่าน, unit/API **76/76**, E2E **14 ผ่าน / 4 platform skips / 0 ล้มเหลว**, fresh Compose startup/health/API smoke และ stop/start persistence ผ่านใน project ใหม่ภายใน Course ดู [ผลและ source hashes](delivery/evidence/team-cleanup-verification.json) เป็นการตรวจ working-tree snapshot ไม่ใช่ Jenkins run ใหม่

Baseline ก่อน cleanup คือ Jenkins #10 ที่ commit 9d6ef80: Next.js 15.5.28, audit/build ผ่าน, unit/API 76/76 และ E2E 14 ผ่าน/4 platform skips ภายใน tuchsanai/devtools:2569_1 พร้อม image push-pull/deploy/health/smoke/restore ผลหลัง cleanup ดู [Maintenance](maintenance.md) ไม่ใช้ผลเก่ามาติดป้ายว่ารุ่นใหม่ผ่าน

ผล live-provider synthetic Chat 5/5 และ Draft 3/3 เป็นรอบแยกบน host ไม่ใช่ clinical validation หรือหลักฐาน production adapter ผ่าน app จริงใน Course ทั้งเส้นทาง

## งานที่ยังต้องยืนยัน

- ผลสัมภาษณ์/ทดลองใช้จริงและ outcome; บทสัมภาษณ์จำลองเป็นบทซ้อมเท่านั้น
- การทบทวนและผลงานสมาชิกจริง รายชื่อ/แผนหน้าที่ 4 คนมีแล้ว
- GitHub รุ่นล่าสุดและ trigger ไป Jenkins; ผู้ใช้จะ push เอง
- ต้นทุนที่จ่ายจริง/ผู้สนับสนุน/partnership; งบวางแผนพร้อมสูตรมีแล้ว
- Proposal/การยอมรับ scope change ของผู้สอน หากมีข้อตกลงนอก workspace

รอบจัดระเบียบไฟล์ลบโค้ด/asset ที่ไม่มีผู้เรียกและ SQL seed ที่ TRUNCATE ตาราง ไม่ลบ migrations หรือ backend audit ที่ยังใช้ รุ่น ZIP/tag เก่าคงไว้เป็น snapshot ตามหลักฐานเดิม รายละเอียดการแก้อยู่ [Maintenance](maintenance.md)
