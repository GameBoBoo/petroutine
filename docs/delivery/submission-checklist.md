# ตรวจชุดส่งตามเกณฑ์

เกณฑ์อ้างอิง: [DevTools Mini Project](https://github.com/Tuchsanai/DevTools/blob/main/Mini_Project/project-details/README.md) การมีหัวข้อครบไม่เท่ากับผลคะแนนหรือการรับรองโดยผู้สอน

| มิติ | เอกสาร/หลักฐาน | สถานะของข้ออ้าง |
|---|---|---|
| Problem Statement | problem-evidence.md, submission-report.md | งานวิจัยภายนอกพร้อมข้อจำกัด; สมมติฐานปัญหาเฉพาะกลุ่มยังต้องตรวจผู้ใช้ |
| Solution | traceability.md, demo-script.md, ภาพ/PDF | ตรวจความสามารถและ acceptance criteria ตามหลักฐานทดสอบ |
| Target Users | user-validation.md | นิยามกลุ่ม/วิธีคัดเลือก; ไม่อ้างจำนวนผู้ใช้จริง |
| Social Impact & Assessment | impact-and-sustainability.md | นิยามตัวชี้วัด/เป้าหมาย pilot; ยังไม่ใช่ผลจริง |
| Team & Network | team-and-ai-disclosure.md, team-review-and-qa.md | รายชื่อจริง บทบาทที่จัดให้และแนวซ้อม; รอสมาชิกตรวจและยืนยันผลงานจริง |
| Sustainability & Unfair Advantage | budget-assumptions.json, budget-estimate.json | ราคา vendor อ้างอิง + สมมติฐานที่คำนวณได้; ไม่มีรายได้/พันธมิตรที่ยืนยัน |
| Demo/DevTools/System Design | course-results.md, course-and-ci.md, ../architecture.md, Jenkinsfile | Course/nested Docker/Jenkins/registry/deploy/recovery ตรวจจริง; source/build รุ่นส่งดู manifest ใน ZIP |

## ตรวจส่งไฟล์

- [x] มีรายงานหลัก สไลด์ 12 หน้า demo script runbook และ traceability
- [x] มีรายชื่อ 4 คน แผนบทบาท และคำถามซ้อมอธิบายโค้ด พร้อมเปิดเผยการใช้ AI
- [x] มีแหล่งอ้างอิงปัญหา งบพร้อมสูตร ความเสี่ยงและแผนวัดผล
- [x] แยกผล synthetic/mock/provider จริง และข้อจำกัดของหลักฐาน
- [x] บทสัมภาษณ์ใน interview-rehearsal.md ระบุว่าเป็นบทซ้อมสมมติ
- [ ] สมาชิกตรวจ source/demo ด้วยตนเองและยืนยันส่วนที่ทำจริงก่อนตอบผู้สอน
- [ ] ถ้าจะอ้างผลสัมภาษณ์/impact จริง ต้องเก็บ consent และข้อมูลจริงก่อน
- [ ] หากผู้สอนกำหนด URL GitHub รุ่นล่าสุด ต้องเผยแพร่เองภายหลัง: ผู้ใช้เลือกเก็บ commit ในเครื่อง จึงยังไม่ push

แพ็กเกจแนบ source และ Git bundle สำหรับตรวจแบบ offline; ดู START-HERE.md และ manifest.json ใน ZIP สำหรับ revision และผล CI สุดท้าย ไม่รวม credentials, .env หรือ database dump
