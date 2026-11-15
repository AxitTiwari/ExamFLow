USE examflow;
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_login$$
CREATE PROCEDURE sp_login(IN p_email VARCHAR(190), IN p_password VARCHAR(100))
BEGIN
  SELECT id,full_name,email,role,status
  FROM users
  WHERE email=LOWER(TRIM(p_email)) AND password=p_password
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_register_student$$
CREATE PROCEDURE sp_register_student(
 IN p_name VARCHAR(120),IN p_email VARCHAR(190),IN p_password VARCHAR(100),
 IN p_roll VARCHAR(40),IN p_course INT,IN p_branch INT,IN p_year TINYINT,IN p_semester TINYINT
)
BEGIN
 DECLARE v_id INT UNSIGNED;
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 IF NOT EXISTS(SELECT 1 FROM branches WHERE id=p_branch AND course_id=p_course) THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Selected branch does not belong to selected course';
 END IF;
 START TRANSACTION;
 INSERT INTO users(full_name,email,password,role,status)
 VALUES(TRIM(p_name),LOWER(TRIM(p_email)),p_password,'STUDENT','ACTIVE');
 SET v_id=LAST_INSERT_ID();
 INSERT INTO students(user_id,roll_number,course_id,branch_id,academic_year,semester)
 VALUES(v_id,TRIM(p_roll),p_course,p_branch,p_year,p_semester);
 COMMIT;
 SELECT v_id AS user_id;
END$$

DROP PROCEDURE IF EXISTS sp_register_teacher$$
CREATE PROCEDURE sp_register_teacher(
 IN p_name VARCHAR(120),IN p_email VARCHAR(190),IN p_password VARCHAR(100),
 IN p_employee VARCHAR(40),IN p_department VARCHAR(120),IN p_designation VARCHAR(120)
)
BEGIN
 DECLARE v_id INT UNSIGNED;
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 START TRANSACTION;
 INSERT INTO users(full_name,email,password,role,status)
 VALUES(TRIM(p_name),LOWER(TRIM(p_email)),p_password,'TEACHER','PENDING');
 SET v_id=LAST_INSERT_ID();
 INSERT INTO teachers(user_id,employee_code,department,designation)
 VALUES(v_id,TRIM(p_employee),TRIM(p_department),NULLIF(TRIM(p_designation),''));
 COMMIT;
 SELECT v_id AS user_id,'PENDING' AS status;
END$$

DROP PROCEDURE IF EXISTS sp_dashboard$$
CREATE PROCEDURE sp_dashboard()
BEGIN
 SELECT
  (SELECT COUNT(*) FROM students s JOIN users u ON u.id=s.user_id WHERE u.status='ACTIVE') AS active_students,
  (SELECT COUNT(*) FROM teachers t JOIN users u ON u.id=t.user_id WHERE u.status='ACTIVE') AS approved_teachers,
  (SELECT COUNT(*) FROM teachers t JOIN users u ON u.id=t.user_id WHERE u.status='PENDING') AS pending_approvals,
  (SELECT COUNT(*) FROM subjects) AS subjects,
  (SELECT COUNT(*) FROM rooms WHERE is_active=1) AS rooms,
  (SELECT COUNT(*) FROM exam_sessions) AS exam_sessions,
  (SELECT COUNT(*) FROM exams) AS examinations,
  (SELECT COUNT(*) FROM exam_schedule) AS scheduled_exams;
END$$

DROP PROCEDURE IF EXISTS sp_list_students$$
CREATE PROCEDURE sp_list_students()
BEGIN
 SELECT st.user_id AS student_id,u.full_name,u.email,u.status,st.roll_number,
  c.name AS course_name,b.name AS branch_name,st.academic_year,st.semester,
  (SELECT COUNT(*) FROM enrollments en WHERE en.student_id=st.user_id) AS enrolled_subjects
 FROM students st JOIN users u ON u.id=st.user_id
 JOIN courses c ON c.id=st.course_id JOIN branches b ON b.id=st.branch_id
 ORDER BY u.full_name;
END$$

