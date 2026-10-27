# PawRoutine Project Memory

## เติมจังหวะหน้าแรกโดยไม่ใช้ภาพซ้ำ

ผู้ใช้รู้สึกว่าหน้าแรกโล่ง ให้ยึดส้ม/กรมท่า/ครีม, Google Sans, เส้นวาดมือมนและภาพตกแต่งไม่ซ้ำ เพิ่มแถบ `CareDayStory` ใต้ Hero แสดงตัวอย่างกิจวัตรเช้า–ระหว่างวัน–เย็นด้วยข้อความสั้น ไอคอนเส้น และเส้นประโค้งเล็กน้อย ลดพื้นที่ว่างใน Hero และให้หน้าแรกอ่านต่อเนื่องขึ้นโดยไม่ทำภาพสัตว์หรือ mockup ตารางซ้ำบนหน้าเดียวกัน ดู `features/landing/CareDayStory.jsx` และ `app/brand-handdrawn.css`

## Auth เป็นการ์ดเดียวต่อเนื่อง

ผู้ใช้ขอให้ Login/Register เชื่อมการ์ดซ้ายสีส้มและขวาฟอร์มขาวเป็นกรอบเดียว หลังจากแก้ความกว้าง/สูงของ Register ให้เท่ากันแล้ว ใช้ grid สองคอลัมน์เท่ากันและยืดความสูง, gap 0, ย้าย border/radius/shadow ไปที่กรอบ `auth-grid`, ตัด radius/border ภายในทั้งสองฝั่ง มือถือเรียงบนล่างภายในกรอบเดียว ดู `app/brand-handdrawn.css`

## ปรับการ์ดสีส้มตามภาพอ้างอิงล่าสุด

ผู้ใช้ต้องการการ์ดพื้นส้มทรงมนบนหน้าแรกและแผงด้านซ้ายของ Login/Register คล้ายภาพตัวอย่าง Today แต่ให้เปลี่ยนลวดลาย ภาพของแต่ละตำแหน่งยังต่างกันตามข้อกำหนดห้ามใช้ภาพซ้ำ ปรับ `app/brand-handdrawn.css` ให้ Hero หน้าแรก, CTA ท้ายหน้า และแผง Auth เป็นส้ม `#F59E0B`, มุมมน 22–26px, ข้อความกรมท่าและเส้นวงโค้งจางที่วางต่างตำแหน่งกัน มือถือยังจัดข้อความกับภาพให้อ่านง่าย

## ข้อกำหนดเพิ่มเติม: ห้ามใช้ภาพตกแต่งซ้ำหลายตำแหน่ง

ผู้ใช้ทักว่าภาพเดิมซ้ำถึง 3 จุด ให้จำว่า redesign ต้องออกแบบฉากใหม่ให้แต่ละตำแหน่ง ไม่ใช่เพียงเปลี่ยนสี ขนาด หรือเพิ่ม/ลดตัวละคร ใช้ร่วมเฉพาะสไตล์เส้นโค้งมนวาดมือและสีแบรนด์ แก้แล้ว: Hero คู่สัตว์กับใบไม้, CTA สมุดกิจวัตรกับชามอาหาร, Login แมวนอนบนเบาะใต้จันทร์, Register บ้านกับหัวใจ ภาพหลังสามฉากอยู่ใน `components/CareSceneIllustration.jsx` ข้อกำหนดนี้มีผลเหนือแนวทางใช้ภาพเดียวกันทุกหน้าที่บันทึกก่อนหน้า

## มาตรฐานภาพที่ผู้ใช้ยืนยันล่าสุด — เส้นวาดมือ 24 ตุลาคม 2026

ผู้ใช้แนบภาพตัวครีมหน้าสุนัขเล็กกับกิ่งใบสีครีมบนพื้นส้ม และโลโก้ PetRoutine สองพื้นสี ให้จำลายเส้นนี้สำหรับทุกงานออกแบบต่อไป: โค้งมน ปลาย/มุมมน เบี้ยวอย่างเป็นธรรมชาติเล็กน้อย ไม่ใช้เส้นสั่นหรือรายละเอียดถี่ รูปตัวเป็นก้อนครีมเรียบ หน้าตาเล็ก เส้นหน้ากรมท่า กิ่งใบประมาณ 4–5 หน่วยบน SVG 480px (ประมาณ 4–5px เมื่อแสดงกว้าง 480px) ใบหน้าประมาณ 3–3.5 หน่วย ไอคอนยัง 2–2.5px บนกริด 24 ไม่ทำทุกเส้นหนาเท่ากัน ใช้ตกแต่งอย่างพอดี

คำขอนี้แทนแนวทางภาพ Landing/Auth ก่อนหน้า: ออกแบบทั้ง Landing, Login และ Register ใหม่ให้เป็นครอบครัวเดียวกัน ใช้ `components/CareIllustration.jsx` ร่วมกัน หน้าแรกมีภาพสีส้มกับคู่สัตว์ ฟีเจอร์การ์ดสีอ่อน FAQ แบบเส้นแบ่ง และ CTA ครีม หน้า Auth เป็นภาพเรื่องราวบนพื้นครีมคู่กับฟอร์มการ์ดขาวแยกออกมา Login มีสุนัขหนึ่งตัว Register เพิ่มแมวและข้อความต้อนรับต่างกัน ใช้ `app/brand-handdrawn.css` เป็นชั้นปรับรูปลักษณ์ล่าสุด สีส้มหลัก กรมท่าเสริม และ Google Sans ยังคงเป็นข้อกำหนดหลัก ดู `docs/brand-system.md` ก่อน redesign ครั้งถัดไป

## ยืนยันลำดับสีแบรนด์ 24 ตุลาคม 2026

ผู้ใช้ย้ำให้ **ส้มเป็นสีหลักของระบบ กรมท่าเป็นสีเสริม** หลังทดลองแผงกรมท่าในหน้า Login/Register เปลี่ยนแผงนั้นเป็นส้มอ่อน `#FBE8CC` พร้อมรูปทรงส้ม `#F59E0B` หลังภาพเส้นสมุดบันทึก หัวข้อ/เส้นใช้กรมท่า ไม่กลับไปทำแผงส้มเข้มและคู่สัตว์ซ้ำ Landing เปลี่ยน `:root` ใน `app/globals.css` ให้ action/navigation/selected ใช้ส้ม ครีม และข้อความกรมท่าทั่วระบบ ตัวแปร `--teal*` เป็น alias เดิมที่ตอนนี้ชี้ไปส้ม สถานะสำเร็จ/งานเสร็จยังเขียวเพื่อความหมาย `docs/brand-system.md` เป็นข้อกำหนดล่าสุด

