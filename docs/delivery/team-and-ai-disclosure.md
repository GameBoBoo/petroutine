# ทีม การมีส่วนร่วม และ AI disclosure

## สมาชิกและการแบ่งหน้าที่

รายชื่อมาจากผู้ใช้ การแบ่งหน้าที่ต่อไปนี้กำหนดสำหรับการตรวจงาน ส่งมอบ และนำเสนอรอบนี้ หลักฐานการมีส่วนร่วมในงานที่ผ่านมาต้องเติมจากงานที่แต่ละคนทำจริง

| ชื่อสมาชิก | หน้าที่ | หลักฐานที่ต้องเตรียม | ส่วนที่รับผิดชอบในการนำเสนอ |
|---|---|---|---|
| ฐิติภัทร ไร่พันพ่าย | Frontend และ UX/UI: Today, Calendar, Quick Add, responsive และ confirmation | หน้าจอ/flow ที่ตรวจทาน รายการปัญหา UI และการแก้ที่ร่วมทำ | สาธิตผู้ดูแลสองคน การบันทึกงาน และ mobile flow |
| ภาษณฑ์ ศิวธนเณศ | Backend และ Database: API, สิทธิ์รายบ้าน, transaction, migration และกติกา wellness | API/DB diagram, ตัวอย่าง permission/conflict และงานที่ตรวจทานหรือแก้จริง | อธิบาย UI → API → service → PostgreSQL และความถูกต้องของข้อมูล |
| วศิน จันทร์ก้อน | QA และ User Research: test cases, traceability, สัมภาษณ์/ทดลองใช้ และตัวชี้วัดผลกระทบ | ผลทดสอบ/defect, บันทึกสัมภาษณ์จริงเมื่อเก็บ และตาราง AC | อธิบายปัญหา วิธีตรวจ ผลที่ยืนยันได้ และข้อจำกัด |
| ชวเลิศ สาวิตรตระกูล | DevOps และ Integration/AI: Docker, Jenkins, Course deploy, recovery และ AI data flow/guardrails | Pipeline/log/image revision, ผล backup/restore และหลักฐานตรวจ AI | สาธิต CI/CD, health/recovery และอธิบายการใช้ AI/การจัดการ secret |

สมาชิกแต่ละคนตรวจทานส่วนของตนและเชื่อมกับระบบรวมก่อนนำเสนอ ใช้ Issue/PR/commit หรือบันทึกการตรวจทานจริงประกอบ ส่วน Git snapshot ของ automation ใช้ยืนยันเวอร์ชันระบบ

## การใช้ AI ที่ยืนยันจาก session นี้

ใช้ Codex ช่วยอ่านโค้ด/ข้อกำหนด แก้ automated tests เตรียม Docker/Jenkins scripts เอกสารและสื่อนำเสนอ และสั่งตรวจผลผ่านเครื่องมือ ผลงานจาก AI ยังต้องผ่าน review และสมาชิกต้องอธิบายได้

รายชื่อสมาชิกได้รับจากผู้ใช้ ใช้ Codex ช่วยจัดหน้าที่และร่างบทสัมภาษณ์จำลองสำหรับซ้อม โดยแยกจากผลผู้ใช้จริง ตัวเลขผลกระทบและความร่วมมือกับผู้เชี่ยวชาญยังไม่มีข้อมูลยืนยัน ข้อมูลทดสอบ AI เป็น synthetic fixtures

AI ในผลิตภัณฑ์เป็นคนละส่วนกับ AI ที่ช่วยพัฒนา: runtime ใช้ provider แบบ OpenAI-compatible ตาม server configuration มี consent/guardrails/audit ตามโค้ด โมเดลที่บันทึกในผลตรวจ local ก่อนหน้าเป็น `gemini-3.5-flash-lite` ชื่อและ availability ของรุ่นส่งต้องตรวจจาก environment จริง ไม่ใส่ API key ในเอกสาร

## เตรียม Ownership review

สมาชิกแต่ละคนควรติดตาม flow UI → API → authorization → service → transaction/DB → response ได้ อธิบายเหตุผลของ version/idempotency, แสดง error case, หา log/defect และแก้ปัญหาเล็กน้อยในส่วนที่รับผิดชอบ โดยไม่อ่านสไลด์แทนการอธิบาย

หัวข้อ review: source license, secret handling, ขอบเขตข้อมูลที่ส่ง provider, consent withdrawal, context truncation, migration compatibility และเหตุผลที่ AI draft ไม่บันทึกเอง
