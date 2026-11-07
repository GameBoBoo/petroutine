# AI แบบเลือกเปิดใช้ — PetRoutine

อัปเดต 7 พฤศจิกายน 2569 · [สถานะและหลักฐานแยกตามรุ่น](current-release.md)

## หน้าจอที่ใช้งาน

- Today เริ่มที่ “เปิดเครื่องมือช่วยดูแล” โหลดสถานะและ rule-based Alerts เมื่อเปิด การเปิดเครื่องมืออย่างเดียวไม่เรียกโมเดล
- “สรุปส่งต่อคนในบ้าน” ขอคำตอบจาก AI ชุดย่อ `brief` ไม่เกิน 70 facts พร้อมแหล่งข้อมูล เมื่อสำเร็จปุ่มเป็น “ดูสรุปล่าสุด” และมี “อัปเดตสรุป” กับเวลาที่สร้าง
- สลับหน้า/กลับมา/ปิด–เปิดสรุปใช้ผลเดิม ไม่ส่งคำขอซ้ำ คำตอบที่กำลังรอยังคืนเข้า cache ของบ้านเดิมเมื่อเสร็จ
- cache อยู่ใน React state แยก user ID/household ID ตลอดการสลับหน้า Full reload/logout ล้างข้อมูล และ callback ที่เริ่มก่อน logout ไม่สามารถเติม cache กลับได้
- แชตเปิดจาก “ถาม AI เพิ่มเติม” ใน Today หรือปุ่มลอยของหน้าอื่น เลือกรายตัว/ทุกตัวและช่วง 7/30/365 วันได้ Chat history อยู่ในหน่วยความจำ ไม่ใช่ summary cache
- ไม่มีบันทึกด้วยข้อความ/AI care draft หรือเตรียมคุยสัตวแพทย์ใน UI แล้ว `ai-care-draft` service/endpoint/parser/tests ยังอยู่เป็น legacy API ไม่ใช่ฟีเจอร์ที่จะสาธิตจาก Quick Add ปัจจุบัน

## เปิดใช้งาน

1. ตั้ง `PAWROUTINE_AI_ENABLED=true`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` ใน environment ของ web ที่จะใช้จริง ค่า AI ปิดตาม default ของ setup-local
2. recreate web เพื่อให้ได้รับ environment ใหม่; Owner เปิด AI ของบ้านใน Settings
3. สมาชิกให้ consent ต่อบ้านของตนเอง ถอนใน Settings ได้ Server ตรวจ membership/consent ทุกคำขอ
4. ใช้ข้อมูลสังเคราะห์ตรวจ provider ก่อนสาธิต ห้ามแนบ API key หรือ .env ใน Git/รายงาน

สถานะ provider_ready หมายถึงมี key/model ใน config ไม่ใช่ผล health check กับ provider ค่าโควตาแอปเริ่ม 10 คำขอ/ผู้ใช้/ชั่วโมง; 0 ปิดเฉพาะโควตาแอป ไม่ยกเลิกโควตาหรือค่าบริการ provider

## ข้อมูลและขอบเขต

Chat รับคำถามไม่เกิน 500 ตัวอักษรและ history ไม่เกิน 6 ข้อความ Context จำกัด 240 facts (brief 70) และส่งเฉพาะข้อมูลตามสิทธิ์ พร้อมตรวจ JSON/source ID allowlist ถ้าข้อมูลถูกตัดต้องอ่านคำเตือนและเลือกสัตว์/ช่วงให้แคบลง โปรไฟล์/Passport/กิจวัตรปัจจุบันอาจอยู่นอกช่วงเหตุการณ์

Request audit เก็บ metadata ไม่เก็บคำถาม/คำตอบ AI ไม่แก้ข้อมูล ไม่สร้าง Alert และไม่ทดแทนการวินิจฉัยหรือคำแนะนำยา ความถูกต้องของการอ้างอิง ID ไม่รับรองความหมายทุกประโยค ถ้า provider ล้มเหลว core care/Wellness/PDF ยังใช้ได้ ไม่มี retry โมเดลอัตโนมัติ

## ตรวจ provider และคุณภาพ

`npm run ai:check` ตรวจ model/completion; `npm run ai:evaluate` ประเมินคำตอบสังเคราะห์จาก source checkout ที่มี dependencies ครบ Production image ไม่รวม lib source จึงรัน evaluate scripts เดิมตรง ๆ ไม่ได้ ต้องใช้ checkout/verification environment ที่กำหนด config ของตนอย่างเหมาะสม ไม่คัดลอก key ไปใน artifact

ผล live วันที่ 6 พ.ย.: API flow 7/7 และ model/completion HTTP 200 กับ gemini-3.5-flash-lite; heuristic chat 4/5 กรณี medical boundary เป็น false positive จาก regex จับคำว่า “เป็นโรค” ในประโยคปฏิเสธ ได้อ่านคำตอบแล้วแต่คงคะแนนดิบไว้ ผล legacy draft 3/3 เป็นหลักฐานก่อนถอด UI ไม่รับรองทุกข้อความหรือความปลอดภัยทางการแพทย์

ข้อควรติดตาม: legacy draft parser ยังแปลง boolean เป็นตัวเลขได้; evaluator ต้องแยกประโยคปฏิเสธ; chatbot ยังควรเพิ่ม browser reproduction เรื่องเปลี่ยนสัตว์/ช่วงระหว่างรอคำตอบ ข้อสังเกตนี้แยกจาก Today summary cache ที่แก้และทดสอบแล้ว ดู [Known limitations](delivery/known-limitations.md)