## ปรับภาพหน้าเข้าสู่ระบบ 24 ตุลาคม 2026

ผู้ใช้ชอบโครงและ UX ของหน้า Login/Register แต่แผงส้มและภาพคู่สัตว์ซ้ำกับ Landing เปลี่ยนเฉพาะงานภาพของฝั่งแนะนำเป็นแผงกรมท่า `#243246` ข้อความครีม จุดเน้นส้มอ่อน หัวข้อ “เรื่องเล็ก ๆ ที่เราใส่ใจ” และภาพเส้นกระดาษบันทึก `features/auth/AuthCareDoodle.jsx` แทนภาพคู่สัตว์/เส้นใต้เดิม โครงฟอร์ม login/register และการทำงานยังเดิม เพิ่มสี autofill ให้เข้ากับช่องกรอก ใช้ Google Sans ทั้งหน้า ดู `app/auth-brand.css`

## เปลี่ยนฟอนต์ทั่วระบบ 24 ตุลาคม 2026

คำขอล่าสุดแทนคู่ฟอนต์เก่าทั้งหมด: ใช้ **Google Sans** ภาษาไทยและอังกฤษทั่วเว็บ รวมข้อความสั้น ยาว ฟอร์ม ปุ่ม ตัวเลข microcopy และชื่อแบรนด์ น้ำหนัก 400/500/600/700 ขนาด/ระยะตามบทบาทใน `docs/brand-system.md` ไฟล์ WOFF2 ชุดไทย/Latin/Latin Extended จาก Google Fonts อยู่ใน `public/fonts/google-sans/` พร้อม OFL โหลดด้วย `app/google-sans.css` แบบ local และตั้ง body ใน `app/globals.css` ปิด font synthesis นำ font-family เก่าและ Google Fonts imports เดิมออกจาก CSS หน้า Landing/Today/Auth เปลี่ยนโลโก้ sidebar ภายในเป็น `BrandLogo` HTML wordmark Google Sans 700 สีและภาพเส้นที่ผู้ใช้ชอบยังยึดข้อกำหนดเดิม ธีมสีทั้งระบบยังไม่ได้ขยายไปทุกหน้าภายใน

แหล่งข้อมูล Google Sans เป็นฟอนต์เปิด: `https://github.com/googlefonts/googlesans` และ CSS API ของ Google Fonts มี subset ภาษาไทย น้ำหนัก 400–700 ตรวจจาก response จริงวันที่ 24 ตุลาคม 2026

## ประวัติงานแบรนด์ก่อนเปลี่ยนเป็น Google Sans

ผู้ใช้ยืนยันว่าชอบสไตล์ PetRoutine ชุดปัจจุบัน และให้จำเป็นแนวทางหลักทุกครั้งที่ redesign หรือเปลี่ยนสี: ครีม/ส้ม/กรมท่า, Mitr 400/500, Nunito 400/600/800, Mali 500/700 เฉพาะจุด, ภาพเส้นวาดมือเรียบง่ายโค้งมน และไอคอนเส้น 2–2.5px ชุดเดียวกัน ดู `docs/brand-system.md` ก่อนงานออกแบบครั้งต่อไป

ขยายธีมไปยังหน้า login/register แล้ว: แยก `features/auth/AuthScreen.jsx` จาก `app/page.jsx`, ใช้ `app/auth-brand.css`, โลโก้ component, ภาพเส้นคู่สัตว์, ฟอร์มสีครีม/ส้ม, hint รหัสผ่านตอนสมัคร, error และ responsive layout การเรียก API login/register และ session ยังใช้ flow เดิม หน้าอื่นนอกจาก Landing/Today/Auth ยังไม่ได้ขยายธีมทั้งระบบ

## ตัวอย่างแบรนด์ 24 ตุลาคม 2026

**มาตรฐานล่าสุดแทนการลองฟอนต์ก่อนหน้า:** ผู้ใช้กำหนด Mitr 400/500 สำหรับไทย, Nunito (ไม่ใช่ Nunito Sans) 400/600/800 สำหรับอังกฤษ/ชื่อแบรนด์/UI, Mali 500/700 สำหรับ microcopy เขียนมือ ใช้ใน Landing และ Today ผ่าน `app/brand-fonts.css` ลด Mali ให้มีเฉพาะ note/คำทักทาย Font synthesis ปิดและไทย fallback ไป Mitr น้ำหนักที่มี โลโก้ component `BrandLogo.jsx` คงเส้นสัญลักษณ์เดิมและ render wordmark ด้วย Nunito 800 เพื่อไม่พึ่งฟอนต์ใน external SVG ไอคอนกลาง stroke 2.25 บนกริด 24 สีกรมท่า/ส้มที่เลือก/พื้นครีม ดู [มาตรฐานแบรนด์](brand-system.md) เป็นข้อกำหนดอ้างอิงหลักของงานออกแบบต่อไป

ผู้ใช้ขอไอคอนให้ไม่เป็นทางการและเข้ากับเส้นตกแต่ง: ออกแบบชุดเส้นมน/โค้งไม่สมมาตรเล็กน้อยใน `components/Icon.jsx` ใช้ stroke 2, currentColor, ขนาด 16–24px เปลี่ยน local Icon ใน page orchestrator ให้ใช้ชุดกลางเดียวกับฟีเจอร์ต่าง ๆ ครอบคลุม navigation/action/pet/search/calendar/dropdown และ task disclosure; Pets เป็นคู่สัตว์แทนอุ้งเท้า ไอคอน alert มีสัญลักษณ์เตือนจริงแทน fallback เดิม ปุ่ม/ข้อความ/การทำงานเดิมคงอยู่ โลโก้ต้นฉบับไม่เปลี่ยน

**คู่ฟอนต์ล่าสุดสำหรับ Landing:** ผู้ใช้เลือก Kodchasan สำหรับหัวข้อ และ IBM Plex Sans Thai Looped สำหรับข้อความยาว แทน Thonburi/LINE Seed ในหน้าแรก โหลด Google Fonts ด้วย CSS import น้ำหนัก 400/500/600/700 หัวข้อ Kodchasan 600, เนื้อหา/ปุ่ม/เมนู/ข้อมูลใช้ IBM Plex Sans Thai Looped; สีและ doodles แบบลดจำนวนคงเดิม Today ยังเป็นธีมตัวอย่าง Mitr/Nunito ไม่ขยายทั้งระบบเอง

