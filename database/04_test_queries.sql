USE examflow;
SHOW TABLES;
CALL sp_dashboard();
CALL sp_list_students();
CALL sp_list_teachers();
CALL sp_list_offerings();
CALL sp_list_rooms();
CALL sp_list_sessions();
-- To generate the demo session after importing all three files:
-- CALL sp_generate_schedule(1,'FCFS');
-- CALL sp_session_schedule(1);
