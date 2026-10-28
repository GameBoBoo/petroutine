# ต้นฉบับชุดนำเสนอ PawRoutine

สไลด์ HTML: `presentation.html` ทุกคำกล่าวอ้างต้องตรงกับผลล่าสุดใน course-results.md และ commit ที่ส่ง ข้อความ Pending เป็นสิ่งที่ยังไม่มีหลักฐาน ไม่ควรลบทิ้งก่อนนำเสนอ

## 1 — PawRoutine / PetRoutine

ระบบดูแลงานประจำวันและสุขภาวะสัตว์เลี้ยงร่วมกันในบ้าน

Notes: ใช้ชื่อ repository PawRoutine; UI ปัจจุบันใช้แบรนด์ PetRoutine เติมสมาชิกจากข้อมูลจริงใน team-and-ai-disclosure.md เรื่องหลักคือผู้ดูแลสองคนรู้ว่าใครให้อาหารแล้ว

## 2 — ปัญหาและหลักฐาน

ข้อมูลกระจายในแชต/ความจำทำให้ตรวจสถานะงานยาก สมมติฐานคือเกิดการลืมและทำงานซ้ำ

Notes: มีงานภายนอก Odom et al. 2024 พบ noncompliance 71/151 ใน sample คลินิกนิวซีแลนด์ ตัวเลขนี้รวมหลายสาเหตุ ไม่ใช่อัตราลืมของผู้ใช้เรา ดู https://pubmed.ncbi.nlm.nih.gov/39272342/ และ problem-evidence.md ยังไม่มีผลสัมภาษณ์จริง ใช้ protocol ใน user-validation.md

## 3 — กลไกของ Solution

Shared Today → เห็นผู้รับผิดชอบและสถานะ; audit/Undo → ตรวจและแก้ความผิดพลาด; wellness/source → ดูแนวโน้มจากข้อมูลที่บันทึก

Notes: ผลต่อการลืมงานยังเป็นสมมติฐาน ส่วนการบันทึกและแสดงสถานะเป็นความสามารถที่ทดสอบได้

## 4 — ผู้ใช้และสิทธิ์

Owner จัดการบ้าน/สมาชิก/กิจวัตร สมาชิกบันทึกงานร่วมกันและดูข้อมูลในบ้านตนเอง รายงานใช้ประกอบการคุยกับสัตวแพทย์

Notes: ไม่อ้างว่ามีคลินิกเป็น partner หรือระบบแพทย์ login หากไม่มีจริง

## 5 — ผลกระทบและวิธีวัด

วัดอัตรางานลืม งานซ้ำ และเวลาตรวจประวัติก่อน/หลังทดลอง แยกจำนวนบันทึกออกจากผลลัพธ์ต่อผู้ใช้

Notes: แผน 7+7 วันกับ 10 ครัวเรือนเป็นข้อเสนอ; เป้าหมายลดงานพลาด 20% relative, ทำงานสำเร็จ 80%, หาประวัติเร็วขึ้น 30%, เข้าใจ Alert 80% ยังไม่ใช่ผลที่วัดได้ ยังไม่มีผลทดลอง ไม่ใช่ clinical outcome

## 6 — ทีมและการมีส่วนร่วม

ฐิติภัทร ไร่พันพ่าย — Frontend/UX; ภาษณฑ์ ศิวธนเณศ — Backend/Database; วศิน จันทร์ก้อน — QA/User Research; ชวเลิศ สาวิตรตระกูล — DevOps/AI Integration

Notes: รายชื่อได้รับจากผู้ใช้ หน้าที่เป็นแผนที่จัดสำหรับการตรวจทาน/ส่งมอบ/นำเสนอ หลักฐานการมีส่วนร่วมในงานเดิมต้องเติมตามจริง มีบทสัมภาษณ์จำลองสำหรับซ้อมใน interview-rehearsal.md แยกจากผลผู้ใช้จริง

## 7 — ต้นทุนและการดำเนินงานต่อ

Compute/DB + backup + AI usage + maintenance; AI optional ช่วยจำกัด vendor dependency

Notes: งบวางแผน local 421.08 บาท/เดือน หรือ cloud app/DB + local CI 1,529.88 บาท รวมเผื่อ 10% และ AI 300 บาท; รวมมูลค่าแรงเป็น 1,621.08/2,729.88 บาท ราคา DigitalOcean 24 USD + weekly backup 20% ส่วน FX 35 บาท/USD และค่าอื่นเป็นสมมติฐาน ดู budget-assumptions.json ไม่ใช่รายจ่ายหรือรายได้จริง Shared-care/source traceability เป็นจุดต่าง ยังไม่ยืนยัน unfair advantage

## 8 — Architecture ของระบบจริง

Browser → Next.js API → authorization/service/transaction → PostgreSQL; AI เป็นเส้นทาง optional ผ่าน validation/consent

Notes: เปิด architecture.md อธิบาย JSON/HTTPS, SQL transaction, version/idempotency และเมื่อปลายทางล้มเหลว

## 9 — Live Demo

ผู้ดูแลสองคน: สร้างงาน → ยืนยันเสร็จ → Timeline → Undo → เช็กอิน/Alert source → Vet Report

Notes: ใช้ demo-script.md และข้อมูล synthetic แสดง failure อย่างน้อยเรื่อง permission/conflict/cancel เปิด PDF จริง

## 10 — Delivery ใน Course Container

Git checkout → Jenkins → tests/build/E2E → image/registry → Compose → health/smoke → backup/restore

Notes: เปิด Jenkins build จริงและ course-results.md ไม่ใช้ภาพแทน formal verification ต้องระบุ snapshot/commit ให้ตรง

## 11 — หลักฐานและข้อจำกัด

Course Jenkins #8: audit ผ่าน, unit/API 76/76, E2E 14 ผ่าน 4 skip; AI live synthetic Chat 5/5 และ Draft 3/3 ดู revision fde294f กับผลจริงใน course-results.md

Notes: ผล local 27 ต.ค. 2026 ไม่ใช่ผล Course ใหม่ ห้ามสรุป AI quality ผ่านครบจาก mocked tests

## 12 — งานที่ต้องยืนยันก่อนส่ง

มีรายงาน 7 มิติ งบวางแผน และแพ็กเกจ source/หลักฐาน; revision สุดท้ายดู manifest ใน ZIP ผลผู้ใช้จริงและการยืนยันผลงานสมาชิกยังรอตรวจ ข้อจำกัด AI และงานที่ deferred เปิดเผยตามจริง

Notes: ถ้ารอบใหม่ผ่านให้ปรับจากผลจริงพร้อมวันที่/commit ไม่ลบ defect โดยไม่มีหลักฐานแก้

แหล่งอ้างอิงข้อกำหนด: https://github.com/Tuchsanai/DevTools/blob/main/Mini_Project/project-details/README.md