คำขอฟอนต์ถัดมา: ลอง **Thonburi** เฉพาะ Landing ตั้ง CSS font stack ให้ Thonburi มาก่อน LINE Seed ทุกตำแหน่ง รวมข้อความอังกฤษ/เวลา แต่ยังไม่มีไฟล์ Thonburi ในโปรเจกต์หรือ Windows Fonts จึงแสดงจริงได้เฉพาะเครื่องที่ติดตั้งฟอนต์นั้น เครื่องอื่นใช้ LINE Seed สำรอง ขอไฟล์ .woff2/.ttf จากผู้ใช้แล้ว อย่าอ้างว่า Windows แสดง Thonburi ได้ก่อนมีไฟล์ที่ใช้ฝังเว็บ

ผู้ใช้ขอให้ดาวน์โหลด Thonburi ให้: ตรวจ Apple Developer System Fonts และหน้า Fonts แล้ว พบว่าเป็น system font บนแพลตฟอร์ม Apple แต่ยังไม่พบลิงก์ดาวน์โหลดแยกสำหรับฝังเว็บจาก Apple จึงยังไม่ได้ดาวน์โหลด/ฝังไฟล์ Thonburi ตั้ง CSS priority แล้วและ build/deploy ผ่านเท่านั้น บน Windows ที่ไม่มีฟอนต์ยังเป็น LINE Seed ไม่อ้างว่าเปลี่ยนรูปลักษณ์เป็น Thonburi สำเร็จ

คำขอฟอนต์ล่าสุดแทน Mitr เฉพาะหน้าแรก: ใช้ **LINE Seed Sans EN + TH** แบบ self-hosted WOFF2 จาก ZIP ทางการ v1.003 เก็บ Regular/Bold และ OFL ใน `public/fonts/line-seed` กำหนด UI 400/500/700; ชุดทางการไม่มี Medium ดังนั้น CSS 500 จับคู่ Regular (แจ้งผู้ใช้แล้ว ไม่อ้างว่ามี Medium จริง) Today ยัง Mitr/Nunito ตามเดิม ลด doodles เหลือเส้นใต้หัวข้อ กิ่งใบในส่วนฟีเจอร์ และคู่สัตว์ใน CTA เท่านั้น ตัดประกาย/เส้นประ/คู่สัตว์หัวหน้าและหัวใจออก ปรับเส้นหลักประมาณ 4–5 หน่วย SVG เพื่อใกล้ภาพตัวอย่าง

ผู้ใช้ชอบของตกแต่งเหมือนวาดเส้นที่เข้ากับโลโก้ และส่งตัวอย่างแถบ Amber/ภาพเส้นโทนครีม เพิ่มเฉพาะ Landing ด้วย `features/landing/BrandDoodle.jsx` (inline SVG ตกแต่งแบบ aria-hidden/pointer-events none): คู่สุนัข–แมว เส้นใต้หัวข้อ ประกาย กิ่งใบและเส้นประ พร้อม CTA ท้ายหน้า Amber/ปุ่มเข้ม/รูปครีม มือถือจัดภาพ CTA ใต้ข้อความ ไม่มีการแก้โลโก้ต้นฉบับหรือเพิ่มฟังก์ชันใหม่

คำขอฟอนต์ล่าสุด: ให้เข้ากับโลโก้และดูวัยรุ่น/ไม่เป็นทางการ ปรับเฉพาะ Landing และ Today จาก Anuphan เป็น **Mitr สำหรับไทย + Nunito Sans สำหรับอังกฤษ/ตัวเลข** ตั้ง Nunito Sans ก่อนแล้ว fallback ไทยเป็น Mitr หัวข้อหลักใช้น้ำหนัก 500 และระยะอักษรไทยไม่บีบแน่น ยังคงขอบเขตธีมตัวอย่าง 2 หน้า

คำขอต่อมาให้ปรับหน้าแรก `localhost:3000`: หน้า Landing ก่อนล็อกอินใช้ PetRoutine/Amber แล้ว แยกเป็น `features/landing/LandingPage.jsx` และธีม scoped `.landing.brand-public` ใน `app/landing-brand.css` ใช้ฟอนต์ชุดเดียวกับ Today มีตารางดูแลตัวอย่างซึ่งติดป้ายข้อมูลสมมติ ฟีเจอร์ FAQ และ CTA; ชื่อแท็บเปลี่ยนเฉพาะขณะอยู่หน้า Landing หน้า Auth และหน้าระบบอื่นนอกจาก Today ยังเป็นธีมเดิม ยังไม่ได้อนุมัติการเปลี่ยนแบรนด์ทั้งระบบ

ผู้ใช้ให้ Brand Board/SVG จากโฟลเดอร์ `petroutine-brand-system` และขอดูเพียง 1 หน้าก่อน ปรับเฉพาะ Today ด้วย `.app-shell.brand-preview-today` และ `app/today-brand-preview.css`: Amber, พื้นอุ่น/การ์ดขาว, Anuphan/Nunito Sans และโลโก้ PetRoutine (`public/assets/brand/petroutine-logo.svg`) มีสรุปจำนวนงานจากข้อมูลจริง 3 ช่อง เมนู/ฟอนต์/สีเปลี่ยนเฉพาะขณะเลือก Today **ยังไม่อนุมัติเปลี่ยนทั้งระบบหรือ rename ชื่อทางเทคนิค** หน้าระบบอื่นคงแบรนด์ PawRoutine เดิมเพื่อเปรียบเทียบ ต้นฉบับนอก workspace ไม่ถูกแก้ไข

## สถานะที่ใช้ส่งต่องาน — 23 ตุลาคม 2026

ส่วนนี้ใช้แทนข้อความเก่าด้านล่างที่ขัดกัน:

