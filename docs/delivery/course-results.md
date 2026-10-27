# ผลส่งมอบและตรวจ Course — 28 ตุลาคม 2026

ตรวจจริงใน `tuchsanai/devtools:2569_1` ด้วย nested Docker daemon Source ที่ยืนยันด้าน runtime คือ `1bf3dc6372ca5cf25e9400f445e10435cd90e445` และ Jenkins build **#7 SUCCESS** ผลเครื่องเดิมวันที่ 27 ต.ค. เป็นประวัติประกอบ

## ผลที่ยืนยันแล้ว

| รายการ | ผลจริง |
|---|---|
| Production dependency audit | ผ่าน high/critical gate หลัง patch Next.js เป็น 15.5.28 |
| Unit/API | 76/76 ผ่าน, 0 ล้มเหลว บน clean testdb |
| Production build | ผ่าน |
| E2E | 14 ผ่าน, 4 ข้ามตาม desktop/mobile, 0 ล้มเหลว |
| Jenkins/registry | Build #7 ผ่าน; image tag ตาม full commit; publish ไป registry ภายใน Course |
| Deploy/health/API smoke | ผ่าน health/database, ปฏิเสธ unauthenticated access, landing, register, สร้างบ้าน/สัตว์ และอ่านสัตว์ |
| Backup/recovery | PASS backup checksum, pg_restore, core row counts=6|5|5|1; restored database=recovery_20261027180943 |
| Live AI chatbot | synthetic 5/5 พร้อมตรวจ source/date และอ่านคำตอบจริง |
| Live AI draft | synthetic 3/3; ไม่บันทึก record |
| Host entry point | ตรวจจาก host ที่ port 3300 ได้ หลังแก้ nested bind address |

[สรุป JSON พร้อม image ID](evidence/course-verification.json) · [Jenkins ล่าสุด](http://127.0.0.1:38080/job/PawRoutine-delivery/lastSuccessfulBuild/) · [เว็บ Course](http://127.0.0.1:3300)

Registry และ Jenkins ชุดนี้เป็น local ภายใน Course ไม่ใช่บัญชี cloud ของทีม SCM polling เริ่ม build #5 และ #6 อัตโนมัติด้วย `Started by an SCM change` และ build #1 แสดงว่า tests ที่ไม่ผ่านทำให้ stage publish/deploy ถูกข้าม

## Demo และหลักฐาน

เตรียมบัญชี Owner/Member, บ้านและสัตว์สมมติ, กิจวัตร, wellness 17 วัน, กำหนดสุขภาพและ shared follow-up ผ่าน API จริง รหัสสุ่มอยู่ใน `artifacts/demo-access.json` และ Jenkins admin อยู่ใน `.delivery-build/jenkins-private.env` ทั้งสองไฟล์ถูก ignore และไม่อยู่ใน Git

[Today](evidence/today.png) · [Calendar](evidence/calendar.png) · [กิจวัตร](evidence/routines.png) · [Follow-up](evidence/shared-follow-up.png) · [AI consent E2E](evidence/ai-consent.png) · [PDF ข้อมูลสมมติ](evidence/vet-report-synthetic.pdf)

PDF ถูก render และดูจริงทั้ง desktop/mobile อ่านข้อมูลไทยได้; เป็น raster PDF และอาจมีพื้นที่ว่างระหว่าง section การแสดง HTML/table ยังเป็นแหล่งอ่านข้อมูลที่เข้าถึงได้กว่า ไม่อ้างว่า PDF เป็น tagged/searchable document

ผล rollback/image switch และการตรวจข้อมูลเดโมหลังสลับรุ่นอยู่ใน `artifacts/rollback-summary.json` เมื่อซ้อมเสร็จ ใช้ [Recovery runbook](operations-and-recovery.md) สำหรับทำซ้ำ การคืน image ไม่ย้อน schema อัตโนมัติ

## Defect และการแก้

1. Clean precheck: 66 ผ่าน/10 ไม่ผ่าน เพราะ full-schema test setup ขาด migration 017 จึงเพิ่ม `db/migrations.mjs` ให้ runtime/tests/E2E ใช้รายการเดียวกัน ผล local เดิมมีโอกาสอ่านตารางจาก public จึงใช้แทน isolated verification ไม่ได้
2. Jenkins #2–3 พบชื่อ PDF เป็น `download` บน Linux Chromium Minimal Blob reproduction ยืนยันว่าชื่อ ASCII ถูกต้องแต่ชื่อไทยถูกทิ้ง จึงใช้ ASCII slug หรือ pet ID ในชื่อไฟล์ โดยเนื้อหารายงานยังเป็นไทย
3. ตรวจ PDF จริงพบหัวข้อคาบหน้าใน mobile จึงเพิ่ม page-break protection; มีพื้นที่ว่างระหว่าง section เป็นข้อจำกัดที่เปิดเผย
4. Auto AI เดิมให้ผ่าน 5/5 แต่ manual review พบปี 2526 ไม่ตรง source จึงแชร์ production prompt กับ evaluator เพิ่มการตรวจปี/ISO date และให้คัดวันที่จากหลักฐาน รอบแก้ผ่าน 5/5
5. Nested web เดิม bind loopback ของ Course ทำให้ host เข้าไม่ได้ จึงตั้ง bind ภายในเป็น 0.0.0.0 และจำกัดชั้น host ที่ 127.0.0.1:3300
6. npm พบ advisory ของ Next.js 15.5.27 จึง patch 15.5.28 และเพิ่ม audit เป็น gate ก่อน test/build/deploy [Release ผู้ดูแล](https://github.com/vercel/next.js/releases/tag/v15.5.28)

## สิ่งที่ยังต้องมาจากข้อมูลจริง

- ผลสัมภาษณ์/ทดลองใช้และ outcome ของ PawRoutine ยังไม่มี มี protocol, CSV template และงานวิจัยภายนอกพร้อมข้อจำกัด
- รายชื่อสมาชิก หน้าที่ และหลักฐานร่วมงานยังรอผู้ใช้ ไม่มีการสร้างข้อมูลแทน
- ต้นทุน/ผู้จ่าย/partnership ยังเป็นแบบวางแผน ไม่อ้างว่ามีรายได้หรือพันธมิตรจริง
- เก็บ Git commits ในเครื่องตามคำขอ ยังไม่ push branch ไป remote

## Source และการทำซ้ำ

Branch local: `delivery/course-verification-20261028` ตรวจ runtime ที่ `1bf3dc6` เอกสาร/ภาพหลักฐานอาจถูกบันทึกเป็น commit ถัดไปโดยไม่มีการเปลี่ยน runtime; ใช้ revision ใน Jenkins artifact เพื่อเลือก checkout ที่ตรงกับผลตรวจ

ดู [Course/Jenkins](course-and-ci.md), [Traceability](traceability.md), [Demo script](demo-script.md), [สไลด์ 12 หน้า](presentation.html) และ [ข้อจำกัด](known-limitations.md) Raw logs/evidence/backup อยู่ใน artifacts ที่ถูก ignore ไม่คัด database dump หรือ credentials เข้า repository
