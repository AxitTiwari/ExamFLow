import { Router } from 'express';
import { callProcedure, firstRows, firstRow } from '../config/db.js';
const router=Router();
const wrap=handler=>async(req,res,next)=>{try{await handler(req,res);}catch(e){next(e);}};
router.get('/:id/profile',wrap(async(req,res)=>res.json(firstRow(await callProcedure('sp_student_profile',[Number(req.params.id)]))||{})));
router.get('/:id/offerings',wrap(async(req,res)=>res.json({offerings:firstRows(await callProcedure('sp_student_offerings',[Number(req.params.id)]))})));
router.post('/:id/enrollments',wrap(async(req,res)=>{
 const r=await callProcedure('sp_enroll_student',[Number(req.params.id),Number(req.body.offering_id)]);
 res.json(firstRow(r)||{message:'Enrollment successful.'});
}));
router.get('/:id/timetable',wrap(async(req,res)=>res.json({timetable:firstRows(await callProcedure('sp_student_timetable',[Number(req.params.id)]))})));
export default router;