- ผู้ใช้ต้องการสื่อสารภาษาไทย และ UI ต้องกระชับ อ่านง่าย ใช้ control ของระบบแทน browser dropdown/search/textarea ที่ยังไม่ได้จัดรูปแบบ
- หน้ากิจวัตรหลักใช้ `features/routines/RoutinesView.jsx`: แถวชื่อ/สัตว์/กิจกรรม เวลา/รูปแบบทำซ้ำ ผู้รับผิดชอบ และแก้ไข/ลบ พร้อมค้นหา กรองสัตว์ และแบ่งครั้งละ 10 รายการ แท็บกิจวัตรรายสัตว์ใช้ `RoutineRows` ชุดเดียวกัน แต่ยังไม่ได้แบ่งหน้า รายละเอียดเสริมพับได้
- `components/ConfirmationProvider.jsx` ครอบ root layout ให้ `useConfirmation()` เปิดหน้าต่างยืนยันแบบ Promise ก่อนบันทึกฟอร์มและเปลี่ยนสถานะสำคัญ เช่น Complete/Skip/Reopen/Undo เลื่อนเวลา มอบหมาย ติดตามสุขภาวะ จัดการสมาชิก และตั้งค่า/ความยินยอม AI มี focus trap, Escape, คืน focus และทำพื้นหลัง inert; ยกเลิกแล้วไม่เรียก mutation
- ปุ่มและข้อความการนำรายการออกใช้คำว่า “ลบ” ทั่ว UI รวม Health Records, Passport และเช็กอิน ไม่ใช้ “เก็บข้อมูลเก่า” Backend ยังเป็น soft archive และรักษาประวัติ ไม่ใช่ hard delete ลบสัตว์/กิจวัตรมี popup ยืนยันเดิม ลบบ้านต้องพิมพ์ชื่อบ้าน
- Dropdown ใช้ `SelectField` และชุดตัวเลือก `lib/form-options.js` พร้อมคำอธิบาย ตัวเลือกสัตว์/สมาชิกตามบ้าน และอีเมลแยกคนชื่อซ้ำ ผู้รับผิดชอบแสดงในฟอร์มกิจวัตรหลัก ดู [รายการฟอร์ม](popup-fields.md)
- DatePicker กลางแก้ปฏิทินใน modal ที่ถูกตัด/ล้นขอบ: ใช้ HTML Popover top layer, ตำแหน่ง fixed ตาม trigger/visual viewport, พลิกบน/ล่างและปรับความกว้าง มี ResizeObserver/scroll listener; ตารางวันไม่ใช้ความกว้างคงที่ และ Escape ปิดปฏิทินก่อน popup แม่ ยังไม่ได้ทดสอบ interaction ด้วย E2E หลังแก้
- นำส่วน Getting Started, Recovery Tools, รูปและข้อมูลติดต่อ และลิงก์เลือกแม่แบบ Quick Add ออกจาก UI แล้ว ไม่เพิ่มกลับโดยไม่มีคำขอ ส่วน pause toggle/ตัวกรองพักกิจวัตรถูกนำออก แต่ schedule bounds/pauses และ API เดิมยังอยู่
- Migration 016 เพิ่ม invite expiry, ช่องรูป/ติดต่อ และผลติดตาม Owner เปลี่ยนรหัสเชิญอายุ 7 วัน นำสมาชิกออก และโอนเจ้าของได้แล้ว; API รูป/กู้คืนยังอยู่ แต่ไม่มีส่วนรูป/ติดต่อหรือกู้คืนใน UI
- AI จำกัดถามค้นและสรุปข้อมูลที่มีสิทธิ์เข้าถึงพร้อมอ้างอิง ไม่มีการสร้าง/แก้ข้อมูลด้วย AI ไม่เพิ่มขอบเขต Phase ใหม่เอง
- หลักฐานก่อนเพิ่ม confirmation รอบล่าสุด: E2E 12 ผ่าน/2 ข้าม และ targeted care screens desktop/mobile 2 ผ่าน หลังเพิ่ม confirmation/รายการกิจวัตร: `docker compose build web` ผ่าน, deploy ด้วย `docker compose up -d web`, health `ok/ok` **ยังไม่ได้รัน unit/API/E2E ใหม่หลังเปลี่ยน flow ยืนยัน** งานต่อหากผู้ใช้ขอทดสอบคือปรับ E2E ให้ตอบ dialog และตรวจ cancel/confirm/keyboard บน desktop/mobile
- Working tree มีงานเดิมจำนวนมาก ไม่ reset/stage/commit/push เอง เอกสารรอบนี้ไม่ได้เปลี่ยน runtime หรือรัน tests เพิ่ม

**20 ตุลาคม 2026 — AI ไม่จำกัดในโหมดทดสอบ:** `.env` ที่ไม่ติด Git ตั้ง `PAWROUTINE_AI_HOURLY_LIMIT=0` เพื่อปิดโควตาคำขอต่อชั่วโมงของแอปชั่วคราว ค่าเริ่มต้นเมื่อไม่ตั้งคือ 10 คำขอต่อผู้ใช้ต่อชั่วโมง ข้อจำกัด 500 ตัวอักษรต่อคำถาม, การยินยอม, การตรวจสิทธิ์ และโควตาของ AI Provider ยังทำงานตามเดิม UI อ่านค่า limit จาก API

**20 ตุลาคม 2026 — แก้ AI Provider 404:** `.env` ของ runtime ถูกตั้ง `AI_MODEL=gemini-1.5-flash-lite` ทำให้ Provider ตอบ HTTP 404 และ UI แสดง “บริการ AI ไม่พร้อมใช้งานในขณะนี้” เปลี่ยนเป็น `gemini-3.5-flash-lite` ซึ่งตรวจ model และ JSON completion จากใน Docker ได้ HTTP 200 เพิ่มข้อความผิดพลาดเฉพาะ 401/403, 404, 429 และแก้ `ai:check` ให้ใช้ `max_tokens=700` เท่ากับแอป ตรวจ `npm test` 68/68 และ rebuild Docker แล้ว

**20 ตุลาคม 2026 — AI Chatbot:** เพิ่มปุ่มถาม AI มุมขวาล่างทุกหน้าหลังล็อกอิน เลือกสัตว์เลี้ยงรายตัวหรือทุกตัวในบ้านและช่วงย้อนหลัง 7/30/365 วัน พิมพ์คำถามไทยได้ คำตอบใช้ข้อมูลที่มีสิทธิ์เข้าถึงและลิงก์บันทึกต้นทาง; ประวัติอยู่ใน client memory เท่านั้น เปลี่ยนสัตว์เลี้ยงหรือบ้านแล้วล้างบทสนทนา สมาชิกยินยอมครั้งเดียวต่อบ้านและถอนใน Settings ได้ Migration 012 เพิ่ม intent `chat_question`, Migration 013 จำความยินยอม และ Migration 014 รองรับคำถามระดับบ้าน ผู้ใช้ขอให้ build/test/redeploy หลังแก้เสร็จ

