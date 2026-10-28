# คู่มือทบทวนงานและคำถามตอบของทีม

ใช้ประกอบการเตรียมนำเสนอ ไม่ใช่บันทึกว่าสมาชิกได้ทบทวนหรือทำงานเหล่านี้ครบแล้ว แต่ละคนใช้เวลาทบทวนส่วนของตนและซ้อมจากระบบจริงก่อนส่งงาน

## ฐิติภัทร ไร่พันพ่าย — Frontend / UX

เปิด Today, Calendar, Quick Add และขนาด 375px อธิบาย state loading/error/empty และการยืนยันก่อนเปลี่ยนข้อมูล อ่าน `features/today`, `features/calendar`, `features/quick-add`, `components/ConfirmationProvider.jsx`

- **ทำไมต้อง confirmation?** ให้ผู้ใช้ตรวจการเปลี่ยนแปลงสำคัญก่อนส่ง mutation; Cancel ต้องไม่ส่งคำขอบันทึก
- **การเลื่อนงานกระทบกิจวัตรทั้งหมดหรือไม่?** การแก้ occurrence เปลี่ยนเฉพาะครั้งนั้น; การแก้ routine เป็นอีก flow และมีสิทธิ์ต่างกัน
- **ทำไม E2E ต้องหา option ที่ระดับ page?** Select/date picker บางส่วนใช้ portal จึง render นอก card เดิม
- **หลักฐาน mobile คืออะไร?** มี E2E ที่ viewport 375px และตรวจ overflow/เมนู ไม่อ้างว่าทดสอบทุกอุปกรณ์แล้ว

ซ้อม: ทำงานเสร็จ → ยกเลิก/ยืนยัน → Undo → เปิด Calendar → เปลี่ยนผู้รับผิดชอบเฉพาะครั้ง

## ภาษณฑ์ ศิวธนเณศ — Backend / Database

อ่าน `app/api/v1/[...path]/route.js`, `lib/services/task-service.js`, `transaction.js`, `access-service.js`, `db/migrations.mjs` และ wellness engines

- **กันคำขอซ้ำอย่างไร?** Idempotency key เดิมกับ payload เดิมให้ผลเดิม ส่วน payload ที่ขัดกันตอบ conflict ตามกติกา
- **กันการแก้ทับอย่างไร?** ใช้ version กับ transaction/row locks เมื่อข้อมูลเปลี่ยนก่อน client เก่าต้องโหลดสถานะใหม่
- **ทำไม audit ต้องอยู่ transaction เดียวกัน?** ให้ข้อมูลผลิตภัณฑ์กับประวัติสำเร็จหรือ rollback พร้อมกัน
- **Baseline/Alert เป็น diagnosis หรือไม่?** เป็นการคำนวณจากข้อมูลที่กรอกและกฎที่กำหนด แสดง source และ missing data โดยไม่วินิจฉัย
- **แก้ปัญหา clean DB อย่างไร?** Runtime และ full-schema tests ใช้ migration set เดียวกัน ป้องกันรายชื่อ migration ใน tests ล้าหลัง

ซ้อม: แสดงหนึ่ง request ตั้งแต่ token/membership → service → SQL → response และกรณี 403/409

## วศิน จันทร์ก้อน — QA / Research

อ่าน acceptance-criteria, traceability, test logs, problem-evidence และ user-validation

- **76/76 หมายถึงอะไร?** จำนวน test cases ที่ runner รายงานในชุด unit/API ที่รัน ไม่ใช่ coverage 100% ของระบบ
- **ทำไม E2E มี 4 skip?** บาง flow กำหนดเฉพาะ desktop หรือ mobile จึงข้าม counterpart ตาม project; อธิบายจาก test.skip ในไฟล์ได้
- **Mocked AI กับ live evaluation ต่างกันอย่างไร?** Mock ตรวจ business rules/error paths ส่วน live synthetic ตรวจ provider ในกรณีตัวอย่าง ยังไม่รับรองทุกคำตอบ
- **บทสัมภาษณ์จำลองใช้เป็นผลจริงได้หรือไม่?** ใช้ซ้อมและตั้งสมมติฐาน ผลจริงต้องเก็บจากคนจริงหรืออ้างแหล่งวิจัยภายนอกตามขอบเขตของแหล่งนั้น
- **วัดผลลืมงานจาก overdue ได้เลยหรือไม่?** ต้องถามยืนยัน เพราะ overdue อาจเป็นการเลื่อนหรือไม่ได้บันทึก

ซ้อม: เลือก AC หนึ่งข้อ → เปิด implementation → test/result → limitation แล้วอธิบายกรณีล้มเหลว

## ชวเลิศ สาวิตรตระกูล — DevOps / AI Integration

อ่าน Jenkinsfile, compose files, delivery.sh, architecture และ AI prompts/services

- **ทำไมต้อง Course Container?** เป็นสภาพแวดล้อม formal verification ของรายวิชา โครงการรันผ่าน nested Docker daemon ภายในกล่อง
- **Pipeline ผ่านจากอะไร?** Checkout revision → audit/tests/build/E2E → image ตาม SHA → registry push/pull → deploy/health/smoke → backup/restore
- **Volume ต่างจาก backup อย่างไร?** Volume เก็บข้อมูลข้าม container recreation ส่วน backup เป็น snapshot ที่นำไปกู้ใน DB/ระบบใหม่ได้
- **Rollback ย้อน DB หรือไม่?** คำสั่งคืน web image ไม่ย้อน schema ต้องตรวจ migration compatibility และมีแผน restore แยก
- **AI key อยู่ที่ใด?** Server environment/private config นอก Git และ image; browser ได้ผลลัพธ์ ไม่ได้ key
- **Source ID ถูกต้องรับรองคำตอบทุกประโยคหรือไม่?** Parser ตรวจ allowlist/รูปแบบ แต่ความถูกต้องด้านเนื้อหายังต้องประเมิน provider และอ่านคำตอบจริง

ซ้อม: เปิด build result/image revision → health → backup/recovery และอธิบายเมื่อ provider timeout/ข้อมูลไม่พอ

## ตรวจรับโดยสมาชิกก่อนนำเสนอ

| สมาชิก | เปิดส่วนที่รับผิดชอบและอธิบาย flow ได้ | ซ้อม failure case | วัน/หลักฐานทบทวน |
|---|---|---|---|
| ฐิติภัทร ไร่พันพ่าย | รอตรวจด้วยตนเอง | รอตรวจด้วยตนเอง | — |
| ภาษณฑ์ ศิวธนเณศ | รอตรวจด้วยตนเอง | รอตรวจด้วยตนเอง | — |
| วศิน จันทร์ก้อน | รอตรวจด้วยตนเอง | รอตรวจด้วยตนเอง | — |
| ชวเลิศ สาวิตรตระกูล | รอตรวจด้วยตนเอง | รอตรวจด้วยตนเอง | — |

ผู้ช่วยไม่ได้ลงชื่อหรือยืนยันการทบทวนแทนสมาชิก ให้แต่ละคนเติมหลังทำจริงและใช้บันทึกนี้เป็นหลักฐาน contribution รอบเตรียมส่ง