DROP PROCEDURE IF EXISTS sp_list_teachers$$
CREATE PROCEDURE sp_list_teachers()
BEGIN
 SELECT t.user_id AS teacher_id,u.full_name,u.email,u.status,t.employee_code,t.department,t.designation
 FROM teachers t JOIN users u ON u.id=t.user_id
 ORDER BY FIELD(u.status,'PENDING','ACTIVE','REJECTED','DISABLED'),u.full_name;
END$$

DROP PROCEDURE IF EXISTS sp_update_teacher_status$$
CREATE PROCEDURE sp_update_teacher_status(IN p_teacher INT,IN p_status VARCHAR(20))
BEGIN
 IF p_status NOT IN ('ACTIVE','REJECTED','DISABLED') THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid teacher status';
 END IF;
 UPDATE users SET status=p_status WHERE id=p_teacher AND role='TEACHER';
 IF ROW_COUNT()=0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Teacher not found'; END IF;
 SELECT 'Teacher status updated' AS message;
END$$

DROP PROCEDURE IF EXISTS sp_list_courses$$
CREATE PROCEDURE sp_list_courses()
BEGIN SELECT id,code,name FROM courses ORDER BY name; END$$

DROP PROCEDURE IF EXISTS sp_create_course$$
CREATE PROCEDURE sp_create_course(IN p_code VARCHAR(24),IN p_name VARCHAR(120))
BEGIN
 INSERT INTO courses(code,name) VALUES(UPPER(TRIM(p_code)),TRIM(p_name));
 SELECT LAST_INSERT_ID() AS id;
END$$

DROP PROCEDURE IF EXISTS sp_list_branches$$
CREATE PROCEDURE sp_list_branches()
BEGIN
 SELECT b.id,b.course_id,b.code,b.name,c.name AS course_name
 FROM branches b JOIN courses c ON c.id=b.course_id ORDER BY c.name,b.name;
END$$

DROP PROCEDURE IF EXISTS sp_create_branch$$
CREATE PROCEDURE sp_create_branch(IN p_course INT,IN p_code VARCHAR(24),IN p_name VARCHAR(120))
BEGIN
 IF NOT EXISTS(SELECT 1 FROM courses WHERE id=p_course) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Course not found'; END IF;
 INSERT INTO branches(course_id,code,name) VALUES(p_course,UPPER(TRIM(p_code)),TRIM(p_name));
 SELECT LAST_INSERT_ID() AS id;
END$$

DROP PROCEDURE IF EXISTS sp_list_subjects$$
CREATE PROCEDURE sp_list_subjects()
BEGIN SELECT id,code,name,credits FROM subjects ORDER BY code; END$$

DROP PROCEDURE IF EXISTS sp_create_subject$$
CREATE PROCEDURE sp_create_subject(IN p_code VARCHAR(30),IN p_name VARCHAR(150),IN p_credits TINYINT)
BEGIN
 INSERT INTO subjects(code,name,credits) VALUES(UPPER(TRIM(p_code)),TRIM(p_name),p_credits);
 SELECT LAST_INSERT_ID() AS id;
END$$

DROP PROCEDURE IF EXISTS sp_list_offerings$$
CREATE PROCEDURE sp_list_offerings()
BEGIN
 SELECT o.id,o.subject_id,o.course_id,o.branch_id,o.academic_year,o.semester,o.academic_session,
  s.code AS subject_code,s.name AS subject_name,c.name AS course_name,b.name AS branch_name
 FROM offerings o JOIN subjects s ON s.id=o.subject_id
 JOIN courses c ON c.id=o.course_id JOIN branches b ON b.id=o.branch_id
 ORDER BY o.academic_session,o.academic_year,o.semester,s.code;
END$$

DROP PROCEDURE IF EXISTS sp_create_offering$$
CREATE PROCEDURE sp_create_offering(IN p_subject INT,IN p_course INT,IN p_branch INT,IN p_year TINYINT,IN p_sem TINYINT,IN p_academic VARCHAR(30))
BEGIN
 IF NOT EXISTS(SELECT 1 FROM branches WHERE id=p_branch AND course_id=p_course) THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Selected branch does not belong to selected course';
 END IF;
 INSERT INTO offerings(subject_id,course_id,branch_id,academic_year,semester,academic_session)
 VALUES(p_subject,p_course,p_branch,p_year,p_sem,TRIM(p_academic));
 SELECT LAST_INSERT_ID() AS id;