**20 ตุลาคม 2026 — Phase 11 AI:** Key ที่ผู้ใช้ใส่ใน `.env.example` ถูกย้ายไป `.env` ซึ่ง Git ไม่ติดตามและไฟล์ตัวอย่างถูกล้างค่า ใช้ Gemini 3.5 Flash Lite ผ่าน endpoint OpenAI-compatible; live model และ JSON completion check ผ่าน เจ้าของบ้านต้องเปิด AI รายบ้านก่อน สมาชิกยินยอมครั้งแรกของแต่ละบ้าน หน้าผู้ช่วยสรุปข้อมูลแยกถูกนำออก เหลือ Chatbot แบบอ่านอย่างเดียว

## Current AI Phase 11 status (verified 2026-10-20)

- Current product UI is the optional read-only chatbot; the separate Daily Care Summary and Wellness Question modes were retired. Chat can answer questions about one pet or all pets in a household over 7/30/365 days.
- Backend checks authenticated household access and consent. Context can include pet profiles, tasks/routines, check-ins, care and health records, passport and open alerts/follow-ups; at most 240 facts are sent per request. Output must be JSON and cited source IDs must exist in the submitted context.
- OpenAI-compatible server adapter uses `PAWROUTINE_AI_ENABLED`, `AI_API_KEY`, `AI_MODEL`, and `AI_BASE_URL`; Compose forwards these values. Local `.env` now holds the key, Gemini model and enabled server flag. New households keep AI off until the owner opts in.
- Member consent is stored per household in `household_members.ai_consent_at`, checked server-side for every request, and revocable in Settings. No AI writes or diagnosis/medication advice. Request log stores metadata only, not prompts or answers. Default quota is 10 requests per user per hour; this local test environment sets `PAWROUTINE_AI_HOURLY_LIMIT=0`. Migrations 011–014 support AI and migration 015 supports follow-up completion.
- Verification on 20 Oct 2026: `npm test` 68/68, full Playwright E2E 10 passed/2 platform skips, `npm run build`, synthetic live provider check HTTP 200, actual PDF download and Docker health `ok/ok`. The old E2E selectors were updated and the mobile Today overflow was fixed.

## Product decisions

- Thai-first household care coordinator สำหรับสุนัข/แมว; `Asia/Bangkok` เป็นเวลาอ้างอิง
- Today เป็นหน้าหลัก Complete มีหมายเหตุ optional และต้องยืนยันก่อนบันทึก; Skip ต้องมีเหตุผลและยืนยัน
- Quick Add ใช้ร่วมกันบน desktop/mobile และมี wellness/routine/appointment/care/health; ลิงก์แม่แบบถูกนำออกจาก UI
- health data เป็นข้อความ/ตัวเลขที่ผู้ใช้กรอกเอง ไม่มีไฟล์และไม่ให้คำแนะนำแพทย์
- schedule canonical v2 รองรับ weekly หลายวัน/เวลา, interval, once, bounds และ pauses โดยอ่าน legacy ได้
- สมาชิกเปลี่ยน occurrence ได้ Owner ดูแล routine/pet lifecycle; care/health ให้ creator หรือ Owner แก้/archive
- ทุก product mutation ต้องมี Activity แบบ sanitized และ transactional; account log ต้องไม่รั่วเข้าบ้าน
- Undo งานได้ 8 วินาทีและต้องไม่ย้อนทับการเปลี่ยนของสมาชิกคนอื่น
- Owner เท่านั้นที่ลบบ้านได้หลังพิมพ์ชื่อยืนยัน บ้าน archived ต้องถูกซ่อน ปิดทุก data access และไม่แสดงรายการถังขยะใน UI โดยข้อมูลลูกยังอยู่ครบ
- ทุก child mutation ต้องถือ shared lock ของ household ใน transaction เดียวกัน ส่วน archive ถือ update lock; data query ต้องตรวจ `households.archived_at IS NULL` ซ้ำเพื่อไม่ให้ check/use แยกกันเปิดช่อง race หรือข้อมูลรั่ว
- หน้า “ประวัติการเปลี่ยนแปลง” ถูกนำออกจาก navigation/UI ตามการตัดสินใจ 12 ต.ค. 2026 แต่ Activity audit และ Undo ภายในยังคงทำงาน
- อนุมัติทิศทางรวม PawRoutine กับ Pet Wellness Intelligence แบบ Wellness-first: structured daily data → baseline 14 วัน → rule-based detection → dashboard/report → AI optional ท้ายสุด
- Phase 5 ใช้ `pet_passport_entries` แยกจาก event-based `pet_health_records`; โปรไฟล์ Wellness เป็น optional และ Passport mutation ใช้ creator/Owner permission, soft archive, Activity และ Timeline
- Phase 5–10 ต้องทำงานครบโดยไม่พึ่ง AI; AI Phase 11 ห้ามคำนวณตัวเลขเอง วินิจฉัยโรค หรือคำนวณยา และต้อง fallback ไป Rule-based ได้
- Daily Wellness ช่องว่างหมายถึงไม่มีข้อมูล ไม่ใช่ค่า 0; baseline/alert ต้องแยก pet+metric, deterministic และตรวจย้อนกลับข้อมูลต้นทางได้
- Phase 6 ใช้ `pet_wellness_logs`; สมาชิกสร้าง/อ่านได้ ผู้สร้างหรือ Owner แก้/archive ได้ รองรับ backfill และหลายบันทึกต่อวัน พร้อม Activity/Timeline
- Phase 7 ใช้ derived Baseline Engine ไม่มี snapshot table: หน้าต่าง 14 วัน Bangkok, หนึ่งค่าล่าสุดที่ไม่เป็น `NULL` ต่อ metric ต่อวัน, พร้อมเมื่อครบ 14 วัน, categorical ใช้ mode/tie-break คงที่, น้ำหนักใช้ median และคืน source dates/log ids
- Phase 8 ใช้กฎ deterministic: relative metrics เปลี่ยนอย่างน้อย 1 ระดับทิศเดียวกัน 3 วัน, stool/mood เป็นค่าใหม่ชนิดเดียวกัน 3 วัน, น้ำหนักเปลี่ยนอย่างน้อย 10% ทิศเดียวกัน 3 วัน; วันที่ขาดตัดลำดับ และกลับสู่ปกติ 2 วันจึง resolve
- Phase 9 ใช้ read-only derived Dashboard Engine ไม่มี snapshot table: รวม Daily Wellness, baseline และ active alerts; รองรับ 7/14/30/90 วัน, วันที่ขาดเป็น gap, แสดง 7 metrics พร้อม baseline band และสถานะรวมที่ให้ active alert มีลำดับสูงสุด
- Phase 10 ใช้ in-app reminder จากข้อมูลจริงเท่านั้น: task, `next_due_date` ของ vaccination/appointment และวันติดตาม Alert; ผู้ใช้ตั้งระยะเตือนสุขภาพ 7/14/30/60/90 วันได้ โดยยังไม่มี email/push
- ผู้ใช้ลบแจ้งเตือนได้แบบ persistent เฉพาะบัญชีผ่าน `notification_dismissals`; ไม่ลบข้อมูลต้นทางและกำหนดใหม่จะสร้าง notification key ใหม่
- แผงแจ้งเตือนจัดกลุ่มรายการที่ควรดูตอนนี้/กำลังจะถึง และมี “ลบทั้งหมด” พร้อมยืนยัน โดยส่ง `notification_keys` ของรายการที่แสดงไปยัง `POST /households/{id}/notifications/dismiss-all` เพื่อซ่อนเฉพาะบัญชีนี้
- โหมดมืดใช้กรมท่า/ครีม/ส้มตาม `docs/brand-system.md` และ `app/dark-mode.css`; ตัวสลับอยู่ทั้งหน้าในระบบ หน้าแรก และ Login/Register ค่าที่เลือกเก็บใน `pawroutine_theme` บนอุปกรณ์ หรือใช้ค่า OS หากยังไม่ได้เลือก
- Shared Monitoring เก็บผู้ติดตาม วันติดตาม และหมายเหตุบน Alert; สมาชิกบ้านอัปเดตได้ การกำหนด follow-up เปลี่ยนสถานะเป็น `monitoring` และเขียน Activity แบบ transactional
- Vet Report เป็น read-only derived report ช่วงไม่เกิน 366 วัน ไม่มี AI/diagnosis/dose calculation; ปัจจุบันดาวน์โหลด PDF ฝั่ง browser
- ปุ่ม Vet Report ดาวน์โหลด PDF โดยตรงจาก browser ด้วย `html2pdf.js`; ไม่เปิดหน้าต่าง Print และยังไม่มี PDF endpoint ฝั่ง server
- Phase 11 Chatbot แบบ optional/read-only ใช้งานและผ่าน live-provider verification ด้วยข้อมูลสังเคราะห์แล้ว; Natural-language Care Log ยังอยู่นอกขอบเขต

