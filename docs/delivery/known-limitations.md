# ข้อจำกัดและรายการที่ยังต้องยืนยัน

- ได้รับรายชื่อทีมและกำหนดแผนหน้าที่แล้ว ยังรอผลวิจัยผู้ใช้ ตัวชี้วัดผลกระทบ หลักฐานร่วมงาน และต้นทุนจริง บทสัมภาษณ์จำลองใช้สำหรับซ้อม
- Live provider synthetic evaluation ใช้ heuristic checks ไม่ใช่การรับรองความถูกต้องทางการแพทย์หรือความเข้าใจทุกคำตอบ ต้องอ่านผลและตรวจกรณีหลายตัว/ข้อมูลไม่พอเพิ่มเติม
- AI draft ถอดจาก UI แล้ว แต่ legacy API/parser ยังอยู่และยังรับ boolean เป็นตัวเลขได้; ผล live synthetic 3 กรณีเป็นหลักฐานย้อนหลัง
- Chat heuristic evaluator ยังอาจแจ้งเตือนผิดเมื่อประโยคปฏิเสธมีคำว่า “เป็นโรค”; ต้องอ่านคำตอบจริงประกอบ และเพิ่ม regression เรื่อง context switch ระหว่างรอ chatbot
- Course snapshot ระหว่างพัฒนาและ remote release เป็นคนละรุ่น ต้องตรวจ checkout/tag ที่ส่งจริงซ้ำ
- Local Jenkins/registry พิสูจน์ delivery ภายใน Course ยังไม่ยืนยัน webhook/credentials/registry ภายนอกของทีม
- Backup drill ตรวจ checksum, restore และ core row counts ไม่ตรวจ full disaster recovery/SLA
- ยังไม่มี load test, production uptime measurement หรือ independent penetration test
- PDF เป็น raster ไม่ใช่ tagged/searchable PDF; ปัจจุบันใช้ compact A4 export และโลโก้ แต่จำนวนหน้า/ช่องว่างยังขึ้นกับข้อมูลและการกัน section มี HTML preview/table เป็นข้อมูลต้นทาง
- ไม่รวม email/push, file attachment service, server-side PDF หรือคำแนะนำรักษาโรค
- เอกสารเก่าใน `docs/superpowers/plans` เป็นประวัติแนวคิด ให้อ่านสถานะล่าสุดและ traceability ประกอบ
