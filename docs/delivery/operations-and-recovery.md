# Operations และการกู้คืน

## ดูสถานะ

```bash
docker compose --env-file .delivery.env -p pawroutine-delivery -f compose.delivery.yml ps
docker compose --env-file .delivery.env -p pawroutine-delivery -f compose.delivery.yml logs --tail 100 web db
bash scripts/delivery.sh smoke
```

Health ตรวจทั้ง HTTP และการเชื่อม PostgreSQL ไม่ได้ยืนยันทุก business flow จึงมี API smoke เพิ่ม Smoke สร้างบัญชี/บ้าน/สัตว์ synthetic ใหม่ทุกครั้ง ให้รันเฉพาะ delivery environment แยก ไม่ใช้ URL ฐานข้อมูลจริงของผู้ใช้

## สำรองและซ้อมกู้คืน

```bash
bash scripts/delivery.sh backup
bash scripts/delivery.sh recovery-check
```

Backup เป็น PostgreSQL custom dump ใน `artifacts/backups` พร้อม SHA-256 ใช้สิทธิ์ไฟล์เฉพาะเจ้าของ แยกเก็บนอกเครื่องก่อน deploy จริง Recovery สร้างฐานข้อมูล `recovery_<UTC timestamp>` ใหม่ ไม่แก้ DB ต้นทาง และตรวจ pg_restore สำเร็จกับจำนวน users/households/pets/routines ผลตรวจมีขอบเขตนี้ ไม่ได้เป็นการเทียบข้อมูลทุก byte หรือทุกตาราง

ระหว่าง backup และเทียบจำนวนให้หยุดการเขียนใน delivery environment เพื่อให้ได้ snapshot ที่เทียบกันได้ หากระบบจริงมีการเขียนต่อเนื่องต้องเปลี่ยนวิธีเทียบให้ยึด snapshot ของ backup

การ restore ของจริงต้องวางแผน downtime ตรวจ DB ปลายทางและสิทธิ์ กู้ลง DB ใหม่ก่อน ตรวจ smoke/ข้อมูลสำคัญ แล้วค่อยเปลี่ยน connection ห้าม restore ทับ production อัตโนมัติ

## ย้อน image

ก่อน deploy บันทึก image ID/tag ของรุ่นเดิม และเก็บ image นั้นไว้ Registry ใช้ tag ตาม commit ไม่ใช้ `latest` เป็นหลักฐานรุ่นส่ง

```bash
export PREVIOUS_IMAGE=<previous-verified-image>
bash scripts/delivery.sh rollback
```

Rollback เปลี่ยนเฉพาะ web image แล้วตรวจ health/smoke ไม่ย้อน schema อัตโนมัติ ต้องตรวจ compatibility ของ migration ก่อน รุ่นที่มี migration แบบทำลายข้อมูลใช้แผน restore แยก ไม่ใช้คำสั่งนี้โดยไม่ตรวจ

เลือก previous image ที่ผ่าน security audit ด้วย รุ่นที่ใช้ Next.js 15.5.27 ในประวัติ build เป็นหลักฐานก่อน patch ไม่ใช่ rollback target ที่แนะนำหลังแก้ advisory ผลซ้อม release/image switch ล่าสุดและการตรวจว่าข้อมูลเดโมยังอยู่เก็บใน `artifacts/rollback-summary.json`

## ข้อจำกัดที่ต้องติดตาม

- ยังไม่มี production SLA, load test, alerting channel หรือ offsite backup schedule ที่ยืนยันแล้ว
- Named volume ช่วย persistence แต่ไม่ใช่ backup
- API key ไม่อยู่ใน image/หลักฐาน build; AI ปิดใน delivery environment เป็นค่าเริ่มต้น
- เก็บ log เท่าที่จำเป็น ห้าม archive `.env`, credentials หรือ raw user data ใน Jenkins
- Jenkins/registry แบบ local อยู่ภายใน Course Container ไม่ใช่ hosted production service
