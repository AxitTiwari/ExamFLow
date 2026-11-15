USE examflow;

-- Local demonstration accounts. Plain-text passwords are intentionally used only for this classroom demo.
INSERT INTO users(id,full_name,email,password,role,status) VALUES
 (1,'ExamFlow Administrator','admin@examflow.local','Admin@123','ADMIN','ACTIVE'),
 (2,'Aarav Sharma','student@examflow.local','Student@123','STUDENT','ACTIVE'),
 (3,'Dr. Meera Joshi','teacher@examflow.local','Teacher@123','TEACHER','ACTIVE'),
 (4,'Dr. Rohan Verma','pending@examflow.local','Teacher@123','TEACHER','PENDING')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name),password=VALUES(password),role=VALUES(role),status=VALUES(status);

INSERT INTO courses(id,code,name) VALUES(1,'BTECH','Bachelor of Technology')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO branches(id,course_id,code,name) VALUES(1,1,'CSE','Computer Science and Engineering')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO students(user_id,roll_number,course_id,branch_id,academic_year,semester)
VALUES(2,'GEHU-CSE-2026-001',1,1,3,5)
ON DUPLICATE KEY UPDATE roll_number=VALUES(roll_number),course_id=VALUES(course_id),branch_id=VALUES(branch_id),academic_year=VALUES(academic_year),semester=VALUES(semester);

INSERT INTO teachers(user_id,employee_code,department,designation) VALUES
 (3,'FAC-001','Computer Science','Assistant Professor'),
 (4,'FAC-002','Computer Science','Assistant Professor')
ON DUPLICATE KEY UPDATE department=VALUES(department),designation=VALUES(designation);

INSERT INTO subjects(id,code,name,credits) VALUES
 (1,'CS301','Database Management Systems',4),
 (2,'CS302','Computer Networks',4),
 (3,'CS303','Operating Systems',4),
 (4,'CS304','Natural Language Processing',3)
ON DUPLICATE KEY UPDATE name=VALUES(name),credits=VALUES(credits);

INSERT INTO offerings(id,subject_id,course_id,branch_id,academic_year,semester,academic_session) VALUES
 (1,1,1,1,3,5,'2026-27'),
 (2,2,1,1,3,5,'2026-27'),
 (3,3,1,1,3,5,'2026-27'),
 (4,4,1,1,3,5,'2026-27')
ON DUPLICATE KEY UPDATE academic_session=VALUES(academic_session);

INSERT IGNORE INTO enrollments(student_id,offering_id) VALUES(2,1),(2,2),(2,3),(2,4);

INSERT INTO rooms(id,room_code,building,capacity,room_type,is_active) VALUES
 (1,'A-101','Academic Block A',60,'CLASSROOM',1),
 (2,'A-102','Academic Block A',60,'CLASSROOM',1),
 (3,'B-201','Academic Block B',90,'CLASSROOM',1),
 (4,'B-202','Academic Block B',90,'CLASSROOM',1),
 (5,'LAB-01','Computer Block',40,'LAB',1)
ON DUPLICATE KEY UPDATE building=VALUES(building),capacity=VALUES(capacity),is_active=1;

-- Sample draft session and exams make the workflow ready to demonstrate.
INSERT INTO exam_sessions(id,name,academic_session,start_date,end_date,day_start_time,day_end_time,status,created_by)
VALUES(1,'End Semester Examination','2026-27','2026-12-01','2026-12-10','09:00:00','17:00:00','DRAFT',1)
ON DUPLICATE KEY UPDATE name=VALUES(name),start_date=VALUES(start_date),end_date=VALUES(end_date),status='DRAFT';

INSERT INTO exams(id,session_id,offering_id,duration_minutes,priority) VALUES
 (1,1,1,180,3),(2,1,2,180,2),(3,1,3,180,1),(4,1,4,180,2)
ON DUPLICATE KEY UPDATE duration_minutes=VALUES(duration_minutes),priority=VALUES(priority);

INSERT INTO teacher_availability(teacher_id,available_date,start_time,end_time,is_available)
SELECT t.user_id,dates.d,'09:00:00','17:00:00',1
FROM teachers t
CROSS JOIN (
 SELECT DATE('2026-12-01') d UNION ALL SELECT DATE('2026-12-02') UNION ALL
 SELECT DATE('2026-12-03') UNION ALL SELECT DATE('2026-12-04') UNION ALL
 SELECT DATE('2026-12-05') UNION ALL SELECT DATE('2026-12-06') UNION ALL
 SELECT DATE('2026-12-07') UNION ALL SELECT DATE('2026-12-08') UNION ALL
 SELECT DATE('2026-12-09') UNION ALL SELECT DATE('2026-12-10')
) dates
WHERE t.user_id IN (3,4)
ON DUPLICATE KEY UPDATE is_available=1;
