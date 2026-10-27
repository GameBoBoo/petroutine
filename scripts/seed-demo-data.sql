BEGIN;
TRUNCATE TABLE notification_dismissals, wellness_alerts, pet_wellness_logs, pet_passport_entries,
  pet_health_records, care_entries, care_tasks, routines, activity_logs, idempotency_records,
  user_settings, household_members, pets, households, users RESTART IDENTITY CASCADE;

INSERT INTO users (id, name, email, password_hash) VALUES
('10000000-0000-4000-8000-000000000001','มินท์ เจ้าของบ้าน','owner@pawroutine.local','$2a$10$sFs0b5uJV3CzV5Jxp8fwVuS9Y0XlODMdxdGFhN4L.Ghm9L5wVArdW'),
('10000000-0000-4000-8000-000000000002','ต้น ผู้ดูแล','caregiver@pawroutine.local','$2a$10$sFs0b5uJV3CzV5Jxp8fwVuS9Y0XlODMdxdGFhN4L.Ghm9L5wVArdW'),
('10000000-0000-4000-8000-000000000003','ฟ้า สมาชิก','member@pawroutine.local','$2a$10$sFs0b5uJV3CzV5Jxp8fwVuS9Y0XlODMdxdGFhN4L.Ghm9L5wVArdW'),
('10000000-0000-4000-8000-000000000004','นัท บ้านอีกหลัง','other@pawroutine.local','$2a$10$sFs0b5uJV3CzV5Jxp8fwVuS9Y0XlODMdxdGFhN4L.Ghm9L5wVArdW');

INSERT INTO user_settings (user_id, notifications_enabled, lead_minutes, health_reminder_days) VALUES
('10000000-0000-4000-8000-000000000001', TRUE, 30, 14),
('10000000-0000-4000-8000-000000000002', TRUE, 60, 30),
('10000000-0000-4000-8000-000000000003', FALSE, 0, 60),
('10000000-0000-4000-8000-000000000004', TRUE, 120, 90);

INSERT INTO households (id, name, owner_id, invite_code, archived_at, archived_by) VALUES
('20000000-0000-4000-8000-000000000001','บ้านอุ้งเท้าตัวอย่าง','10000000-0000-4000-8000-000000000001','PAW-DEMO-2026',NULL,NULL),
('20000000-0000-4000-8000-000000000002','บ้านเก่าที่เก็บเข้าถัง','10000000-0000-4000-8000-000000000004','PAW-TRASH-2026',NOW()-INTERVAL '2 days','10000000-0000-4000-8000-000000000004');
INSERT INTO household_members (household_id,user_id,role) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','owner'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','caregiver'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','member'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','owner');

INSERT INTO pets (id,household_id,name,species,birth_date,notes,vet_contact,breed,sex,neuter_status,baseline_weight_kg,baseline_weight_recorded_on,archived_at) VALUES
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','โมจิ','dog','2021-04-12','ชอบเดินเล่นช่วงเย็น มีประวัติแพ้ไก่','คลินิกอุ่นใจ 02-555-0101','ชิบะอินุ','female','neutered',8.400,CURRENT_DATE-20,NULL),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','โกโก้','cat','2022-09-03','แมวขี้เล่น กินอาหารเปียกตอนเช้า','โรงพยาบาลสัตว์เมือง 02-555-0102','แมวไทย','male','neutered',4.650,CURRENT_DATE-14,NULL),
('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','ถั่วพู','dog','2024-01-20','ลูกสุนัข กำลังฝึกขับถ่าย','คลินิกอุ่นใจ 02-555-0101','พุดเดิลผสม','male','not_neutered',5.200,CURRENT_DATE-10,NULL),
('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001','เจ้าเก่า','cat','2018-05-01','ข้อมูลสัตว์ที่ archive ไว้','คลินิกเดิม',NULL,'unknown','unknown',NULL,NULL,NOW()-INTERVAL '1 day'),
('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','บ้านเก่า','dog','2019-11-11','สัตว์ในบ้านที่ถูก archive',NULL,'ไทยหลังอาน','female','unknown',NULL,NULL,NULL);