## Technology decisions

Next.js 15 + React 19 + PostgreSQL 16 + Node/Playwright Docker Compose ใช้ named volume Migration 001–016 เป็น additive โปรเจกต์มี Git repository และ initial release commit แล้ว; ห้าม commit/push โดยผู้ใช้ไม่ได้ขอ

- Deployment contract: ผู้ใช้เข้าระบบผ่าน `http://localhost:3000` เพียงพอร์ตเดียว
- Web และ API อยู่ origin เดียวกัน; PostgreSQL ไม่แชร์ host port กับเว็บและอยู่หลัง Docker private network ที่ `db:5432`
- `docker-compose.dev.yml` เป็นเครื่องมือเฉพาะงานพัฒนา ไม่ใช่ค่าเริ่มต้นสำหรับการใช้งานระบบ

## Verification memory

- Unit/API tests ครอบคลุม migration, schedule boundaries, permissions, idempotency, conflict, Undo, care/health, Activity isolation, Timeline และ household trash/restore
- Playwright runner สร้าง schema สุ่ม เริ่ม Next dev server และลบเฉพาะ schema นั้น
- Compose ปกติเปิดสู่ host เฉพาะ web ที่ `localhost:3000`; PostgreSQL อยู่ใน private Docker network ที่ `db:5432`
- เมื่อต้องพัฒนา/ทดสอบจาก host ให้ใช้ `docker-compose.dev.yml` ซึ่ง bind PostgreSQL เฉพาะ `127.0.0.1:55430`
- 11 ต.ค. 2026: `npm test` ผ่าน 41/41, production build ผ่าน, Playwright desktop/mobile ผ่าน 2 และ skip 2 ตาม project guard รวม typed confirmation, trash/restore และ preservation ของ pet/routine/care/health; Docker health `ok/ok`, host เปิดเฉพาะ port 3000 และผู้ใช้เดิม 5 รายการยังอยู่
- 11 ต.ค. 2026: cleanup ก่อนเตรียม GitHub ลบ legacy app, starter copy, generated output/log, local SDD ledger, เอกสารแผนเก่า และ `AppShell.jsx` ที่ไม่มี runtime import; เปลี่ยนชื่อ Activity/Timeline test และ AI doc ให้ตรงผลิตภัณฑ์ พร้อมขยาย `.gitignore`/`.dockerignore`; หลัง cleanup `npm test` ผ่าน 41/41 และ production build ผ่าน
- 11 ต.ค. 2026: Phase 5 ผ่าน `npm test` 43/43, production build และ Playwright desktop/mobile (2 passed, 2 project skips); deploy ที่ `localhost:3000` แล้ว Docker health `ok/ok`, migration 006 ครบ, PostgreSQL ไม่เปิด host port และผู้ใช้เดิม 5 รายการยังอยู่
- 11 ต.ค. 2026: Phase 6 ผ่าน `npm test` 45/45, production build และ Playwright desktop/mobile (2 passed, 2 project skips); deploy ที่ `localhost:3000` แล้ว Docker health `ok/ok`, authenticated read-only smoke 19 เส้นทางตอบ 200, migration 007 เพิ่ม Daily Wellness แบบ nullable, PostgreSQL ไม่เปิด host port และข้อมูลเดิมยังอยู่ (ผู้ใช้ 5, บ้าน 5, สัตว์ 6)
- 11 ต.ค. 2026: Phase 7 ผ่าน `npm test` 49/49, production build และ Playwright desktop/mobile (2 passed, 2 project skips); deploy ที่ `localhost:3000` แล้ว Docker health `ok/ok`, Baseline smoke ตอบ 200 พร้อม 7 metrics, ไม่มี 500, PostgreSQL ไม่เปิด host port และข้อมูลเดิมยังอยู่ (ผู้ใช้ 5, บ้าน 5, สัตว์ 6)
- 11 ต.ค. 2026: Phase 8 ผ่าน `npm test` 55/55, production build และ Playwright desktop/mobile/Alert (3 passed, 3 project skips); deploy ที่ `localhost:3000` แล้ว migration 008 และ Docker health `ok/ok`, ไม่มี 500, PostgreSQL ไม่เปิด host port และข้อมูลเดิมยังอยู่ (ผู้ใช้ 5, บ้าน 5, สัตว์ 6)
- 12 ต.ค. 2026: Phase 9 ผ่าน `npm test` 60/60, production build และ Playwright desktop/mobile/Dashboard+Alert (4 passed, 2 project skips); deploy ที่ `localhost:3000` แล้ว Docker health `ok/ok`, ไม่มี 500, PostgreSQL ไม่เปิด host port และข้อมูลเดิมยังอยู่ (ผู้ใช้ 5, บ้าน 5, สัตว์ 6); ไม่มี migration ใหม่
- 12 ต.ค. 2026: Phase 10 ผ่าน `npm test` 62/62, production build และ Playwright reminders/shared follow-up/Vet Report/print media ทั้ง desktop และ mobile (6 passed, 2 project skips); deploy ที่ `localhost:3000` แล้ว Docker health `ok/ok`, log ไม่มี 500, migration 009 ครบ, PostgreSQL ไม่เปิด host port และข้อมูลเดิมยังอยู่ (ผู้ใช้ 5, บ้าน 5, สัตว์ 6)
- 12 ต.ค. 2026: refinement หลัง Phase 10 นำ Change History และรายการบ้านที่ลบออกจาก UI, เปลี่ยน navigation เป็นอังกฤษ และเพิ่ม notification dismissal รายผู้ใช้ด้วย migration 010; `npm test` 62/62, build และ E2E 6 passed/2 skipped ผ่าน ก่อน deploy ที่ `localhost:3000`, health `ok/ok`, log ไม่มี 500 และข้อมูลเดิมยังอยู่ (ผู้ใช้ 5, บ้าน 5, สัตว์ 6)
- 19 ต.ค. 2026: Phase 11 plan ถูกจัดทำ; `npm test` 63/63 และ production build ผ่าน, Docker deploy ตอบ HTTP 200; ทดสอบสร้าง PDF จริงด้วย Chromium ได้ MIME `application/pdf` และ header `%PDF-`; E2E ไม่ได้รันซ้ำหลัง refinement ล่าสุด

