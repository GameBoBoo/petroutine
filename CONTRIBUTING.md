# ร่วมพัฒนาและทดสอบ

อ่าน [README](README.md) เพื่อเตรียมเครื่องและเปิดระบบ ใช้ `main` เป็นรุ่นที่ทีมเริ่มทดสอบ และ [คู่มือทดสอบ](docs/team-testing.md) เป็น checklist พร้อมรูปแบบรายงานปัญหา

## เริ่มแก้งาน

ตรวจว่าไม่มีงานค้างใน checkout ก่อนเปลี่ยน branch จากนั้นอัปเดต main และสร้าง branch สำหรับงานของตน เช่น:

```bash
git switch main
git pull --ff-only
git switch -c fix/calendar-filter
```

ใช้ชื่อ branch ตามปัญหาที่แก้ แบ่งการเปลี่ยนแปลงให้ตรวจทานได้ และระบุ Requirement/AC หรือ Issue ที่เกี่ยวข้องเมื่อมี

## ก่อนส่งให้ตรวจทาน

- ทดสอบ happy path และ failure case ของส่วนที่แก้ตาม [Team testing](docs/team-testing.md)
- รันชุดตรวจใน Docker ตาม README เมื่อต้องยืนยัน audit/unit/API/build/E2E ด้วย DB แยก
- หากเปลี่ยน schema เพิ่ม migration ใหม่ตามลำดับและใช้ `db/migrations.mjs`; ไม่ลบ migrations เก่า
- หากเปลี่ยนวิธีรัน พอร์ต env หรือ API ให้อัปเดตเอกสารที่เกี่ยวข้อง
- ตรวจ `git diff`, `git diff --cached` และ `git status` ก่อน commit ไม่แนบ secret, `.env`, demo credentials, dump หรือข้อมูลส่วนบุคคล

ในคำอธิบายการแก้ไขให้ระบุปัญหา พฤติกรรมหลังแก้ คำสั่ง/ผลทดสอบจริง commit ที่ใช้ และข้อจำกัด ผลเก่าหรือผลจาก mock ต้องมีขอบเขตชัดเจน ไม่ใช้แทนการทดสอบ provider จริง

ผู้พัฒนา push branch งานของตนแล้วเปิด Pull Request เข้า `main` ให้สมาชิกที่เกี่ยวข้อง review ก่อนรวม ตาม workflow ที่ทีมตกลงกัน ผู้ดูแลเผยแพร่ main ที่รวมและตรวจแล้วเพื่อให้ทีม pull รุ่นเดียวกัน

## รายงานปัญหา

ใช้แบบฟอร์ม Bug บน GitHub ระบุ commit, โหมดรัน, browser/viewport, บทบาท, ขั้นตอนทำซ้ำ และผลคาดหวัง/ผลจริง ภาพหรือ log ต้องลบข้อมูลอ่อนไหวก่อนแนบ อ่านตัวอย่างใน [Team testing](docs/team-testing.md)

## ขอบเขตหลักฐาน

ผล cleanup ที่บันทึกไว้ตรวจ source และ startup ภายใน Course โดยใช้ข้อมูลสังเคราะห์ ดู [Maintenance](docs/maintenance.md) การแก้เอกสารภายหลังไม่ใช่ Jenkins run ใหม่ ผลผู้ใช้จริงและการมีส่วนร่วมของสมาชิกต้องบันทึกหลังทำจริง ดู [Team/AI disclosure](docs/delivery/team-and-ai-disclosure.md)