INSERT INTO routines (id,pet_id,title,activity_type,schedule_value,assigned_user_id,instructions,active,archived_at) VALUES
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','อาหารเช้า','feeding','{"type":"weekly","times":["07:30"],"days":[0,1,2,3,4,5,6]}'::jsonb,'10000000-0000-4000-8000-000000000002','อาหารสูตรแพ้ง่าย ปริมาณ 120 กรัม',TRUE,NULL),
('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','เดินเล่นรอบเย็น','walk','{"type":"weekly","times":["18:00"],"days":[1,3,5]}'::jsonb,'10000000-0000-4000-8000-000000000003','พกน้ำและสายจูง',TRUE,NULL),
('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','เติมน้ำพุแมว','water','{"type":"interval","times":["09:00"],"interval_days":2,"start_date":"2026-10-01"}'::jsonb,NULL,'ล้างตัวกรองทุกสัปดาห์',TRUE,NULL),
('40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000003','วัคซีนกระตุ้น','vet','{"type":"once","times":["10:30"],"date":"2026-10-27"}'::jsonb,'10000000-0000-4000-8000-000000000001','นัดคลินิกอุ่นใจ',TRUE,NULL),
('40000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000002','แปรงขนประจำสัปดาห์','grooming','{"type":"weekly","times":["16:00"],"days":[6]}'::jsonb,NULL,NULL,FALSE,NULL),
('40000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001','กิจวัตรเก่า','feeding','{"type":"weekly","times":["08:00"],"days":[0,1,2,3,4,5,6]}'::jsonb,NULL,NULL,FALSE,NOW()-INTERVAL '1 day'),
('40000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000005','กิจวัตรบ้านเก่า','feeding','{"type":"weekly","times":["08:00"],"days":[0,1,2,3,4,5,6]}'::jsonb,NULL,NULL,TRUE,NULL);

INSERT INTO care_tasks (id,routine_id,scheduled_at,status,completed_by,completed_at,notes,assigned_user_id,original_scheduled_at,mutation_version,mutation_reason,skip_reason) VALUES
('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',date_trunc('day',NOW())+INTERVAL '7 hours 30 minutes','pending',NULL,NULL,NULL,'10000000-0000-4000-8000-000000000002',date_trunc('day',NOW())+INTERVAL '7 hours 30 minutes',0,NULL,NULL),
('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001',NOW()-INTERVAL '2 hours','overdue',NULL,NULL,NULL,'10000000-0000-4000-8000-000000000002',NOW()-INTERVAL '2 hours',0,NULL,NULL),
('50000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002',NOW()-INTERVAL '1 day','completed','10000000-0000-4000-8000-000000000003',NOW()-INTERVAL '23 hours','เดินครบ 20 นาที','10000000-0000-4000-8000-000000000003',NOW()-INTERVAL '1 day',1,'completed',NULL),
('50000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000003',NOW()-INTERVAL '3 hours','skipped','10000000-0000-4000-8000-000000000002',NOW()-INTERVAL '3 hours','',NULL,NOW()-INTERVAL '3 hours',1,'skip','สัตว์เลี้ยงพักผ่อน'),
('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004',NOW()+INTERVAL '8 days','pending',NULL,NULL,NULL,'10000000-0000-4000-8000-000000000001',NOW()+INTERVAL '8 days',0,NULL,NULL),
('50000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000007',NOW()+INTERVAL '1 day','pending',NULL,NULL,NULL,NULL,NOW()+INTERVAL '1 day',0,NULL,NULL);

INSERT INTO care_entries (household_id,pet_id,title,activity_type,occurred_at,notes,created_by,archived_at) VALUES
('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','อาบน้ำ','bathing',NOW()-INTERVAL '2 days','ใช้แชมพูสูตรอ่อนโยน','10000000-0000-4000-8000-000000000002',NULL),
('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','ซื้ออาหารสูตรแพ้ง่าย','supplies',NOW()-INTERVAL '5 days','ซื้อสำหรับ 1 เดือน','10000000-0000-4000-8000-000000000001',NULL),
('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','ให้ยาถ่ายพยาธิ','medication',NOW()-INTERVAL '12 days','ตามคำแนะนำสัตวแพทย์','10000000-0000-4000-8000-000000000003',NULL),
('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003','สังเกตอาการหลังฉีดวัคซีน','observation',NOW()-INTERVAL '20 days','ปกติดี','10000000-0000-4000-8000-000000000001',NOW()-INTERVAL '10 days');