## Known limitations

ไม่มี upload หรือ push/email ในรุ่นปัจจุบัน; AI/LLM ใช้ผ่าน Chatbot แบบ optional เท่านั้น และไม่มี server-generated PDF endpoint (Vet Report ดาวน์โหลด PDF ฝั่ง browser); invite expiry/rotate และนำสมาชิกออก/โอนเจ้าของทำแล้ว; Jenkins/Course Container ยังไม่ตรวจในสภาพแวดล้อมส่งมอบ Catch-all API route และ page orchestrator ยังควรแยกเพิ่มเติมในงาน maintainability ภายหลัง

## Guardrails

AI Provider ผ่านเพียง synthetic live smoke check ยังไม่ใช่การรับรองคุณภาพคำตอบหรือ Course Container; อย่าอ้างว่ามี medical intelligence; อย่าตีความ missing wellness data เป็น 0; อย่าลบข้อมูล care history หรือ household graph เมื่อ archive; อย่าเปิด archive/restore ให้ member; อย่าใช้ `docker compose down -v` กับข้อมูลผู้ใช้; อย่า publish PostgreSQL ออกทุก network interface; อย่าเปลี่ยน public URL จาก `localhost:3000` โดยไม่มีการตัดสินใจใหม่
**20 ตุลาคม 2026 — Today/Calendar และ AI ทุกตัว:** กำหนดจากสมุดสุขภาพ (`next_due_date` ทุกประเภท), นัดหมาย/วัคซีนที่ลงบันทึกล่วงหน้า และวันติดตามสุขภาวะ แสดงใน Today/Calendar แยกจากงานที่กดเสร็จได้ แชตเลือกทุกตัวในบ้านหรือรายตัว และย้อนหลัง 7/30/365 วัน; AI อ่านโปรไฟล์ งาน/กิจวัตร เช็กอิน บันทึกดูแล/สุขภาพ สมุดสุขภาพ และ alert ที่ยังเปิดอยู่ ข้อมูลส่งจำกัด 240 facts ต่อคำขอ จำกัด 10 คำขอ/ผู้ใช้/ชั่วโมง และ 500 ตัวอักษร/คำถาม Migration 014 รองรับ audit ระดับบ้าน
**20 ตุลาคม 2026 — ปรับ Today และ AI:** วันติดตามสุขภาวะกดเสร็จแล้วใน Today ได้ บันทึกผู้ทำและเวลาใน migration 015; รายการย้ายไปส่วนเสร็จแล้ว ปฏิทินเห็นสถานะเสร็จ และการแจ้งเตือนวันเดิมหยุด โดย alert สุขภาวะยังไม่ถูกระบุว่ากลับสู่ปกติ หน้าผู้ช่วยสรุปข้อมูลถูกนำออกจาก sidebar และ API ปฏิเสธ intent ของสรุปรายวัน/แนวโน้ม เหลือ AI Chatbot สำหรับถามข้อมูลเท่านั้น

**23 ตุลาคม 2026 — สถานะแผน:** Phase 0–11 ในขอบเขตผลิตภัณฑ์ปัจจุบันทำแล้ว ยังไม่มี Phase 12 ที่อนุมัติ งานต่อคือ Delivery track: ประเมินคำตอบ AI กับข้อมูลสังเคราะห์, ตรวจ Course Container, Git remote/commit/push ตามคำสั่งผู้ใช้, Jenkins/registry, demo evidence และ rollback/runbook ไฟล์แนบ, push/email และ Behavior Coach เป็น deferred backlog; invite lifecycle และนำสมาชิกออก/โอนเจ้าของทำแล้วใน care experience ภายหลัง ส่วน UI รูป/กู้คืนถูกนำออกตามคำขอ

