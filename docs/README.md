# เอกสาร PawRoutine

## เริ่มใช้งานและร่วมทดสอบ

- [README และวิธีรัน](../README.md)
- [Environment, AI และโหมดรัน](configuration.md)
- [แนวทางร่วมพัฒนาและส่งงานเข้า main](../CONTRIBUTING.md)
- [คู่มือทีมทดสอบ/ข้อมูลสาธิต/รายงานปัญหา](team-testing.md)
- [สถานะระบบ](project-status.md) และ [การจัดระเบียบไฟล์ล่าสุด](maintenance.md)

ทีมใช้ `main` เป็นจุดเริ่มต้น ผู้ดูแลต้องเผยแพร่รุ่นล่าสุดก่อนให้สมาชิก clone/pull จด `git rev-parse --short HEAD` ทุกครั้งที่รายงานผลทดสอบเพื่อให้ระบุ source ได้ตรงกัน

## ขอบเขตและการออกแบบที่ใช้ปัจจุบัน

- [Requirements](requirements.md) · [Acceptance Criteria](acceptance-criteria.md)
- [User flow](user-flow.md) · [UX/UI](ux-ui.md) · [Popup fields](popup-fields.md)
- [Architecture](architecture.md) · [API](api-design.md) · [Database](database-design.md)
- [Care experience](care-experience.md) · [AI](ai-phase-11.md) · [Brand](brand-system.md)

## ส่งมอบและรายวิชา

[Delivery index](delivery/README.md) รวม runbook, Course/Jenkins, traceability, report, slides และหลักฐาน ผลรอบเก่ามี commit/build กำกับ ไม่ใช้แทนการตรวจ source หลังเปลี่ยนแปลง

## ประวัติการออกแบบ

`superpowers/plans/`, `superpowers/specs/` และ [Project memory](project-memory.md) เก็บที่มา/การตัดสินใจในอดีต อาจมีข้อเสนอที่ถูกแทนแล้ว ไม่ใช่ขั้นตอนติดตั้งหรือสถานะล่าสุด ให้ยึด README, requirements/AC, project-status และหลักฐานที่ตรง source เป็นหลัก [ผล local วันที่ 27 ต.ค.](delivery-verification.md) เป็นประวัติประกอบ
