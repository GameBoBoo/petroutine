# PawRoutine UX/UI

## หลักการ

Today เป็น operational home มีช่องหมายเหตุแบบเลือกเปิดได้ Complete/Skip และการเปลี่ยนสถานะสำคัญต้องทบทวนในหน้าต่างยืนยันก่อนบันทึก ข้อมูลสำคัญถูกจัดตามความเร่งด่วน และการลบใช้ข้อความยืนยันที่บอกชื่อรายการและผลที่จะเกิดขึ้น

## รูปแบบหน้าจอ

- Desktop: sidebar, content, contextual rail; มี Quick Add ใน sidebar และหน้า Today
- Mobile: bottom nav 5 รายการ พร้อมเว้นพื้นที่ไม่ให้ทับ content/Undo bar
- Today: ต้องดูแลก่อน, รายการถัดไป, เสร็จแล้วแบบพับได้ และตัวกรองคน/สัตว์/สถานะ
- Routine form: ฟิลด์หลักก่อน ตัวเลือกขั้นสูงเมื่อเปิด; weekly เลือกวัน, เพิ่ม/ลบหลายเวลา, interval/once/bounds/pause/assignee
- Pet Workspace: ภาพรวม กิจวัตร สุขภาพ Timeline และรายงานสัตวแพทย์; ภายในสุขภาพรวมภาพรวมแนวโน้ม เช็กอินรายวัน ข้อมูลสุขภาพประจำตัว และบันทึกเหตุการณ์สุขภาพ เพื่อลดจำนวนแท็บระดับบน
- ข้อมูลสุขภาพประจำตัว: ข้อมูลอ้างอิงต่อเนื่อง เช่น แพ้ยา ภาวะ ยาประจำ วัคซีน และนัดหมาย; บันทึกเหตุการณ์สุขภาพ: สิ่งที่เกิดขึ้นแล้ว เช่น ชั่งน้ำหนัก ให้ยาตามคำสั่ง หรือพบสัตวแพทย์
- Quick Add: แบ่งเป็นงานที่ต้องทำ (กิจวัตร/งานครั้งเดียว) และบันทึกสิ่งที่เกิดขึ้นแล้ว (เช็กอิน/การดูแล/เหตุการณ์สุขภาพ) มีทางลัดเพิ่มเร็ว แต่ไม่มีลิงก์เลือกแม่แบบ
- กิจวัตร: แสดงชื่อ เวลา/วันทำซ้ำ และผู้รับผิดชอบเป็นแถวกระชับ พับรายละเอียดเสริม หน้าหลักค้นหา/กรองตามสัตว์และแบ่ง 10 รายการ แท็บรายสัตว์ใช้แถวชุดเดียวกัน
- ฟอร์ม: ใช้ `SelectField` และตัวเลือกกลางใน `lib/form-options.js` พร้อมคำอธิบายสั้น แสดงผู้รับผิดชอบในฟอร์มหลัก รายละเอียดทุกฟอร์มดู [Popup fields](popup-fields.md)
- DatePicker: ปฏิทินเปิดใน browser top layer โดยยังอยู่ใน DOM ของฟอร์ม จัดตำแหน่งตามช่องวันที่และพื้นที่ viewport เลือกเปิดด้านบน/ล่างและชิดขอบให้พอดี ไม่ถูกตัดโดย modal overflow ปรับตำแหน่งเมื่อเลื่อน/เปลี่ยนขนาดจอ และ Escape ปิดเฉพาะปฏิทินก่อน popup แม่ ใช้ร่วมกันทั้งเพิ่มสัตว์ กิจวัตร สุขภาพ และช่องวันที่อื่น
- Confirmation: ใช้ `ConfirmationProvider` สำหรับการบันทึก/เปลี่ยนสถานะสำคัญ มีปุ่มยกเลิก/ยืนยัน, focus trap, Escape และพื้นหลัง inert; cancel ไม่เรียก mutation ลบสัตว์/กิจวัตรและลบบ้านยังใช้ popup เดิม
- Lifecycle: UI ใช้คำว่า “ลบ” แทน “เก็บข้อมูลเก่า” แต่ backend ยัง soft archive รักษาประวัติ ไม่แสดง Recovery Tools, Getting Started หรือส่วนรูป/ข้อมูลติดต่อ และไม่มีปุ่มปิดกิจวัตรชั่วคราว
- บทบาทหน้าหลัก: Today ใช้ทำงานวันนี้, Calendar ใช้วางแผนตามวัน, History ดูงานที่ทำ/ข้าม, Pet Timeline ดูเหตุการณ์ทั้งหมดของสัตว์; การกดแจ้งเตือนเปิดหน้ารายละเอียดที่เกี่ยวข้อง
- Quick Check-in: ฟอร์ม progressive disclosure ทุกช่องเป็น optional แต่ต้องมีอย่างน้อยหนึ่งข้อมูล ใช้คำว่า “ไม่ได้บันทึก” แทนค่าศูนย์ และแสดงเฉพาะ metric ที่มีข้อมูลจริง
- Learning Mode: แสดงสถานะด้วยข้อความร่วมกับสี, progress 0–14 วันที่ screen reader อ่านได้ และการ์ดแยก metric; ก่อนครบใช้ “ข้อมูลยังไม่เพียงพอ” โดยไม่แสดงค่าคาดเดา
- Notification: แยก task, health due และ Wellness follow-up ด้วยข้อความร่วมกับสถานะสี ไม่สื่อความหมายด้วยสีอย่างเดียว; แต่ละรายการเปิด Today หรือหน้าสุขภาพของสัตว์เป้าหมายได้
- Shared follow-up: ฟอร์มมี label ชัดเจนสำหรับผู้ติดตาม วันที่ และหมายเหตุ พร้อม feedback และ touch target อย่างน้อย 44px
- Vet Report: ใช้ semantic table, รองรับข้อความยาว/สถานะว่าง, layout A4 และ print stylesheet ที่ซ่อน app chrome แต่คงหัวรายงาน ช่วงวันที่ และคำชี้แจงข้อเท็จจริง
- Navigation: Sidebar และ mobile navigation ใช้ label ภาษาอังกฤษสั้นและสม่ำเสมอ; ไม่มีรายการ Change History
- Household: ปุ่มลบแสดงเฉพาะ Owner และต้องพิมพ์ชื่อบ้านยืนยัน; บ้านที่ลบไม่แสดงเป็นรายการถังขยะใน UI
- Notification: แต่ละรายการมีปุ่มลบพร้อม accessible name, touch target 44px, loading feedback และ dismissal แบบรายผู้ใช้