**ผลทดสอบเต็มชุด 20 ตุลาคม 2026:** unit/API 68/68, Playwright E2E 10 ผ่าน/2 ข้ามตามเงื่อนไขแพลตฟอร์ม, production build ผ่าน, AI provider model/completion HTTP 200, PDF download จริงผ่านลายเซ็น `%PDF-`, Docker rebuild แล้วหน้าเว็บ HTTP 200 และ health `ok/ok` E2E ใช้ schema แยก ส่วน CSS Today/task list ถูกแก้ให้หน้า 375px ไม่ล้นและกดแถบ Add ได้
**24 ตุลาคม 2026 — CI ภายในระบบ:** ผู้ใช้ให้ SVG โปรไฟล์เริ่มต้นแมว/สุนัขและต้องการให้หน้าภายในต่อเนื่องกับ Landing, Login, Register ที่เคยปรับไว้: Google Sans, ส้มเป็นหลัก กรมท่าเสริม ครีม ลายเส้นโค้งปลายมนแบบวาดมือ ใช้ภาพประกอบอย่างประหยัดและไม่ทำซ้ำหลายจุด ปรับ shell เมนู การ์ด ปุ่ม แท็บ ปฏิทิน และหน้าสัตว์เลี้ยงผ่าน `app/system-brand.css`; ใช้ `components/PetAvatar.jsx` กับ SVG ใน `public/assets/brand/` เป็นรูปเริ่มต้น ดูรายละเอียดที่ `docs/brand-system.md`.

**24 ตุลาคม 2026 — ความสม่ำเสมอของ UI:** ใช้คลาส `brand-workspace` กับทุกหน้าหลังเข้าสู่ระบบ แทนการเปิดธีมเฉพาะ Today; ส่วนหัวและ sidebar จึงใช้กฎเดียวกันทุกเมนู หน้า Pets ใช้ขนาดการ์ด แถบแท็บ และพื้นที่เนื้อหาเดียวกันใน ภาพรวม กิจวัตร สุขภาพ ไทม์ไลน์ และรายงานสัตวแพทย์ โดยไม่เปลี่ยนความกว้างหรือแสดง/ซ่อน rail ตามแท็บ การตรวจ E2E desktop/mobile อยู่ที่ `tests/e2e/workspace-consistency.spec.mjs`.

**24 ตุลาคม 2026 — Today redesign:** ผู้ใช้ส่งภาพอ้างอิงหน้า Today ที่ชอบและขอออกแบบใหม่โดยคงฟีเจอร์เดิม ทำการ์ดต้อนรับสีส้ม ภาพเส้นวาดมือใหม่ การ์ดงานถัดไป ตัวเลขสรุปจากข้อมูลจริง และย้ายรายการงาน/ตัวกรองไว้ลำดับถัดลงมาโดยคง TaskCard กับ callbacks เดิม รายละเอียดที่ `features/today/TodayView.jsx`, `features/today/TodayCareDoodle.jsx` และ `app/today-dashboard.css`.

**24 ตุลาคม 2026 — กำหนดวัคซีนใน Today:** รายการจากสมุดสุขภาพและนัดหมายที่ถึงกำหนดวันนี้กดเสร็จแล้ว/ข้ามพร้อมเหตุผลและยืนยันได้ เก็บผลแยกตามรายการกับวันที่ใน `scheduled_health_outcomes` จึงคงข้อมูลสมุดสุขภาพต้นฉบับไว้ รายการที่จัดการแล้วแสดงในส่วนเสร็จแล้วและปฏิทิน ไม่แจ้งเตือนซ้ำ และผู้บันทึกหรือเจ้าของบ้านกดแก้ไขการกดผิดได้ ดู `lib/services/scheduled-health-service.js` กับ migration 017.

**24 ตุลาคม 2026 — Calendar readability:** ผู้ใช้ขอกลับไปใช้โครง Calendar แบบเดิม จึงคงปฏิทินรายเดือนด้านบนและกำหนดการวันที่เลือกด้านล่างไว้ใน content card เดียว ปรับระยะห่าง ตัวอักษร สถานะวันที่เลือก/วันนี้ ตัวเลขงานบนวัน และการ์ดรายการให้อ่านง่ายขึ้น โดยคงตัวกรอง เปลี่ยนเดือน เปิด Today เปิดสัตว์เลี้ยง และแก้งานเฉพาะครั้งไว้ ดู `features/calendar/CalendarView.jsx` กับ `app/calendar-dashboard.css`.

**24 ตุลาคม 2026 — จัดการสัตว์เลี้ยงในหน้า Pets:** ตามคำขอผู้ใช้ เอาการ์ดสัตว์เลี้ยงและพื้นที่ rail มุมขวาออกจากหน้าหลังเข้าสู่ระบบ แล้วรวมการเลือกสัตว์และปุ่มเพิ่มสัตว์เลี้ยงไว้ใน `features/pets/PetWorkspace.jsx` โดยแสดงตัวเลือกแต่ละตัวเป็นการ์ดที่เห็นได้ทันที มีสถานะตัวที่เลือกชัดเจน ปุ่มเพิ่มอยู่ส่วนหัวทุกแท็บ และหลังเพิ่มเสร็จพาไปโปรไฟล์ตัวใหม่ ดู `app/pets-actions.css`.

**24 ตุลาคม 2026 — ขอบซ้ายของการ์ด:** ผู้ใช้ไม่ชอบแถบสีที่มุมหรือขอบซ้ายแบบเมนู Calendar เดิม จึงเอาแถบด้านซ้ายออกจากเมนูที่เลือก รายการปฏิทิน โน้ตสุขภาพ การ์ดแจ้งเตือน รายการแจ้งเตือน กรอบรายงาน และงานเลยเวลา สถานะใช้พื้นอ่อน กรอบรอบชิ้นและป้ายข้อความแทน บันทึกเป็นกฎของ brand system สำหรับการออกแบบครั้งถัดไป.

**24 ตุลาคม 2026 — Household UX:** จัดหน้าบ้านจากมุมผู้ใช้เป็นชื่อและบทบาทของบ้าน → สมาชิก → รหัสเชิญพร้อมปุ่มคัดลอก/วันหมดอายุ → สิทธิ์เจ้าของบ้าน → งานจัดการบ้านอื่นและการลบ รหัสหมดอายุจะคัดลอกไม่ได้และมีข้อความให้เปลี่ยนรหัส รายการสิทธิ์ยังใช้ confirmation เดิม ดู `app/page.jsx`, `features/household/HouseholdTools.jsx` และ `app/household-ux.css`.
