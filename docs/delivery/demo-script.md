# บท Demo และกรณีผิดพลาด

ใช้ฐานข้อมูล delivery synthetic ที่ port 3300 เท่านั้น ไม่แสดง password/API key หรือข้อมูลผู้ใช้จริง เปิด Jenkins console และ traceability เตรียมไว้ก่อนเริ่ม ระบุ commit และ build number ที่ใช้จริง

## เรื่องหลัก: บ้านที่มีผู้ดูแลสองคน

1. Owner สมัคร/สร้างบ้าน เพิ่มสัตว์ “โมจิ” และเชิญผู้ดูแลร่วม เปิดสมาชิกอีกคนใน browser profile หรือ incognito แยก session
2. สร้างงานให้อาหารแบบ once เวลาวันนี้ กำหนดผู้รับผิดชอบ ยืนยันแล้วแสดงใน Today/Calendar
3. สมาชิกทำงานเสร็จพร้อมหมายเหตุ กดยืนยัน อีกคนโหลด Today เห็นสถานะ/ผู้ทำ ตรวจ Timeline
4. สาธิต Undo ภายใน 8 วินาทีและยืนยัน จากนั้นกดเสร็จอีกครั้ง แสดงผลก่อน/หลัง
5. เพิ่ม Daily Wellness เช็กอินเฉพาะช่องที่สังเกตได้ แสดงว่าวันที่ไม่มีข้อมูลไม่ถูกเติมเป็นศูนย์
6. ใช้ข้อมูล synthetic ที่เตรียมไว้เพื่อแสดง baseline/alert กด source ต้นทาง จากนั้นกำหนดผู้ติดตามและวันติดตาม งานติดตามสำเร็จไม่ปิด alert โดยอัตโนมัติ
7. เปิด Vet Report เลือกช่วง/หัวข้อ ดาวน์โหลดและเปิด PDF ตรวจชื่อสัตว์/วันที่/ข้อมูลที่ตรงกับบันทึก
8. หากมี provider พร้อม ให้ Owner เปิด AI และสมาชิก consent ถามจากบันทึกแล้วเปิด source ข้อมูลไม่พอให้พูดตามจริง ไม่เติมคำตอบแทน provider

Baseline ต้องใช้ข้อมูลหลายวัน ห้ามอ้างว่าข้อมูลเพิ่งสร้างวันเดียวเป็น longitudinal data จริง `scripts/seed-demo-data.sql` เป็นตัวช่วยที่ต้องอ่านและตรวจ target ก่อนใช้ ห้าม import ลง DB production เดิมโดยไม่ตรวจ schema/ผลกระทบ

## Failure cases ที่ต้องสาธิต

| กรณี | สิ่งที่ทำ | ผลที่ควรเห็น |
|---|---|---|
| ไม่มีสิทธิ์ | สมาชิกทั่วไปลองคำสั่ง Owner/บัญชีอื่นลองบ้านที่ไม่เป็นสมาชิก | ปฏิเสธและไม่เปลี่ยนข้อมูล |
| ทำงานชนกัน | เปิดรายการก่อนแก้ในสอง session แล้วเปลี่ยนจาก session แรก | session หลังเจอ version conflict/โหลดข้อมูลล่าสุด ไม่ทับเงียบ |
| Cancel | เปิด confirmation แล้วกดยกเลิก | ไม่มี mutation สถานะเดิมคงอยู่ |
| ข้อมูลไม่ครบ | ส่ง form ที่ขาด required field | เห็นข้อความแก้ไขได้ ไม่บันทึกข้อมูลผิด |
| ไม่มีข้อมูล wellness | เลือกสัตว์ใหม่/วันที่ว่าง | แสดงข้อมูลไม่พอ/ช่องว่าง ไม่อ้างว่าปกติแน่นอน |
| AI ปิดหรือ provider ล้มเหลว | ปิด AI/ใช้ผล error test ที่บันทึกไว้ | ชี้แจงข้อผิดพลาด ส่วน core ยังใช้งานได้; ห้ามแกล้งเป็น live provider failure ถ้าไม่ได้ทดสอบจริง |
| Pipeline ไม่ผ่าน | ใช้ throwaway branch/job ที่ทำ test command ล้มเหลว | Build เป็น FAILURE และไม่มี stage publish/deploy ทำงาน |

## แสดง DevTools จากผลจริง

เปิด commit → Jenkins build → test logs → image tag/digest → Compose health → smoke JSON → recovery result ชี้ว่าบริการอยู่ใน nested daemon ของ Course ไม่ใช่ host production

สมาชิกต้องอธิบาย data flow ของหนึ่ง mutation และหนึ่ง failure ได้ ถ้าส่วนใดไม่ผ่านให้เปิด defect/known limitation แทนการข้ามแล้วกล่าวว่าครบ