INSERT INTO pet_health_records (pet_id,record_type,title,recorded_at,details,numeric_value,unit,created_by,archived_at) VALUES
('30000000-0000-4000-8000-000000000001','weight','ชั่งน้ำหนัก',NOW()-INTERVAL '1 day','น้ำหนักคงที่',8.400,'kg','10000000-0000-4000-8000-000000000001',NULL),
('30000000-0000-4000-8000-000000000001','vaccination','วัคซีนรวมประจำปี',NOW()-INTERVAL '180 days','ฉีดครบแล้ว',NULL,NULL,'10000000-0000-4000-8000-000000000001',NULL),
('30000000-0000-4000-8000-000000000002','medication','ยาหยอดเห็บหมัด',NOW()-INTERVAL '15 days','ใช้ภายนอก',NULL,NULL,'10000000-0000-4000-8000-000000000002',NULL),
('30000000-0000-4000-8000-000000000003','appointment','ตรวจสุขภาพลูกสุนัข',NOW()+INTERVAL '10 days','ตรวจทั่วไปและสอบถามเรื่องอาหาร',NULL,NULL,'10000000-0000-4000-8000-000000000001',NULL),
('30000000-0000-4000-8000-000000000002','observation','บันทึกเก่าที่ archive',NOW()-INTERVAL '90 days','รายการทดสอบถังเก็บ',NULL,NULL,'10000000-0000-4000-8000-000000000003',NOW()-INTERVAL '30 days');

INSERT INTO pet_passport_entries (pet_id,entry_type,title,details,numeric_value,unit,start_date,end_date,next_due_date,created_by,archived_at) VALUES
('30000000-0000-4000-8000-000000000001','allergy','แพ้เนื้อไก่','คันและผื่นเมื่อได้รับอาหารที่มีไก่',NULL,NULL,CURRENT_DATE-300,NULL,NULL,'10000000-0000-4000-8000-000000000001',NULL),
('30000000-0000-4000-8000-000000000001','condition','ผิวหนังแห้ง','ติดตามอาการช่วงอากาศแห้ง',NULL,NULL,CURRENT_DATE-60,NULL,NULL,'10000000-0000-4000-8000-000000000001',NULL),
('30000000-0000-4000-8000-000000000002','medication','อาหารเสริมขน','ให้วันละ 1 เม็ด',1,'เม็ด',CURRENT_DATE-10,CURRENT_DATE+20,NULL,'10000000-0000-4000-8000-000000000002',NULL),
('30000000-0000-4000-8000-000000000003','vaccination','วัคซีนรวม','เข็มกระตุ้น',NULL,NULL,CURRENT_DATE-350,NULL,CURRENT_DATE+5,'10000000-0000-4000-8000-000000000001',NULL),
('30000000-0000-4000-8000-000000000001','appointment','ตรวจฟัน','นัดตรวจสุขภาพช่องปาก',NULL,NULL,NULL,NULL,CURRENT_DATE+2,'10000000-0000-4000-8000-000000000001',NULL),
('30000000-0000-4000-8000-000000000002','vaccination','วัคซีนเก่าที่ archive','รายการทดสอบ archive',NULL,NULL,CURRENT_DATE-700,NULL,CURRENT_DATE-500,'10000000-0000-4000-8000-000000000001',NOW()-INTERVAL '20 days');

INSERT INTO pet_wellness_logs (pet_id,recorded_at,food_intake,water_intake,activity_level,sleep_amount,stool_condition,mood,weight_kg,notes,created_by)
SELECT pet_id, NOW() - (d || ' days')::interval,
       CASE WHEN pet_id='30000000-0000-4000-8000-000000000001' AND d < 3 THEN 'low' ELSE 'usual' END,
       CASE WHEN pet_id='30000000-0000-4000-8000-000000000001' AND d < 3 THEN 'low' ELSE 'usual' END,
       CASE WHEN pet_id='30000000-0000-4000-8000-000000000001' AND d < 3 THEN 'very_low' WHEN d % 5=0 THEN 'high' ELSE 'usual' END,
       CASE WHEN d % 6=0 THEN 'high' ELSE 'usual' END,
       CASE WHEN d=2 AND pet_id='30000000-0000-4000-8000-000000000001' THEN 'soft' ELSE 'normal' END,
       CASE WHEN d=1 AND pet_id='30000000-0000-4000-8000-000000000001' THEN 'quiet' ELSE 'usual' END,
       CASE WHEN pet_id='30000000-0000-4000-8000-000000000001' THEN 8.35 + (30-d)*0.002 WHEN pet_id='30000000-0000-4000-8000-000000000002' THEN 4.6 + (30-d)*0.001 ELSE 5.1 + (30-d)*0.003 END,
       CASE WHEN d=0 THEN 'เช็กอินล่าสุดสำหรับทดสอบแนวโน้มและการแจ้งเตือน' ELSE NULL END,
       CASE WHEN pet_id='30000000-0000-4000-8000-000000000002' THEN '10000000-0000-4000-8000-000000000002'::uuid ELSE '10000000-0000-4000-8000-000000000001'::uuid END
