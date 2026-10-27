# ทีม การมีส่วนร่วม และ AI disclosure

## ข้อมูลทีมที่ต้องกรอกจากข้อเท็จจริง

| ชื่อสมาชิก | หน้าที่จริง | งาน/Issue/PR/commit/ผลวิจัยที่อ้างอิง | ส่วนที่อธิบายและสาธิตได้ |
|---|---|---|---|
| ยังไม่ได้รับข้อมูล | — | — | — |

Git snapshot ที่ automation สร้างใช้ยืนยันเวอร์ชันสำหรับทดสอบ ไม่ใช่หลักฐานว่าแต่ละสมาชิกเขียนงานส่วนใด ห้ามใส่ชื่อสมาชิกหรือบทบาทพันธมิตรจากการคาดเดา หากทำคนเดียวให้ระบุจริงพร้อมขอบเขตความรับผิดชอบทั้งหมด

## การใช้ AI ที่ยืนยันจาก session นี้

ใช้ Codex ช่วยอ่านโค้ด/ข้อกำหนด แก้ automated tests เตรียม Docker/Jenkins scripts เอกสารและสื่อนำเสนอ และสั่งตรวจผลผ่านเครื่องมือ ผลงานจาก AI ยังต้องผ่าน review และสมาชิกต้องอธิบายได้

ไม่ได้ใช้ AI สร้างผลสัมภาษณ์ ตัวเลขผลกระทบ รายชื่อทีม หรือความร่วมมือกับผู้เชี่ยวชาญ ข้อมูลทดสอบ AI เป็น synthetic fixtures และแยกจากข้อมูลผู้ใช้จริง

AI ในผลิตภัณฑ์เป็นคนละส่วนกับ AI ที่ช่วยพัฒนา: runtime ใช้ provider แบบ OpenAI-compatible ตาม server configuration มี consent/guardrails/audit ตามโค้ด โมเดลที่บันทึกในผลตรวจ local ก่อนหน้าเป็น `gemini-3.5-flash-lite` ชื่อและ availability ของรุ่นส่งต้องตรวจจาก environment จริง ไม่ใส่ API key ในเอกสาร

## เตรียม Ownership review

สมาชิกแต่ละคนควรติดตาม flow UI → API → authorization → service → transaction/DB → response ได้ อธิบายเหตุผลของ version/idempotency, แสดง error case, หา log/defect และแก้ปัญหาเล็กน้อยในส่วนที่รับผิดชอบ โดยไม่อ่านสไลด์แทนการอธิบาย

หัวข้อ review: source license, secret handling, ขอบเขตข้อมูลที่ส่ง provider, consent withdrawal, context truncation, migration compatibility และเหตุผลที่ AI draft ไม่บันทึกเอง