END$$

DROP PROCEDURE IF EXISTS sp_list_rooms$$
CREATE PROCEDURE sp_list_rooms()
BEGIN SELECT id,room_code,building,capacity,room_type,is_active FROM rooms ORDER BY room_code; END$$

DROP PROCEDURE IF EXISTS sp_create_room$$
CREATE PROCEDURE sp_create_room(IN p_code VARCHAR(30),IN p_building VARCHAR(100),IN p_capacity SMALLINT,IN p_type VARCHAR(40))
BEGIN
 INSERT INTO rooms(room_code,building,capacity,room_type) VALUES(UPPER(TRIM(p_code)),NULLIF(TRIM(p_building),''),p_capacity,UPPER(TRIM(p_type)));
 SELECT LAST_INSERT_ID() AS id;
END$$

DROP PROCEDURE IF EXISTS sp_list_sessions$$
CREATE PROCEDURE sp_list_sessions()
BEGIN
 SELECT es.id,es.name,es.academic_session,es.start_date,es.end_date,es.day_start_time,es.day_end_time,es.status,
  (SELECT COUNT(*) FROM exams e WHERE e.session_id=es.id) AS exam_count,
  (SELECT COUNT(*) FROM exam_schedule x JOIN exams e ON e.id=x.exam_id WHERE e.session_id=es.id) AS scheduled_count
 FROM exam_sessions es ORDER BY es.start_date DESC,es.id DESC;
END$$

DROP PROCEDURE IF EXISTS sp_create_session$$
CREATE PROCEDURE sp_create_session(IN p_name VARCHAR(120),IN p_academic VARCHAR(30),IN p_start DATE,IN p_end DATE,IN p_day_start TIME,IN p_day_end TIME,IN p_admin INT)
BEGIN
 IF p_end<p_start OR p_day_end<=p_day_start THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid session date or time range'; END IF;
 INSERT INTO exam_sessions(name,academic_session,start_date,end_date,day_start_time,day_end_time,created_by)
 VALUES(TRIM(p_name),TRIM(p_academic),p_start,p_end,p_day_start,p_day_end,p_admin);
 SELECT LAST_INSERT_ID() AS id;
END$$

DROP PROCEDURE IF EXISTS sp_list_session_exams$$
CREATE PROCEDURE sp_list_session_exams(IN p_session INT)
BEGIN
 SELECT e.id AS exam_id,e.duration_minutes,e.priority,e.created_at,
  o.id AS offering_id,o.academic_year,o.semester,
  s.code AS subject_code,s.name AS subject_name,c.name AS course_name,b.name AS branch_name,
  (SELECT COUNT(*) FROM enrollments en WHERE en.offering_id=o.id) AS student_count,
  x.id AS schedule_id,x.exam_date,x.start_time,x.end_time,x.status AS schedule_status,
  r.room_code,t.full_name AS teacher_name
 FROM exams e JOIN offerings o ON o.id=e.offering_id JOIN subjects s ON s.id=o.subject_id
 JOIN courses c ON c.id=o.course_id JOIN branches b ON b.id=o.branch_id
 LEFT JOIN exam_schedule x ON x.exam_id=e.id
 LEFT JOIN rooms r ON r.id=x.room_id LEFT JOIN users t ON t.id=x.teacher_id
 WHERE e.session_id=p_session ORDER BY e.created_at,e.id;
END$$

DROP PROCEDURE IF EXISTS sp_add_exam$$
CREATE PROCEDURE sp_add_exam(IN p_session INT,IN p_offering INT,IN p_duration SMALLINT,IN p_priority TINYINT)
BEGIN
 IF NOT EXISTS(SELECT 1 FROM exam_sessions WHERE id=p_session AND status='DRAFT') THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Draft exam session not found';
 END IF;
 IF p_duration<30 OR p_duration>480 OR p_priority<1 OR p_priority>5 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Duration must be 30–480 minutes and priority 1–5';
 END IF;
 INSERT INTO exams(session_id,offering_id,duration_minutes,priority) VALUES(p_session,p_offering,p_duration,p_priority);
 SELECT LAST_INSERT_ID() AS id;