FROM (VALUES ('30000000-0000-4000-8000-000000000001'::uuid),('30000000-0000-4000-8000-000000000002'::uuid),('30000000-0000-4000-8000-000000000003'::uuid)) pets(pet_id)
CROSS JOIN generate_series(0,29) d;

INSERT INTO wellness_alerts (pet_id,metric,rule_code,direction,status,baseline_start,baseline_end,observation_start,observation_end,baseline_value,observed_value,evidence,source_log_ids,first_detected_at,last_detected_at,acknowledged_by,acknowledged_at,monitoring_by,monitoring_at,resolved_at,resolution_reason,assigned_to,follow_up_due_date,follow_up_note,follow_up_updated_by,follow_up_updated_at)
VALUES
('30000000-0000-4000-8000-000000000001','activity_level','category_consecutive','below','new',CURRENT_DATE-30,CURRENT_DATE-15,CURRENT_DATE-3,CURRENT_DATE,'{"usual":"usual"}','{"observed":"very_low"}','{"consecutive_days":3,"sample_count":3}',ARRAY[]::uuid[],NOW()-INTERVAL '1 day',NOW(),NULL,NULL,NULL,NULL,NULL,NULL,'10000000-0000-4000-8000-000000000002',CURRENT_DATE+1,'โทรถามอาการและติดตามพรุ่งนี้',NULL,NULL),
('30000000-0000-4000-8000-000000000002','weight_kg','weight_percent_consecutive','below','monitoring',CURRENT_DATE-30,CURRENT_DATE-15,CURRENT_DATE-8,CURRENT_DATE-6,'{"median":4.8}','{"median":4.4}','{"change_percent":-8.3}',ARRAY[]::uuid[],NOW()-INTERVAL '8 days',NOW()-INTERVAL '6 days','10000000-0000-4000-8000-000000000001',NOW()-INTERVAL '7 days','10000000-0000-4000-8000-000000000002',NOW()-INTERVAL '6 days',NULL,NULL,'10000000-0000-4000-8000-000000000002',CURRENT_DATE+3,'ชั่งน้ำหนักซ้ำและบันทึกผล','10000000-0000-4000-8000-000000000002',NOW()-INTERVAL '6 days'),
('30000000-0000-4000-8000-000000000003','food_intake','category_consecutive','changed','resolved',CURRENT_DATE-60,CURRENT_DATE-45,CURRENT_DATE-40,CURRENT_DATE-38,'{"usual":"usual"}','{"observed":"low"}','{"consecutive_days":3}',ARRAY[]::uuid[],NOW()-INTERVAL '40 days',NOW()-INTERVAL '38 days','10000000-0000-4000-8000-000000000001',NOW()-INTERVAL '39 days',NULL,NULL,NOW()-INTERVAL '35 days','returned_to_baseline',NULL,NULL,NULL,NULL,NULL);

INSERT INTO activity_logs (household_id,actor_user_id,action,entity_type,entity_id,before_data,after_data,metadata,entity_version,reversible_until,created_at) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','create','pet','30000000-0000-4000-8000-000000000001','{}','{"name":"โมจิ","species":"dog"}','{"source":"demo_seed"}',1,NULL,NOW()-INTERVAL '50 days'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','complete','care_task','50000000-0000-4000-8000-000000000003','{"status":"pending"}','{"status":"completed"}','{"source":"demo_seed"}',1,NOW()+INTERVAL '1 hour',NOW()-INTERVAL '23 hours'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','skip','care_task','50000000-0000-4000-8000-000000000004','{"status":"pending"}','{"status":"skipped","skip_reason":"สัตว์เลี้ยงพักผ่อน"}','{"source":"demo_seed"}',1,NULL,NOW()-INTERVAL '3 hours'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','create','care_entry','60000000-0000-4000-8000-000000000001','{}','{"title":"อาบน้ำ"}','{"source":"demo_seed"}',1,NULL,NOW()-INTERVAL '2 days'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','acknowledge','wellness_alert','70000000-0000-4000-8000-000000000001','{"status":"new"}','{"status":"acknowledged"}','{"source":"demo_seed"}',2,NULL,NOW()-INTERVAL '1 day');

INSERT INTO notification_dismissals (user_id,household_id,notification_key,dismissed_at) VALUES
('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','demo-dismissed-reminder-2026-10-19',NOW()-INTERVAL '1 hour');

COMMIT;
