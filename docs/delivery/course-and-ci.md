# Course Container และ Jenkins

## สภาพแวดล้อม

Host → Course Container `tuchsanai/devtools:2569_1` → nested Docker daemon → Jenkins/registry + isolated verification + delivery web/db

Course Container จำเป็นต้องใช้ privileged ตามคู่มือรายวิชา ไม่มีการ mount Docker socket ของ host เข้า Course Container ส่วน Jenkins ได้ socket ของ daemon ภายใน Course เท่านั้น ไม่เปิด registry สู่ host

อ้างอิง: https://github.com/Tuchsanai/DevTools/blob/main/00_Tool/00_Reference/readme.md

## เริ่มจากเครื่องผู้ตรวจ

ผู้ใช้เลือกเก็บ commits ในเครื่อง จึงส่ง Git bundle พร้อมประวัติและ tag ใน ZIP โดยไม่ push GitHub แตก ZIP และเปิด terminal ที่โฟลเดอร์ซึ่งมี pawroutine-delivery.bundle ตรวจ manifest.json เพื่อดู commit และผล CI รุ่นส่ง

บน host สร้าง Course ใหม่ (ถ้ามีชื่อเดียวกันอยู่แล้วให้ใช้ของเดิมหรือเลือกชื่อใหม่ ไม่ลบกล่องเดิม):

```bash
docker run -dit --name pawroutine-course --privileged \
  -p 127.0.0.1:3300:3000 -p 127.0.0.1:38080:8080 \
  tuchsanai/devtools:2569_1
docker exec pawroutine-course mkdir -p /workspace
docker cp pawroutine-delivery.bundle pawroutine-course:/workspace/pawroutine.bundle
docker exec -it pawroutine-course bash
```

ภายใน Course ใหม่ที่ยังไม่มี checkout:

```bash
git clone -b delivery/course-verification-20261028 /workspace/pawroutine.bundle /workspace/pawroutine-source
cd /workspace/pawroutine-source
git checkout submission-20261028
git branch main HEAD
docker info
export DELIVERY_BIND_ADDRESS=0.0.0.0
bash scripts/delivery.sh init
bash scripts/delivery.sh verify
bash scripts/delivery.sh build
bash scripts/delivery.sh deploy
```

Tag ต้องตรงกับ revision ใน manifest.json และ Jenkins artifact หากใช้ checkout ที่มีอยู่แล้วให้ตรวจ branch/working tree ก่อนเปลี่ยนรุ่น ไม่เขียนทับงานที่ยังไม่ commit Remote GitHub อาจไม่มีรุ่นส่งนี้ จึงใช้ bundle เป็นแหล่งตรวจ offline

เปิดเว็บจาก host ที่ `http://127.0.0.1:3300` เริ่มด้วยบัญชีใหม่ในฐานข้อมูล synthetic แยกจากเว็บเดิมที่ port 3000

ภายใน Course ต้อง bind nested web ที่ `0.0.0.0` เพื่อรับ traffic ที่ outer Docker ส่งเข้า eth0; ชั้น host ถูกจำกัดที่ `127.0.0.1:3300` แล้ว Compose default เมื่อไม่ตั้งค่าคือ loopback เหมาะกับการรันบน host โดยตรง Jenkinsfile ตั้ง bind นี้เฉพาะ agent ของ Course

ต้องเก็บ `.delivery.env` เดิมไว้เมื่ออัปเกรด เพราะ DB volume ใช้รหัสเดิม การสร้างไฟล์ใหม่ไม่เปลี่ยนรหัสในฐานข้อมูลเดิม และอาจทำให้ login DB ไม่สำเร็จ

## เปิด Jenkins และ registry ในกล่อง

```bash
cd /workspace/pawroutine-source
umask 077
printf 'JENKINS_ADMIN_PASSWORD=%s\n' "$(openssl rand -hex 24)" > /workspace/jenkins-private.env
docker compose --env-file /workspace/jenkins-private.env -p pawroutine-ci -f compose.ci.yml up -d --build
```

เปิด `http://127.0.0.1:38080` login `delivery-admin` ใช้รหัสจาก `/workspace/jenkins-private.env` อย่าใส่รหัสนี้ใน Git หรือสไลด์ Job `PawRoutine-delivery` ถูกสร้างจาก local Git checkout `/workspace/pawroutine-source` branch `main` โดยต้องมี commit อยู่ก่อน Bootstrap นี้ใช้เพื่อพิสูจน์ local pipeline; สำหรับทีมให้เปลี่ยน SCM เป็น GitHub และใช้ Multibranch Pipeline/webhook หรือ Poll SCM ตามนโยบายบัญชี

## Pipeline

1. Checkout source และบันทึก commit
2. Production dependency audit → Unit/API → production build → E2E ใน verification container; ถ้าไม่ผ่าน pipeline หยุด
3. Build image tag ตาม full commit SHA
4. Push และ pull image กลับจาก registry ตาม parameter เพื่อยืนยัน manifest/tag ที่ publish
5. Deploy isolated Compose → health และ API smoke
6. Backup → restore ลง DB แยก → เทียบจำนวน core rows
7. Archive log, JSON results, image ID, revision และผลกู้คืน ไม่ archive secret หรือ database dump

ค่าเริ่มต้น registry คือ `127.0.0.1:5000` ภายใน Course ไม่ต้องใช้ credentials เพราะรับเฉพาะ loopback สำหรับ registry ภายนอกต้องตั้ง `REGISTRY_CREDENTIALS_ID` ชนิด username/password ใน Jenkins และใช้ HTTPS ของ registry นั้น ห้ามรัน pipeline จากโค้ดที่ไม่เชื่อถือพร้อม credentials ของทีม

Jenkins agent กับ nested daemon ต้องเห็น absolute workspace path เดียวกัน เพราะ verification bind-mount โฟลเดอร์ evidence Bootstrap Compose แชร์ `/workspace` เพื่อให้ path ตรงกัน

## หยุดและเปิดใหม่

```bash
# ภายใน Course: หยุดเว็บและ DB แต่คง named volume
bash scripts/delivery.sh down
docker compose --env-file /workspace/jenkins-private.env -p pawroutine-ci -f compose.ci.yml down
# บน host: หยุดทั้งกล่องและเก็บ filesystem ภายใน
docker stop pawroutine-course
docker start pawroutine-course
```

อย่าใช้ `down -v` หรือ prune ระหว่างตรวจ หากเริ่ม Course ใหม่โดยลบ container ต้องคัดลอก backup/evidence ออกก่อน Filesystem ของ Course ไม่ใช่แหล่งสำรองถาวร

แหล่งอ้างอิง Jenkins credentials: https://www.jenkins.io/doc/book/pipeline/jenkinsfile/