END$$

DROP PROCEDURE IF EXISTS sp_enroll_student$$
CREATE PROCEDURE sp_enroll_student(IN p_student INT,IN p_offering INT)
BEGIN
 IF NOT EXISTS(
  SELECT 1 FROM students st JOIN offerings o ON o.id=p_offering
  WHERE st.user_id=p_student AND st.course_id=o.course_id AND st.branch_id=o.branch_id
   AND st.academic_year=o.academic_year AND st.semester=o.semester
 ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Offering does not match your course, branch, year and semester'; END IF;
 INSERT INTO enrollments(student_id,offering_id) VALUES(p_student,p_offering);
 SELECT 'Enrollment successful' AS message;
END$$

DROP PROCEDURE IF EXISTS sp_student_offerings$$
CREATE PROCEDURE sp_student_offerings(IN p_student INT)
BEGIN
 SELECT o.id AS offering_id,s.code,s.name,s.credits,o.academic_year,o.semester,o.academic_session,
  EXISTS(SELECT 1 FROM enrollments e WHERE e.student_id=p_student AND e.offering_id=o.id) AS enrolled
 FROM students st JOIN offerings o ON o.course_id=st.course_id AND o.branch_id=st.branch_id
  AND o.academic_year=st.academic_year AND o.semester=st.semester
 JOIN subjects s ON s.id=o.subject_id WHERE st.user_id=p_student ORDER BY s.code;
END$$

DROP PROCEDURE IF EXISTS sp_student_profile$$
CREATE PROCEDURE sp_student_profile(IN p_student INT)
BEGIN
 SELECT u.id,u.full_name,u.email,st.roll_number,c.name AS course_name,b.name AS branch_name,st.academic_year,st.semester
 FROM users u JOIN students st ON st.user_id=u.id JOIN courses c ON c.id=st.course_id JOIN branches b ON b.id=st.branch_id
 WHERE u.id=p_student;
END$$

DROP PROCEDURE IF EXISTS sp_student_timetable$$
CREATE PROCEDURE sp_student_timetable(IN p_student INT)
BEGIN
 SELECT x.exam_date,x.start_time,x.end_time,s.code AS subject_code,s.name AS subject_name,r.room_code,r.building,
  t.full_name AS invigilator
 FROM enrollments en JOIN offerings o ON o.id=en.offering_id
 JOIN exams e ON e.offering_id=o.id JOIN exam_sessions es ON es.id=e.session_id AND es.status='PUBLISHED'
 JOIN exam_schedule x ON x.exam_id=e.id AND x.status='PUBLISHED'
 JOIN subjects s ON s.id=o.subject_id JOIN rooms r ON r.id=x.room_id JOIN users t ON t.id=x.teacher_id
 WHERE en.student_id=p_student ORDER BY x.exam_date,x.start_time;
END$$

DROP PROCEDURE IF EXISTS sp_teacher_profile$$
CREATE PROCEDURE sp_teacher_profile(IN p_teacher INT)
BEGIN
 SELECT u.id,u.full_name,u.email,u.status,t.employee_code,t.department,t.designation
 FROM users u JOIN teachers t ON t.user_id=u.id WHERE u.id=p_teacher;
END$$

DROP PROCEDURE IF EXISTS sp_teacher_availability$$
CREATE PROCEDURE sp_teacher_availability(IN p_teacher INT)
BEGIN
 SELECT id,available_date,start_time,end_time,is_available FROM teacher_availability WHERE teacher_id=p_teacher ORDER BY available_date,start_time;
END$$

DROP PROCEDURE IF EXISTS sp_set_teacher_availability$$
CREATE PROCEDURE sp_set_teacher_availability(IN p_teacher INT,IN p_date DATE,IN p_start TIME,IN p_end TIME)
BEGIN
 IF p_end<=p_start THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='End time must be after start time'; END IF;
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=p_teacher AND role='TEACHER' AND status='ACTIVE') THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Only approved teachers can submit availability';
 END IF;
 INSERT INTO teacher_availability(teacher_id,available_date,start_time,end_time,is_available)
 VALUES(p_teacher,p_date,p_start,p_end,1)
 ON DUPLICATE KEY UPDATE is_available=1;
 SELECT 'Availability saved' AS message;