## Accessibility และ responsive

ใช้ semantic button/label/tab, focus trap และ Escape ใน Modal, error summary รับ focus, live region สำหรับ Undo, focus-visible, reduced motion และ touch target ขั้นต่ำ 44px เป้าหมายทดสอบคือ viewport 375px โดยไม่มี horizontal overflow

## ภาษาและความปลอดภัย

UI ใช้ภาษาไทยเป็นหลัก เวลาแสดงใน `Asia/Bangkok` สุขภาพระบุชัดว่าเป็นข้อมูลผู้ใช้กรอกเอง ไม่ใช่การวินิจฉัยหรือคำแนะนำรักษา ไม่มีส่วน upload รูป/ไฟล์ใน UI ปัจจุบัน แม้ API รูปโปรไฟล์ยังอยู่


## Visual preference

มาตรฐานฟอนต์และภาพล่าสุด: [PetRoutine Brand System](brand-system.md) — Google Sans 400/500/600/700 ทุกข้อความ ภาษาไทยและอังกฤษ ไอคอนเส้นมน 2.25px บนกริด 24px กรมท่าเป็นหลัก ส้มเมื่อเลือก พื้นครีม

Avoid colored card-edge accents and strong colored outlines. Use restrained neutral card borders, clear content hierarchy, and consistent grid layouts for expanded controls and pet labels.
