# คู่มือทีมทดสอบ PawRoutine

ก่อนทดสอบให้อ่าน [Current release](current-release.md) เปิดจัดการรายการใน header ก่อนแก้/ลบ ยกเว้น Owner ลบบ้านโดยตรง งานครั้งเดียวไม่อยู่ในหน้ากิจวัตร และไม่มี AI draft ใน Quick Add แล้ว

## ตรวจ UI รุ่น 7 พฤศจิกายน 2569

1. สร้าง weekly และ once ให้สัตว์เดียวกัน: Today/Calendar ยังมี once แต่ Sidebar/แท็บกิจวัตรและยอดนับแสดงเฉพาะ weekly
2. ตรวจว่าปุ่มจัดการมีจุดเดียวใน header ข้างปุ่มเพิ่ม ไม่มีปุ่มซ้ำทุกแถว เปิดแล้วแก้/ลบได้ตามสิทธิ์; เสร็จสิ้นซ่อนปุ่มกลับ และยกเลิก confirmation ไม่เปลี่ยนข้อมูล
3. ในบ้านและสมาชิก Owner เห็นลบบ้านโดยตรง ไม่เห็นจัดการรายการ ต้องพิมพ์ชื่อบ้านให้ตรงก่อนยืนยัน; Member ไม่มีปุ่มลบ
4. ขอ AI summary หนึ่งครั้ง สลับหน้า กลับมา และปิด–เปิดสรุป ตรวจ Network ว่าไม่มี POST ai-insights เพิ่ม กดอัปเดตสรุปจึงเพิ่มหนึ่งคำขอ ลองสลับหน้าระหว่างรอด้วย
5. ดาวน์โหลด PDF จาก desktop/light และ mobile/dark ตรวจโลโก้ พื้นขาว ขนาด A4 และข้อมูลไม่ตกหล่น จำนวนหน้าขึ้นกับข้อมูล

ใช้ข้อมูลสังเคราะห์ จด source revision, environment, ผลจริง และข้อจำกัดทุกครั้ง ไม่ใช้ checklist นี้เป็นผล Passed โดยไม่มีการรัน

เริ่มจาก [README](../README.md) แต่ละเครื่องสร้าง `.env` ของตน ไม่มีบัญชี demo กลางหรือ API key ที่ต้องขอจากเจ้าของโครงการ ใช้ข้อมูลสมมติและสมัครบัญชีทดสอบใหม่

## ก่อนทดสอบ

ครั้งแรกให้ทำ setup ตาม README ก่อน ถ้ามี checkout อยู่แล้วให้ตรวจว่าบันทึกงานของตนเรียบร้อย แล้วอัปเดตรุ่นทดสอบ:

```bash
git switch main
git pull --ff-only
node scripts/setup-local.mjs
```

ถ้ากำลังพัฒนาบน branch งาน ให้ทดสอบและรายงานชื่อ branch/commit ของงานนั้นด้วย ไม่สลับ branch โดยทิ้งงานที่ยังไม่บันทึก ดู [Contributing](../CONTRIBUTING.md)

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

สำหรับชุดข้อมูลทดสอบที่ครอบคลุมหลายฟีเจอร์ ใช้ `scripts/seed-test-data.mjs` ซึ่งสร้างผู้ใช้ Owner/Member/คนนอก บ้าน สุนัข/แมว กิจวัตรหลายรูปแบบ งานที่มีหลายสถานะ บันทึกดูแล/สุขภาพ สมุดสุขภาพ การแจ้งเตือน ถังเก็บรายการ และข้อมูล Wellness 17 วันสำหรับ baseline/alert/report โดยใช้วันที่อ้างอิงตาม Asia/Bangkok ของวันที่รันทุกครั้ง

สคริปต์สร้างชุดใหม่โดยไม่ลบหรือแก้ชุดข้อมูลเดิม และต้องรันเองพร้อม guard ยืนยันข้อมูลสังเคราะห์ ไฟล์เข้าสู่ระบบและ ID ส่วนตัวจะถูกเขียนไว้ใน `artifacts/test-seed-<id>.json` ซึ่ง Git ignore; หนึ่งครั้งจะสร้างบัญชีทดสอบใหม่สามบัญชี จึงควรเก็บไฟล์นี้ไว้ในเครื่องและไม่แนบใน Issue

Undo ใช้งานได้ในช่วงสั้นหลังเปลี่ยนสถานะงาน จึงไม่สามารถเก็บแถบ Undo ให้พร้อมใช้ใน fixture ที่เปิดภายหลังได้ ให้ทดสอบโดยกดเสร็จสิ้นใน Today แล้วกด Undo ทันที ส่วน PDF สร้างจากหน้า Vet Report ใน browser; seed เตรียมข้อมูลรายงานให้ ไม่ได้สร้างไฟล์ PDF ไว้ล่วงหน้า

PowerShell:

```powershell
$env:SEED_BASE_URL='http://127.0.0.1:3000'
$env:SEED_CONFIRM_SYNTHETIC='yes'
npm run seed:test
```

macOS/Linux:

```bash
SEED_BASE_URL=http://127.0.0.1:3000 SEED_CONFIRM_SYNTHETIC=yes npm run seed:test
```

เปลี่ยน port ได้เป็น `3001` สำหรับ host development หรือ `3300` สำหรับ Course environment สคริปต์สร้างข้อมูลเฉพาะบริการ local (`localhost`/`127.0.0.1`) และไม่เรียก AI provider; หากมี provider ตั้งไว้ จะเปิดการตั้งค่าบ้านและ consent เพื่อให้ตรวจ UI ได้ แต่จะไม่ส่ง prompt

สคริปต์เก่า `scripts/seed-delivery-demo.mjs` ยังคงใช้สร้าง fixture 17 วันแบบสาธิตขนาดเล็กตามขั้นตอนด้านล่าง

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
