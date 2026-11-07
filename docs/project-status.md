# Project Status — 7 พฤศจิกายน 2569

สถานะปัจจุบันและผลแยกตาม revision อยู่ใน [Current release](current-release.md) ล่าสุดอ้างอิง source `512009f` ไม่ได้นำ full-suite ของรุ่นก่อนมายืนยัน UI รุ่นนี้โดยอัตโนมัติ

## รุ่นปัจจุบัน

Full-suite baseline `c802bd8` ใน Course Jenkins #5 ผ่าน Unit/API 98/98 และ E2E 18/4 platform skips ก่อน UI รอบหลัง; UI header/context management ที่ `c97a4a8` ตรวจ 7 ส่วนทั้ง desktop/mobile และ static 7/7; บ้านและสมาชิกที่ `512009f` ตรวจ Owner/Member ทั้งสอง viewport 4 กรณีและ static 2/2 ผ่าน Build/deploy local ผ่าน ผลนี้ไม่ใช่ full-suite ใหม่ของ source ล่าสุด

## บันทึกย้อนหลังของรุ่นเดิม

การแก้ไขล่าสุดและวิธีอ่านผลรุ่นส่งอยู่ใน [Audit fixes 6 พฤศจิกายน 2569](delivery/audit-fixes-20261106.md) เนื้อหาด้านล่างเก็บประวัติของ revision ที่ระบุไว้

PawRoutine (UI: PetRoutine) มีระบบ Auth/Household/Pets/Routines, Today/Calendar, wellness logs/baseline/alerts/dashboard, Health Passport, shared follow-up, Timeline/Vet Report และ optional AI chatbot/Care Brief/care draft ที่ผู้ใช้ต้องตรวจยืนยันก่อนบันทึก

## สำหรับสมาชิกที่เริ่มทดสอบ

อ่าน [README](../README.md) เพื่อ clone/setup/run และ [Team testing](team-testing.md) สำหรับ checklist/ข้อมูลสังเคราะห์/รายงานปัญหา ฐานข้อมูลและ .env ของแต่ละเครื่องแยกกัน AI ปิดเป็นค่าเริ่มต้น

งาน cleanup ถูกรวมเข้า `main` แล้วในเครื่อง ใช้ main สำหรับแจกให้ทีมทดสอบหลังผู้ดูแล push ดู [Configuration](configuration.md) เมื่อต้องเปลี่ยนพอร์ตหรือเปิด AI และ [Contributing](../CONTRIBUTING.md) เมื่อต้องแก้โค้ด

## หลักฐานการตรวจ

การตรวจ main commit `9431350` ยืนยัน audit/build, unit/API 76/76, E2E 14 ผ่าน/4 platform skips และ browser tests บน production image 12 ผ่าน/4 platform skips พร้อม restart/restore และ AI network stub ดู [สรุปผลทดสอบ](testing.md) รอบนี้ยังไม่ยืนยัน provider จริง

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
