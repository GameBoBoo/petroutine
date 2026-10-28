# คู่มือทีมทดสอบ PawRoutine

เริ่มจาก [README](../README.md) แต่ละเครื่องสร้าง `.env` ของตน ไม่มีบัญชี demo กลางหรือ API key ที่ต้องขอจากเจ้าของโครงการ ใช้ข้อมูลสมมติและสมัครบัญชีทดสอบใหม่

## ก่อนทดสอบ

1. หลัง pull ให้รัน `docker compose up -d --build --wait --wait-timeout 180`
2. ตรวจ `docker compose ps` ให้ web/db healthy และเปิด `/api/v1/health` ได้ `ok/ok`
3. จด `git rev-parse --short HEAD`, browser, ขนาดหน้าจอ และโหมด Docker/dev
4. ใช้บัญชี Owner กับ Member ผ่าน browser profile/incognito แยกกัน ถ้าทดสอบสิทธิ์ข้ามบ้านให้สร้างบ้านที่สอง

รหัสเชิญใช้เข้าบ้านในฐานข้อมูลชุดเดียวกัน ถ้าคนละเครื่องรัน local แต่ละเครื่องจะมีบ้านคนละชุด ไม่สามารถใช้รหัสเชิญข้ามฐานข้อมูลได้

## Checklist งานหลัก

| งาน | วิธีทดลอง | ผลที่คาดหวัง |
|---|---|---|
| บัญชี | สมัคร/เข้าใช้/ออก/เข้าใหม่ด้วยรหัสผิด | เข้าถูกบัญชีและเห็น error ที่เข้าใจได้เมื่อรหัสผิด |
| บ้านและสมาชิก | Owner สร้างบ้าน ให้ Member เข้าด้วยรหัสเชิญ | ทั้งสองเห็นสัตว์และงานของบ้านเดียวกัน |
| สัตว์และกิจวัตร | เพิ่มสัตว์ สร้าง weekly หลายวัน/หลายเวลา และครั้งเดียว | Today/Calendar ตรงวันและเวลา Asia/Bangkok |
| ยืนยัน/ยกเลิก | กด Complete/Skip/แก้รายการ แล้วเลือก Cancel ก่อนยืนยันจริง | Cancel ไม่เปลี่ยนข้อมูล; ยืนยันแล้วเกิดรายการเดียว |
| Undo | ทำงานเสร็จแล้ว Undo ภายใน 8 วินาที | สถานะกลับและประวัติสอดคล้อง |
| ข้อมูลชนกัน | เปิดงานเดียวสองหน้าต่าง เปลี่ยนในหน้าหนึ่งก่อนอีกหน้า | แจ้ง conflict/ให้โหลดใหม่ ไม่ทับข้อมูลเงียบ ๆ |
| สิทธิ์ | Member ลองงานเฉพาะ Owner และบัญชีต่างบ้านลองดูข้อมูล | ปฏิเสธข้อมูล/การเปลี่ยนแปลงที่ไม่มีสิทธิ์ |
| Wellness | กรอกบาง metric ย้อนหลัง แก้/ลบบันทึก | ช่องว่างไม่เป็นศูนย์ ประวัติและ baseline เปลี่ยนตาม source |
| Alert/follow-up | ใช้ fixture 17 วันด้านล่าง เปิด Alert และมอบหมายผู้ติดตาม | ดูหลักฐานต้นทางและสถานะติดตามได้ ไม่แสดงคำวินิจฉัย |
| Report | เลือกช่วงวันที่และดาวน์โหลด Vet Report PDF | ไฟล์เปิดอ่านภาษาไทยได้ ข้อมูลเป็นของสัตว์และบ้านที่เลือก |
| มือถือ | viewport 375px ลองเมนู ฟอร์ม dropdown และ confirmation | ไม่ล้นแนวนอนและกดปุ่มยืนยัน/Cancel ได้ |
| ข้อมูลคงอยู่ | บันทึกงานแล้ว `docker compose stop` → `docker compose start` | หลัง healthy ข้อมูลเดิมยังอยู่ |
| AI ปิด | ใช้ core care โดยไม่ใส่ provider key | งานดูแลหลักใช้งานได้ |

