# สถานะรุ่นปัจจุบัน — 7 พฤศจิกายน 2569

โค้ดอ้างอิง `512009f` ใน branch `fix/submission-audit-20261105` เอกสารอาจมี commit ถัดจากนี้โดยไม่มีการเปลี่ยน runtime การอัปเดตเว็บ local ไม่ใช่การยืนยัน remote main หรือ Course deployment ใหม่

## พฤติกรรมที่ใช้ปัจจุบัน

| ส่วน | พฤติกรรม |
|---|---|
| กิจวัตรใน Sidebar/สัตว์เลี้ยง | แสดง weekly/interval และงานทำซ้ำ; once ไม่อยู่ในรายการ ค้นหา ยอดนับ หรือ pagination ของกิจวัตร |
| งานครั้งเดียว | ยังจัดเก็บผ่าน routine/occurrence engine และแสดงใน Today/Calendar ไม่มีการลบข้อมูล once เพื่อซ่อนจากหน้ากิจวัตร |
| จัดการข้อมูล | ปุ่มจัดการรายการอยู่ใน header ใกล้ปุ่มเพิ่ม มีไอคอนแก้ไขและสีส้ม; โหมดจัดการเปลี่ยนเป็นสีเขียว “เสร็จสิ้น” แล้วแสดง edit/delete ตามสิทธิ์ |
| จบการจัดการ | เสร็จสิ้นซ่อนปุ่มระดับรายการ เปลี่ยนหน้าหลักหรือบ้านเริ่มโหมดอ่านใหม่ ฟอร์มที่เปิดมีบันทึก/ยกเลิกของตนเอง |
| บ้านและสมาชิก | ไม่มีปุ่มจัดการรายการ Owner เห็นลบบ้านโดยตรง ต้องพิมพ์ชื่อบ้านและยืนยัน Member ไม่มีปุ่มนี้ |
| Today AI tools | เริ่มปิด เปิดแล้วจำสถานะ/ผลสรุประหว่างสลับหน้า รวมคำขอที่กำลังรอ แยกผู้ใช้/บ้าน |
| สรุป AI | ดูสรุปล่าสุดหรือปิด–เปิดกรอบซ้ำใช้ cache; อัปเดตสรุปส่งคำขอใหม่ พร้อมเวลาอัปเดต |
| อายุ cache | เก็บใน React state ของหน้าเว็บ ไม่ใช่ localStorage/sessionStorage; full reload หรือ logout เริ่มใหม่ และ callback เก่าหลัง logout ไม่คืน cache |
| AI ที่ถอดออก | ไม่มีทางเข้า AI care draft/บันทึกด้วยข้อความ และไม่มีสรุปเตรียมคุยสัตวแพทย์; chatbot/สรุปส่งต่อและ Vet Report ยังอยู่ |
| PDF | โลโก้ PetRoutine บนหัวรายงาน Minimal พื้นขาว เส้นเทา ขนาด A4 กระชับ; detached export copy แยกจาก preview จึงได้สัดส่วนเดียวกันข้ามหน้าจอ/ธีม |

`pawroutine` ยังเป็นชื่อ package/Compose และ prefix ของ environment/localStorage บางตัว ส่วนชื่อระบบและ repository คือ PetRoutine / GameBoBoo/petroutine

## หลักฐานที่ตรวจแล้ว

| รอบ/โค้ด | ผลที่สังเกตจริง | ขอบเขต |
|---|---|---|
| `c802bd8` · Course Jenkins #5 · 6 พ.ย. | Unit/API 98/98; E2E 18 ผ่าน/4 platform skips; audit 0 vulnerabilities; build/deploy/backup-recovery ผ่าน | Full-suite baseline ก่อนเปลี่ยน UI รอบหลัง ไม่ใช่ผล full suite ของ 512009f |
| `c97a4a8` · UI local · 7 พ.ย. | build ผ่าน; targeted static UI 7/7; browser checks 7 ส่วน × desktop/mobile ผ่าน รวม edit/delete/cancel/permissions และตำแหน่ง/สีปุ่ม | Chromium และ viewport emulation |
| `512009f` · บ้านและสมาชิก · 7 พ.ย. | build ผ่าน; targeted static 2/2; Owner/Member × desktop/mobile 4 กรณีผ่าน | ลบบ้านแสดงตรง ยกเลิกไม่ลบจริง หน้า routine ยังมีโหมดจัดการ |
| AI live · 6 พ.ย. | model/completion HTTP 200; API flow 7/7; draft evaluation เดิม 3/3; chat heuristic 4/5 | ข้อมูลสังเคราะห์ โมเดล gemini-3.5-flash-lite; draft เป็นฟีเจอร์ก่อนถอด UI, กรณี medical boundary ถูก regex แจ้งเตือนผิดและได้อ่านคำตอบแล้ว |

PDF ที่ดาวน์โหลดจาก light desktop และ dark mobile ของรอบ compact export มีหน้าตรงกันจากการ render เปรียบเทียบ และตรวจโลโก้จากไฟล์ PDF จริงในรอบถัดมา จำนวนหน้าขึ้นกับข้อมูล ไม่รับประกันว่าทุกชุดข้อมูลมีหนึ่งหน้า

หลักฐาน Course อ่านจาก job `PetRoutine-audit-fix-20261106` build #5: `artifacts/revision.txt`, `verification/verification.json`, `test.log`, `playwright.json`, `smoke.json`, `recovery.txt` ผล backup ตรวจ core tables 4 ตาราง ไม่ใช่ full disaster recovery

ชุดตรวจ UI หลังจากนั้นใช้ browser harness และข้อมูลสังเคราะห์บนเว็บ local ไม่ได้รัน full Unit/API/E2E ทั้งชุดหลังทุก UI commit และไม่ได้รับรอง live AI/SLA, browser อื่น, keyboard ทุก control หรือผลทดลองผู้ใช้จริง

## เอกสารที่เกี่ยวข้อง

[User flow](user-flow.md) · [Care experience](care-experience.md) · [AI](ai-phase-11.md) · [Testing](testing.md) · [Known limitations](delivery/known-limitations.md) · [Flow audit remediation](delivery/flow-audit-remediation-20261106.md)
