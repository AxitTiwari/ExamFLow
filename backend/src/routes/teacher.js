import { Router } from 'express';
import { callProcedure, firstRows, firstRow } from '../config/db.js';
const router=Router();
const wrap=handler=>async(req,res,next)=>{try{await handler(req,res);}catch(e){next(e);}};
router.get('/:id/profile',wrap(async(req,res)=>res.json(firstRow(await callProcedure('sp_teacher_profile',[Number(req.params.id)]))||{})));
router.get('/:id/availability',wrap(async(req,res)=>res.json({availability:firstRows(await callProcedure('sp_teacher_availability',[Number(req.params.id)]))})));
router.post('/:id/availability',wrap(async(req,res)=>{
 const b=req.body||{};
 if(!b.available_date||!b.start_time||!b.end_time)return res.status(400).json({message:'Date, start time and end time are required.'});
 res.json(firstRow(await callProcedure('sp_set_teacher_availability',[Number(req.params.id),b.available_date,b.start_time,b.end_time]))||{message:'Availability saved.'});
}));
router.get('/:id/timetable',wrap(async(req,res)=>res.json({timetable:firstRows(await callProcedure('sp_teacher_timetable',[Number(req.params.id)]))})));
export default router;
