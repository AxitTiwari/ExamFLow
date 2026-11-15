import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import teacherRoutes from './routes/teacher.js';
import { pool } from './config/db.js';

const app=express();
app.use(cors({origin:process.env.FRONTEND_ORIGIN||'http://localhost:5173'}));
app.use(express.json({limit:'1mb'}));
app.get('/api/health',async(req,res)=>{
 try{await pool.query('SELECT 1');res.json({status:'ok',database:'connected'});}
 catch(e){res.status(503).json({status:'error',database:'disconnected',message:e.message});}
});
app.use('/api/auth',authRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api/student',studentRoutes);
app.use('/api/teacher',teacherRoutes);
app.use((err,req,res,next)=>{
 console.error(err);
 const duplicate=err.code==='ER_DUP_ENTRY';
 res.status(duplicate?409:400).json({message:err.sqlMessage||err.message||'Request failed'});
});
const port=Number(process.env.PORT||5000);
app.listen(port,()=>console.log(`ExamFlow API running at http://localhost:${port}`));