END$$

DROP PROCEDURE IF EXISTS sp_teacher_timetable$$
CREATE PROCEDURE sp_teacher_timetable(IN p_teacher INT)
BEGIN
 SELECT x.exam_date,x.start_time,x.end_time,s.code AS subject_code,s.name AS subject_name,r.room_code,r.building
 FROM exam_schedule x JOIN exams e ON e.id=x.exam_id JOIN exam_sessions es ON es.id=e.session_id AND es.status='PUBLISHED'
 JOIN offerings o ON o.id=e.offering_id JOIN subjects s ON s.id=o.subject_id JOIN rooms r ON r.id=x.room_id
 WHERE x.teacher_id=p_teacher AND x.status='PUBLISHED' ORDER BY x.exam_date,x.start_time;
END$$

DROP PROCEDURE IF EXISTS sp_generate_schedule$$
CREATE PROCEDURE sp_generate_schedule(IN p_session INT,IN p_algorithm VARCHAR(12))
BEGIN
 DECLARE v_done INT DEFAULT 0;
 DECLARE v_exam INT UNSIGNED;
 DECLARE v_offering INT UNSIGNED;
 DECLARE v_duration INT;
 DECLARE v_student_count INT;
 DECLARE v_date DATE;
 DECLARE v_start TIME;
 DECLARE v_end TIME;
 DECLARE v_room INT UNSIGNED;
 DECLARE v_teacher INT UNSIGNED;
 DECLARE v_placed BOOLEAN;
 DECLARE v_session_start DATE;
 DECLARE v_session_end DATE;
 DECLARE v_day_start TIME;
 DECLARE v_day_end TIME;

 DECLARE exam_cursor CURSOR FOR
  SELECT e.id,e.offering_id,e.duration_minutes,
   (SELECT COUNT(*) FROM enrollments en WHERE en.offering_id=e.offering_id) AS student_count
  FROM exams e WHERE e.session_id=p_session
  ORDER BY CASE WHEN UPPER(p_algorithm)='PRIORITY' THEN e.priority ELSE 0 END DESC,e.created_at,e.id;
 DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done=1;
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

 IF UPPER(p_algorithm) NOT IN ('FCFS','PRIORITY') THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Choose FCFS or PRIORITY';
 END IF;

 SET v_session_start=(SELECT start_date FROM exam_sessions WHERE id=p_session AND status='DRAFT');
 SET v_session_end=(SELECT end_date FROM exam_sessions WHERE id=p_session AND status='DRAFT');
 SET v_day_start=(SELECT day_start_time FROM exam_sessions WHERE id=p_session AND status='DRAFT');
 SET v_day_end=(SELECT day_end_time FROM exam_sessions WHERE id=p_session AND status='DRAFT');
 IF v_session_start IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Draft session not found'; END IF;

 START TRANSACTION;
 DELETE x FROM exam_schedule x JOIN exams e ON e.id=x.exam_id WHERE e.session_id=p_session;
 OPEN exam_cursor;

 exam_loop: LOOP
  FETCH exam_cursor INTO v_exam,v_offering,v_duration,v_student_count;
  IF v_done=1 THEN LEAVE exam_loop; END IF;
  SET v_placed=FALSE;
  SET v_date=v_session_start;

  date_loop: WHILE v_date<=v_session_end AND v_placed=FALSE DO
   SET v_start=v_day_start;

   time_loop: WHILE ADDTIME(v_start,SEC_TO_TIME(v_duration*60))<=v_day_end AND v_placed=FALSE DO
    SET v_end=ADDTIME(v_start,SEC_TO_TIME(v_duration*60));

    SET v_room=(
     SELECT r.id FROM rooms r
     WHERE r.is_active=1 AND r.capacity>=GREATEST(v_student_count,1)
      AND NOT EXISTS(SELECT 1 FROM exam_schedule x WHERE x.room_id=r.id AND x.exam_date=v_date AND x.start_time<v_end AND x.end_time>v_start)
     ORDER BY r.capacity,r.id LIMIT 1
    );

    SET v_teacher=(
     SELECT t.user_id FROM teachers t JOIN users u ON u.id=t.user_id
     WHERE u.status='ACTIVE'
      AND EXISTS(SELECT 1 FROM teacher_availability a WHERE a.teacher_id=t.user_id AND a.available_date=v_date
       AND a.is_available=1 AND a.start_time<=v_start AND a.end_time>=v_end)
      AND NOT EXISTS(SELECT 1 FROM exam_schedule x WHERE x.teacher_id=t.user_id AND x.exam_date=v_date
       AND x.start_time<v_end AND x.end_time>v_start)
      AND NOT EXISTS(
       SELECT 1 FROM exam_schedule x JOIN exams other_exam ON other_exam.id=x.exam_id
       JOIN enrollments this_en ON this_en.offering_id=v_offering
       JOIN enrollments other_en ON other_en.offering_id=other_exam.offering_id AND other_en.student_id=this_en.student_id
       WHERE x.exam_date=v_date AND x.start_time<v_end AND x.end_time>v_start
      )
     ORDER BY t.user_id LIMIT 1
    );

    IF v_room IS NOT NULL AND v_teacher IS NOT NULL THEN
     INSERT INTO exam_schedule(exam_id,room_id,teacher_id,exam_date,start_time,end_time,status)
     VALUES(v_exam,v_room,v_teacher,v_date,v_start,v_end,'DRAFT');
     SET v_placed=TRUE;
    ELSE
     SET v_start=ADDTIME(v_start,'00:30:00');
    END IF;
   END WHILE;

   IF v_placed=FALSE THEN SET v_date=DATE_ADD(v_date,INTERVAL 1 DAY); END IF;
  END WHILE;
 END LOOP;

 CLOSE exam_cursor;
 COMMIT;

 SELECT COUNT(*) AS scheduled_count
 FROM exam_schedule x JOIN exams e ON e.id=x.exam_id WHERE e.session_id=p_session;

 SELECT e.id AS exam_id,s.code AS subject_code,s.name AS subject_name
 FROM exams e JOIN offerings o ON o.id=e.offering_id JOIN subjects s ON s.id=o.subject_id
 LEFT JOIN exam_schedule x ON x.exam_id=e.id
 WHERE e.session_id=p_session AND x.id IS NULL ORDER BY e.created_at,e.id;
