import { Router } from 'express';
import { callProcedure, firstRows, firstRow } from '../config/db.js';

const router = Router();
const wrap = handler => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};

router.get('/overview', wrap(async (req,res) => {
  res.json(firstRow(await callProcedure('sp_dashboard')) || {});
}));
router.get('/students', wrap(async (req,res) => res.json({ students: firstRows(await callProcedure('sp_list_students')) })));
router.get('/teachers', wrap(async (req,res) => res.json({ teachers: firstRows(await callProcedure('sp_list_teachers')) })));
router.patch('/teachers/:id/status', wrap(async (req,res) => {
  const r = await callProcedure('sp_update_teacher_status', [Number(req.params.id), req.body.status]);
  res.json(firstRow(r) || { message: 'Teacher status updated.' });
}));

router.get('/courses', wrap(async (req,res) => res.json({ courses: firstRows(await callProcedure('sp_list_courses')) })));
router.post('/courses', wrap(async (req,res) => {
  const b=req.body||{}; if(!b.code||!b.name) return res.status(400).json({message:'Course code and name are required.'});
  res.status(201).json(firstRow(await callProcedure('sp_create_course',[b.code,b.name])));
}));

router.get('/branches', wrap(async (req,res) => res.json({ branches: firstRows(await callProcedure('sp_list_branches')) })));
router.post('/branches', wrap(async (req,res) => {
  const b=req.body||{}; if(!b.course_id||!b.code||!b.name) return res.status(400).json({message:'Course, branch code and name are required.'});
  res.status(201).json(firstRow(await callProcedure('sp_create_branch',[Number(b.course_id),b.code,b.name])));
}));

router.get('/subjects', wrap(async (req,res) => res.json({ subjects: firstRows(await callProcedure('sp_list_subjects')) })));
router.post('/subjects', wrap(async (req,res) => {
  const b=req.body||{}; if(!b.code||!b.name) return res.status(400).json({message:'Subject code and name are required.'});
  res.status(201).json(firstRow(await callProcedure('sp_create_subject',[b.code,b.name,Number(b.credits||3)])));
}));

router.get('/offerings', wrap(async (req,res) => res.json({ offerings: firstRows(await callProcedure('sp_list_offerings')) })));
router.post('/offerings', wrap(async (req,res) => {
  const b=req.body||{};
  if(!b.subject_id||!b.course_id||!b.branch_id||!b.academic_year||!b.semester||!b.academic_session) return res.status(400).json({message:'Complete all offering fields.'});
  res.status(201).json(firstRow(await callProcedure('sp_create_offering',[Number(b.subject_id),Number(b.course_id),Number(b.branch_id),Number(b.academic_year),Number(b.semester),b.academic_session])));
}));

router.get('/rooms', wrap(async (req,res) => res.json({ rooms: firstRows(await callProcedure('sp_list_rooms')) })));
router.post('/rooms', wrap(async (req,res) => {
  const b=req.body||{}; if(!b.room_code||!b.capacity) return res.status(400).json({message:'Room code and capacity are required.'});
  res.status(201).json(firstRow(await callProcedure('sp_create_room',[b.room_code,b.building||'',Number(b.capacity),b.room_type||'CLASSROOM'])));
}));

router.get('/sessions', wrap(async (req,res) => res.json({ sessions: firstRows(await callProcedure('sp_list_sessions')) })));
router.post('/sessions', wrap(async (req,res) => {
  const b=req.body||{};
  if(!b.name||!b.academic_session||!b.start_date||!b.end_date||!b.day_start_time||!b.day_end_time) return res.status(400).json({message:'Complete all exam session fields.'});
  res.status(201).json(firstRow(await callProcedure('sp_create_session',[b.name,b.academic_session,b.start_date,b.end_date,b.day_start_time,b.day_end_time,1])));
}));
router.get('/sessions/:id/exams', wrap(async (req,res) => res.json({ exams: firstRows(await callProcedure('sp_list_session_exams',[Number(req.params.id)])) })));
router.post('/sessions/:id/exams', wrap(async (req,res) => {
  const b=req.body||{}; if(!b.offering_id) return res.status(400).json({message:'Select a subject offering.'});
  res.status(201).json(firstRow(await callProcedure('sp_add_exam',[Number(req.params.id),Number(b.offering_id),Number(b.duration_minutes||180),Number(b.priority||1)])));
}));
router.post('/sessions/:id/generate', wrap(async (req,res) => {
  const sets=await callProcedure('sp_generate_schedule',[Number(req.params.id),String(req.body?.algorithm||'FCFS').toUpperCase()]);
  res.json({ summary: firstRow(sets), unscheduled: firstRows(sets?.[1] ? [sets[1]] : []) });
}));
router.get('/sessions/:id/schedule', wrap(async (req,res) => res.json({ schedule: firstRows(await callProcedure('sp_session_schedule',[Number(req.params.id)])) })));
router.post('/sessions/:id/publish', wrap(async (req,res) => {
  res.json(firstRow(await callProcedure('sp_publish_session',[Number(req.params.id)]) ) || {message:'Timetable published.'});
}));

export default router;
