-- =====================================================
-- Medical Learning Portal - Seed Data
-- Run this after schema.sql
-- =====================================================

-- =====================================================
-- SAMPLE SUBJECTS
-- =====================================================
INSERT INTO subjects (id, name, code, year_level, description, thumbnail_url, order_index) VALUES
('11111111-1111-1111-1111-111111111111', 'Anatomy I', 'SCID101', 1, 'พื้นฐานกายวิภาคศาสตร์สำหรับนักศึกษาแพทย์ชั้นปีที่ 1 ครอบคลุมโครงสร้างร่างกายมนุษย์', '/images/anatomy.jpg', 1),
('22222222-2222-2222-2222-222222222222', 'Physiology I', 'SCID102', 1, 'สรีรวิทยาพื้นฐาน การทำงานของระบบต่างๆ ในร่างกาย', '/images/physiology.jpg', 2),
('33333333-3333-3333-3333-333333333333', 'Biochemistry', 'SCID103', 1, 'ชีวเคมีทางการแพทย์ กระบวนการเมตาบอลิซึม', '/images/biochemistry.jpg', 3),
('44444444-4444-4444-4444-444444444444', 'Anatomy II', 'SCID201', 2, 'กายวิภาคศาสตร์ขั้นสูง ระบบประสาทและอวัยวะภายใน', '/images/anatomy2.jpg', 1),
('55555555-5555-5555-5555-555555555555', 'Pathology I', 'SCID301', 3, 'พยาธิวิทยาเบื้องต้น การเปลี่ยนแปลงของเนื้อเยื่อ', '/images/pathology.jpg', 1)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE SECTIONS FOR ANATOMY I
-- Demonstrating dynamic structure (different subjects can have different sections)
-- =====================================================
INSERT INTO sections (id, subject_id, name, description, order_index) VALUES
-- Anatomy I - 4 sections
('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Orientation', 'ปฐมนิเทศและแนะนำรายวิชา', 1),
('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Block 1: Musculoskeletal System', 'ระบบกล้ามเนื้อและกระดูก', 2),
('aaaa3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Midterm Examination', 'สอบกลางภาค', 3),
('aaaa4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Block 2: Cardiovascular System', 'ระบบหัวใจและหลอดเลือด', 4),