END$$

DROP PROCEDURE IF EXISTS sp_session_schedule$$
CREATE PROCEDURE sp_session_schedule(IN p_session INT)
BEGIN
 SELECT x.id AS schedule_id,e.id AS exam_id,x.exam_date,x.start_time,x.end_time,x.status,
  s.code AS subject_code,s.name AS subject_name,e.duration_minutes,e.priority,
  (SELECT COUNT(*) FROM enrollments en WHERE en.offering_id=o.id) AS student_count,
  r.room_code,r.building,r.capacity,t.full_name AS teacher_name
 FROM exam_schedule x JOIN exams e ON e.id=x.exam_id JOIN offerings o ON o.id=e.offering_id
 JOIN subjects s ON s.id=o.subject_id JOIN rooms r ON r.id=x.room_id JOIN users t ON t.id=x.teacher_id
 WHERE e.session_id=p_session ORDER BY x.exam_date,x.start_time,s.code;
END$$

DROP PROCEDURE IF EXISTS sp_publish_session$$
CREATE PROCEDURE sp_publish_session(IN p_session INT)
BEGIN
 IF NOT EXISTS(SELECT 1 FROM exam_sessions WHERE id=p_session AND status='DRAFT') THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Draft exam session not found';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM exams WHERE session_id=p_session) THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Add at least one examination before publishing';
 END IF;
 IF EXISTS(SELECT 1 FROM exams e LEFT JOIN exam_schedule x ON x.exam_id=e.id WHERE e.session_id=p_session AND x.id IS NULL) THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Cannot publish: some examinations remain unscheduled';
 END IF;
 UPDATE exam_sessions SET status='PUBLISHED' WHERE id=p_session;
 UPDATE exam_schedule x JOIN exams e ON e.id=x.exam_id SET x.status='PUBLISHED' WHERE e.session_id=p_session;
 SELECT 'Timetable published successfully' AS message;
END$$

DELIMITER ;
