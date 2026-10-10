# Phase 11 — AI/LLM Extension (Optional)

เอกสารนี้เป็นแนวคิดประกอบสำหรับ Phase 11 หลัง Pet Wellness Phase 5–10 เสถียรแล้วเท่านั้น ไม่อยู่ในรุ่นปัจจุบันและไม่ใช่ implementation plan ขอบเขตหลักและ guardrail ให้ยึด [Pet Wellness Integration Design](superpowers/specs/2026-10-11-pet-wellness-integration-design.md)

## ฟีเจอร์ที่แนะนำ

### Daily Care Summary

สรุป Care Log ของวันนั้นเป็นข้อความสั้น พร้อมลิงก์กลับไปยังข้อมูลต้นฉบับ

### Natural-language Care Log

ผู้ใช้พิมพ์ข้อความ เช่น “วันนี้โมจิกินอาหารตอนหนึ่งทุ่มและให้ยาแล้ว” ระบบแปลงเป็นข้อมูลร่าง แล้วให้ผู้ใช้ตรวจสอบก่อนบันทึก

### Wellness Questions

ผู้ใช้ถามแนวโน้ม เช่น “ช่วงนี้โมจิกินน้อยลงไหม” โดย AI อธิบายเฉพาะข้อมูล ช่วงวันที่ baseline และ rule result ที่ระบบเตรียมให้ ห้ามคำนวณหรือสร้าง Alert เอง

## Safety Rules

- ไม่วินิจฉัยโรค
- ไม่เปลี่ยนขนาดยา
- ไม่แนะนำให้หยุดยา
- ไม่บันทึกข้อมูลสำคัญโดยไม่มี User Confirmation
- ตรวจสอบ JSON Schema ของ Output
- แสดง Disclaimer เมื่อเกี่ยวข้องกับสุขภาพ
- มี Fallback เมื่อ Model หรือ Provider ใช้งานไม่ได้
- เมื่อ AI ใช้งานไม่ได้ Baseline, Rule-based Alert, Dashboard และ Vet Report ต้องยังทำงานครบ
- คำตอบด้าน Wellness ต้องระบุช่วงวันที่และข้อมูลอ้างอิงที่ตรวจย้อนกลับได้
- ไม่ส่งข้อมูลส่วนตัวเกินความจำเป็นไปยัง Provider

## Acceptance Criteria ของ AI

1. Output ต้องผ่าน Schema Validation
2. ผู้ใช้แก้ไขผลลัพธ์ก่อนบันทึกได้
3. ข้อมูลต้นฉบับต้องยังคงอยู่
4. ถ้า AI ล้มเหลว ผู้ใช้ยังบันทึกข้อมูลด้วย Form ปกติได้
5. ระบบต้องบันทึกว่าเนื้อหาใดมาจาก AI และเนื้อหาใดมาจากผู้ใช้