ผลที่บันทึกใน checklist นี้ต้องเติมหลังทำจริง อย่านับตารางนี้เป็นผลผ่านโดยอัตโนมัติ

## ข้อมูลสาธิตสำหรับ baseline/alert

สำหรับ local Docker ที่ port 3000 ซึ่งยืนยันแล้วว่าเป็นฐานข้อมูลทดสอบ PowerShell:

```powershell
$env:DEMO_BASE_URL='http://127.0.0.1:3000'
$env:DEMO_CONFIRM_SYNTHETIC='yes'
node scripts/seed-delivery-demo.mjs
```

macOS/Linux:

```bash
DEMO_BASE_URL=http://127.0.0.1:3000 DEMO_CONFIRM_SYNTHETIC=yes node scripts/seed-delivery-demo.mjs
```

สร้างบัญชี Owner/Member สุ่ม บ้าน/สัตว์ใหม่ wellness 17 วันและกิจวัตรผ่าน API ทุกครั้งที่รันเพิ่มชุดใหม่ ไม่ล้างตารางเดิม บัญชีและรหัสสุ่มอยู่ `artifacts/demo-access.json` ซึ่ง Git ignore ใช้ดูเฉพาะในเครื่องตน ห้ามแนบไฟล์นี้ใน Issue หรือส่งขึ้น Git สคริปต์รองรับ port 3000/3300 เท่านั้น หากใช้ port อื่นให้สร้างข้อมูลเองผ่าน UI

## ส่งปัญหาให้ทีม

รายงานผ่าน GitHub Issue หรือช่องทางทีม โดยใช้หัวข้อเหล่านี้:

- Commit / โหมดรัน / browser / viewport
- บทบาท Owner/Member และหน้าจอที่เกิด
- ขั้นตอนทำซ้ำ 1–2–3
- ผลที่คาดหวัง และผลที่เกิดจริง
- เกิดทุกครั้งหรือเป็นบางครั้ง / ระดับความรุนแรง
- Screenshot หรือ log ที่ลบ token, cookie, password, API key และข้อมูลส่วนตัวแล้ว

อย่าแนบ `.env`, `artifacts/demo-access.json`, database dump หรือ browser storage ทั้งชุด ทดสอบซ้ำหลังแก้และระบุ commit ที่ผ่านจริง

## ปัญหาที่พบบ่อย

| อาการ | วิธีตรวจ/แก้ |
|---|---|
| ไม่พบ Docker daemon | เปิด Docker Desktop และรอ `docker info` สำเร็จ |
| JWT_SECRET ว่าง | รัน `node scripts/setup-local.mjs`; ถ้ามี `.env` เดิมต้องตั้ง JWT_SECRET สุ่มยาวเอง สคริปต์ไม่เขียนทับ |
| port ถูกใช้ | เปลี่ยน PAWROUTINE_PORT ใน `.env`; dev DB ต้องแก้ DATABASE_URL ถ้าเปลี่ยน PAWROUTINE_DB_PORT |
| npm ci ไม่สำเร็จ | ใช้ Node 22 และดู error ของ network/lockfile ไม่แก้ lockfile เพียงเพื่อข้ามปัญหา |
| dev ต่อ DB ไม่ได้ | เปิด dev override และตรวจ DATABASE_URL ชี้ 127.0.0.1:55430 ไม่ใช่ db:5432 |
| AI ถูกปิด | ตรวจ server config, เปิด AI ของบ้าน และ consent ของสมาชิก; mock E2E ไม่ได้ยืนยัน provider จริง |
| เว็บไม่พร้อม/DB เริ่มช้า | ดู `docker compose ps` และ `docker compose logs --tail 100 web db`; อย่าลบ volume เพื่อแก้ปัญหา |
| เข้าเว็บเห็น source รุ่นเก่า | ตรวจ branch/commit แล้ว pull และ rebuild; ลอง reload หลัง server healthy |
