# ข้อจำกัดและรายการที่ยังต้องยืนยัน

- ได้รับรายชื่อทีมและกำหนดแผนหน้าที่แล้ว ยังรอผลวิจัยผู้ใช้ ตัวชี้วัดผลกระทบ หลักฐานร่วมงาน และต้นทุนจริง บทสัมภาษณ์จำลองใช้สำหรับซ้อม
- Live provider synthetic evaluation ใช้ heuristic checks ไม่ใช่การรับรองความถูกต้องทางการแพทย์หรือความเข้าใจทุกคำตอบ ต้องอ่านผลและตรวจกรณีหลายตัว/ข้อมูลไม่พอเพิ่มเติม
- AI draft มี parser/API tests และ live-provider synthetic evaluation 3 กรณี (ให้อาหาร/น้ำหนัก/ข้อสังเกต) ยังไม่ครอบคลุมทุกชนิดบันทึกหรือข้อความซับซ้อน
- การสร้าง draft กับการบันทึกเป็นคนละคำขอ ผู้ใช้ต้องตรวจและยืนยันข้อมูล ไม่ให้ AI สร้างคำวินิจฉัยหรือขนาดยา
- Course snapshot ระหว่างพัฒนาและ remote release เป็นคนละรุ่น ต้องตรวจ checkout/tag ที่ส่งจริงซ้ำ
- Local Jenkins/registry พิสูจน์ delivery ภายใน Course ยังไม่ยืนยัน webhook/credentials/registry ภายนอกของทีม
- Backup drill ตรวจ checksum, restore และ core row counts ไม่ตรวจ full disaster recovery/SLA
- ยังไม่มี load test, production uptime measurement หรือ independent penetration test
- PDF เป็น raster จาก browser จึงไม่ใช่ tagged/searchable PDF และอาจมีพื้นที่ว่างเมื่อกัน section ข้ามหน้า มี HTML report/table สำหรับอ่านข้อมูลต้นทาง
- ไม่รวม email/push, file attachment service, server-side PDF หรือคำแนะนำรักษาโรค
- เอกสารเก่าใน `docs/superpowers/plans` เป็นประวัติแนวคิด ให้อ่านสถานะล่าสุดและ traceability ประกอบ