-- Physiology I - 3 sections (different from Anatomy I)
('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Introduction to Physiology', 'แนะนำสรีรวิทยา', 1),
('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Cell Physiology', 'สรีรวิทยาระดับเซลล์', 2),
('bbbb3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Nerve & Muscle Physiology', 'สรีรวิทยาระบบประสาทและกล้ามเนื้อ', 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE LECTURES
-- =====================================================
INSERT INTO lectures (id, section_id, title, description, lecture_date, lecturer_name, order_index) VALUES
-- Orientation Section
('a1a11111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'Course Introduction & Syllabus', 'แนะนำรายวิชาและ Course Syllabus', '2026-01-15', 'ศ.นพ.สมชาย จันทร์ดี', 1),
('a1a11111-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'Anatomical Terminology', 'ศัพท์เฉพาะทางกายวิภาค', '2026-01-16', 'ศ.นพ.สมชาย จันทร์ดี', 2),

-- Block 1: Musculoskeletal Section
('a2a22222-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', 'Bones: Structure & Classification', 'โครงสร้างและการจำแนกกระดูก', '2026-01-20', 'รศ.พญ.วิภา แสงสว่าง', 1),
('a2a22222-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222', 'Upper Limb Anatomy', 'กายวิภาคแขน', '2026-01-22', 'รศ.พญ.วิภา แสงสว่าง', 2),
('a2a22222-3333-3333-3333-333333333333', 'aaaa2222-2222-2222-2222-222222222222', 'Lower Limb Anatomy', 'กายวิภาคขา', '2026-01-24', 'ผศ.นพ.ประสิทธิ์ รักเรียน', 3),
('a2a22222-4444-4444-4444-444444444444', 'aaaa2222-2222-2222-2222-222222222222', 'Joints & Ligaments', 'ข้อต่อและเอ็น', '2026-01-27', 'ผศ.นพ.ประสิทธิ์ รักเรียน', 4),

-- Block 2: Cardiovascular Section
('a3a33333-1111-1111-1111-111111111111', 'aaaa4444-4444-4444-4444-444444444444', 'Heart Anatomy', 'กายวิภาคหัวใจ', '2026-02-10', 'ศ.นพ.สมชาย จันทร์ดี', 1),
('a3a33333-2222-2222-2222-222222222222', 'aaaa4444-4444-4444-4444-444444444444', 'Blood Vessels', 'หลอดเลือด', '2026-02-12', 'ศ.นพ.สมชาย จันทร์ดี', 2)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE RESOURCES (Dynamic Buttons)
-- Demonstrating varying number of resources per lecture
-- =====================================================
INSERT INTO resources (id, lecture_id, label, url, type, order_index) VALUES
-- Course Introduction - 2 resources
('b1b11111-1111-1111-1111-111111111111', 'a1a11111-1111-1111-1111-111111111111', 'Slide', 'https://drive.google.com/file/d/xxx1/view', 'gdrive_pdf', 1),
('b1b11111-2222-2222-2222-222222222222', 'a1a11111-1111-1111-1111-111111111111', 'Video', 'dQw4w9WgXcQ', 'youtube', 2),

-- Anatomical Terminology - 4 resources (different count)
('b1b22222-1111-1111-1111-111111111111', 'a1a11111-2222-2222-2222-222222222222', 'Slide', 'https://drive.google.com/file/d/xxx2/view', 'gdrive_pdf', 1),
('b1b22222-2222-2222-2222-222222222222', 'a1a11111-2222-2222-2222-222222222222', 'Video', 'abc123def456', 'youtube', 2),
('b1b22222-3333-3333-3333-333333333333', 'a1a11111-2222-2222-2222-222222222222', 'Summary', 'https://drive.google.com/file/d/xxx3/view', 'gdrive_pdf', 3),
('b1b22222-4444-4444-4444-444444444444', 'a1a11111-2222-2222-2222-222222222222', 'Exercise', 'https://forms.google.com/xxx', 'external', 4),

-- Bones Structure - 3 resources
('b2b11111-1111-1111-1111-111111111111', 'a2a22222-1111-1111-1111-111111111111', 'Slide', 'https://drive.google.com/file/d/xxx4/view', 'gdrive_pdf', 1),
('b2b11111-2222-2222-2222-222222222222', 'a2a22222-1111-1111-1111-111111111111', 'Video', 'b0e5123abc', 'youtube', 2),
('b2b11111-3333-3333-3333-333333333333', 'a2a22222-1111-1111-1111-111111111111', '3D Model', 'https://sketchfab.com/models/xxx', 'external', 3),

-- Upper Limb - 5 resources (most resources)
('b2b22222-1111-1111-1111-111111111111', 'a2a22222-2222-2222-2222-222222222222', 'Slide', 'https://drive.google.com/file/d/xxx5/view', 'gdrive_pdf', 1),
('b2b22222-2222-2222-2222-222222222222', 'a2a22222-2222-2222-2222-222222222222', 'Video', 'a991e2b3c4d', 'youtube', 2),
('b2b22222-3333-3333-3333-333333333333', 'a2a22222-2222-2222-2222-222222222222', 'Lab Manual', 'https://drive.google.com/file/d/xxx6/view', 'gdrive_pdf', 3),
('b2b22222-4444-4444-4444-444444444444', 'a2a22222-2222-2222-2222-222222222222', 'Quiz', 'https://forms.google.com/quiz1', 'external', 4),
('b2b22222-5555-5555-5555-555555555555', 'a2a22222-2222-2222-2222-222222222222', 'Extra Notes', 'https://drive.google.com/file/d/xxx7/view', 'gdrive_pdf', 5),

-- Heart Anatomy - 3 resources
('b3b11111-1111-1111-1111-111111111111', 'a3a33333-1111-1111-1111-111111111111', 'Slide', 'https://drive.google.com/file/d/heart1/view', 'gdrive_pdf', 1),
('b3b11111-2222-2222-2222-222222222222', 'a3a33333-1111-1111-1111-111111111111', 'Video', 'aea1123abc', 'youtube', 2),
('b3b11111-3333-3333-3333-333333333333', 'a3a33333-1111-1111-1111-111111111111', 'Animation', 'https://drive.google.com/file/d/heart2/view', 'gdrive_video', 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE CALENDAR EVENTS
-- =====================================================
INSERT INTO calendar_events (id, title, description, start_time, end_time, type, subject_id, is_all_day, location) VALUES
('ca111111-1111-1111-1111-111111111111', 'Anatomy I - Midterm Examination', 'สอบกลางภาค Anatomy I', '2026-02-05 09:00:00+07', '2026-02-05 12:00:00+07', 'exam', '11111111-1111-1111-1111-111111111111', FALSE, 'ห้องสอบ 1-2'),
('ca222222-2222-2222-2222-222222222222', 'Physiology I - Quiz 1', 'ทดสอบย่อยครั้งที่ 1', '2026-01-25 13:00:00+07', '2026-01-25 14:00:00+07', 'exam', '22222222-2222-2222-2222-222222222222', FALSE, 'ห้อง 301'),
('ca333333-3333-3333-3333-333333333333', 'วันหยุดชดเชย', 'วันหยุดราชการ', '2026-02-14 00:00:00+07', '2026-02-14 23:59:59+07', 'holiday', NULL, TRUE, NULL),
('ca444444-4444-4444-4444-444444444444', 'Guest Lecture: Modern Anatomy Imaging', 'บรรยายพิเศษโดยวิทยากรจากต่างประเทศ', '2026-02-20 10:00:00+07', '2026-02-20 12:00:00+07', 'lecture', '11111111-1111-1111-1111-111111111111', FALSE, 'ห้องประชุมใหญ่'),
('ca555555-5555-5555-5555-555555555555', 'Anatomy I - Final Examination', 'สอบปลายภาค Anatomy I', '2026-03-15 09:00:00+07', '2026-03-15 15:00:00+07', 'exam', '11111111-1111-1111-1111-111111111111', FALSE, 'ห้องสอบ 1-3')
ON CONFLICT DO NOTHING;
