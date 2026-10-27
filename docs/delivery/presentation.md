# ต้นฉบับชุดนำเสนอ PawRoutine

สไลด์ HTML: `presentation.html` ทุกคำกล่าวอ้างต้องตรงกับผลล่าสุดใน course-results.md และ commit ที่ส่ง ข้อความ Pending เป็นสิ่งที่ยังไม่มีหลักฐาน ไม่ควรลบทิ้งก่อนนำเสนอ

## 1 — PawRoutine / PetRoutine

ระบบดูแลงานประจำวันและสุขภาวะสัตว์เลี้ยงร่วมกันในบ้าน

Notes: ใช้ชื่อ repository PawRoutine; UI ปัจจุบันใช้แบรนด์ PetRoutine เติมสมาชิกจากข้อมูลจริงใน team-and-ai-disclosure.md เรื่องหลักคือผู้ดูแลสองคนรู้ว่าใครให้อาหารแล้ว

## 2 — ปัญหาและหลักฐาน

ข้อมูลกระจายในแชต/ความจำทำให้ตรวจสถานะงานยาก สมมติฐานคือเกิดการลืมและทำงานซ้ำ

Notes: ยังไม่มีผลสัมภาษณ์จริง ห้ามบอกความชุก/เปอร์เซ็นต์ ใช้ protocol ใน user-validation.md และแทนที่ Pending ด้วยหลักฐานพร้อมแหล่งที่มาเมื่อเก็บแล้ว

## 3 — กลไกของ Solution

Shared Today → เห็นผู้รับผิดชอบและสถานะ; audit/Undo → ตรวจและแก้ความผิดพลาด; wellness/source → ดูแนวโน้มจากข้อมูลที่บันทึก

Notes: ผลต่อการลืมงานยังเป็นสมมติฐาน ส่วนการบันทึกและแสดงสถานะเป็นความสามารถที่ทดสอบได้

## 4 — ผู้ใช้และสิทธิ์

Owner จัดการบ้าน/สมาชิก/กิจวัตร สมาชิกบันทึกงานร่วมกันและดูข้อมูลในบ้านตนเอง รายงานใช้ประกอบการคุยกับสัตวแพทย์

Notes: ไม่อ้างว่ามีคลินิกเป็น partner หรือระบบแพทย์ login หากไม่มีจริง

## 5 — ผลกระทบและวิธีวัด

วัดอัตรางานลืม งานซ้ำ และเวลาตรวจประวัติก่อน/หลังทดลอง แยกจำนวนบันทึกออกจากผลลัพธ์ต่อผู้ใช้

Notes: แผน 7+7 วันและ sample 5–8 คนเป็นข้อเสนอ ยังไม่มีผลทดลอง ไม่ใช่ clinical outcome

## 6 — ทีมและการมีส่วนร่วม

แสดงหน้าที่จริงพร้อม Issue/PR/ผลทดสอบหรือหลักฐานวิจัย สมาชิกอธิบาย flow ที่ตนรับผิดชอบได้

Notes: ข้อมูลทีมยังรอผู้ใช้ ไม่ใช้ automation snapshot เป็นหลักฐานแบ่งงาน

## 7 — ต้นทุนและการดำเนินงานต่อ

Compute/DB + backup + AI usage + maintenance; AI optional ช่วยจำกัด vendor dependency

Notes: ยังไม่มีราคาจริงหรือโมเดลรายได้ที่พิสูจน์แล้ว Shared-care/source traceability เป็นจุดต่าง ยังไม่ยืนยัน unfair advantage

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

Local เดิม: unit/API 76/76; E2E 14 ผ่าน 4 skip ตามแพลตฟอร์ม; AI provider 4/5 โดยหนึ่ง timeout ผล Course/Jenkins ใช้บันทึกที่ตรวจจริงล่าสุด

Notes: ผล local 27 ต.ค. 2026 ไม่ใช่ผล Course ใหม่ ห้ามสรุป AI quality ผ่านครบจาก mocked tests

## 12 — งานที่ต้องยืนยันก่อนส่ง

ผู้ใช้จริง/ผลกระทบ ทีม/ต้นทุน และ checkout รุ่นส่งต้องมีหลักฐาน ข้อจำกัด AI และงานที่ deferred เปิดเผยตามจริง

Notes: ถ้ารอบใหม่ผ่านให้ปรับจากผลจริงพร้อมวันที่/commit ไม่ลบ defect โดยไม่มีหลักฐานแก้

แหล่งอ้างอิงข้อกำหนด: https://github.com/Tuchsanai/DevTools/blob/main/Mini_Project/project-details/README.md
