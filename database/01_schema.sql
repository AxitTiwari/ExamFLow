CREATE DATABASE IF NOT EXISTS examflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE examflow;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('ADMIN','STUDENT','TEACHER') NOT NULL,
  status ENUM('PENDING','ACTIVE','REJECTED','DISABLED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS courses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(24) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS branches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  code VARCHAR(24) NOT NULL,
  name VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_branch_course_code(course_id, code),
  CONSTRAINT fk_branches_course FOREIGN KEY(course_id) REFERENCES courses(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  user_id INT UNSIGNED PRIMARY KEY,
  roll_number VARCHAR(40) NOT NULL UNIQUE,
  course_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NOT NULL,
  academic_year TINYINT UNSIGNED NOT NULL,
  semester TINYINT UNSIGNED NOT NULL,
  CONSTRAINT fk_students_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_students_course FOREIGN KEY(course_id) REFERENCES courses(id),
  CONSTRAINT fk_students_branch FOREIGN KEY(branch_id) REFERENCES branches(id),
  CONSTRAINT chk_student_year CHECK(academic_year BETWEEN 1 AND 6),
  CONSTRAINT chk_student_semester CHECK(semester BETWEEN 1 AND 12)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teachers (
  user_id INT UNSIGNED PRIMARY KEY,
  employee_code VARCHAR(40) NOT NULL UNIQUE,
  department VARCHAR(120) NOT NULL,
  designation VARCHAR(120) NULL,
  CONSTRAINT fk_teachers_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  credits TINYINT UNSIGNED NOT NULL DEFAULT 3
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS offerings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NOT NULL,
  academic_year TINYINT UNSIGNED NOT NULL,
  semester TINYINT UNSIGNED NOT NULL,
  academic_session VARCHAR(30) NOT NULL,
  UNIQUE KEY uq_offering(subject_id, branch_id, academic_year, semester, academic_session),
  CONSTRAINT fk_offering_subject FOREIGN KEY(subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_offering_course FOREIGN KEY(course_id) REFERENCES courses(id),
  CONSTRAINT fk_offering_branch FOREIGN KEY(branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enrollments (
  student_id INT UNSIGNED NOT NULL,
  offering_id INT UNSIGNED NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(student_id, offering_id),
  CONSTRAINT fk_enrollment_student FOREIGN KEY(student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_offering FOREIGN KEY(offering_id) REFERENCES offerings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rooms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(30) NOT NULL UNIQUE,
  building VARCHAR(100) NULL,
  capacity SMALLINT UNSIGNED NOT NULL,
  room_type VARCHAR(40) NOT NULL DEFAULT 'CLASSROOM',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_room_capacity CHECK(capacity > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  academic_session VARCHAR(30) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  day_start_time TIME NOT NULL,
  day_end_time TIME NOT NULL,
  status ENUM('DRAFT','PUBLISHED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exam_session_creator FOREIGN KEY(created_by) REFERENCES users(id),
  CONSTRAINT chk_session_dates CHECK(end_date >= start_date),
  CONSTRAINT chk_session_times CHECK(day_end_time > day_start_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exams (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id INT UNSIGNED NOT NULL,
  offering_id INT UNSIGNED NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 180,
  priority TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_exam_session_offering(session_id, offering_id),
  CONSTRAINT fk_exam_session FOREIGN KEY(session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_offering FOREIGN KEY(offering_id) REFERENCES offerings(id),
  CONSTRAINT chk_exam_duration CHECK(duration_minutes BETWEEN 30 AND 480),
  CONSTRAINT chk_exam_priority CHECK(priority BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teacher_availability (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT UNSIGNED NOT NULL,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_teacher_availability(teacher_id, available_date, start_time, end_time),
  CONSTRAINT fk_availability_teacher FOREIGN KEY(teacher_id) REFERENCES teachers(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_availability_time CHECK(end_time > start_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_schedule (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  exam_id INT UNSIGNED NOT NULL UNIQUE,
  room_id INT UNSIGNED NOT NULL,
  teacher_id INT UNSIGNED NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_schedule_date_time(exam_date,start_time,end_time),
  INDEX idx_schedule_room(room_id,exam_date),
  INDEX idx_schedule_teacher(teacher_id,exam_date),
  CONSTRAINT fk_schedule_exam FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedule_room FOREIGN KEY(room_id) REFERENCES rooms(id),
  CONSTRAINT fk_schedule_teacher FOREIGN KEY(teacher_id) REFERENCES teachers(user_id),
  CONSTRAINT chk_schedule_time CHECK(end_time > start_time)
) ENGINE=InnoDB;
