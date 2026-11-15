import { Router } from 'express';
import { callProcedure, firstRow } from '../config/db.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Enter both email and password.' });
    const user = firstRow(await callProcedure('sp_login', [String(email).trim().toLowerCase(), String(password)]));
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    if (user.status === 'REJECTED' || user.status === 'DISABLED') {
      return res.status(403).json({ message: `Your account is ${user.status.toLowerCase()}. Contact the administrator.` });
    }
    res.json({ user: { id: user.id, name: user.full_name, email: user.email, role: user.role, status: user.status } });
  } catch (error) { next(error); }
});

router.post('/register/student', async (req, res, next) => {
  try {
    const b = req.body || {};
    const required = ['full_name','email','password','roll_number','course_id','branch_id','academic_year','semester'];
    const missing = required.filter(k => b[k] === undefined || b[k] === '');
    if (missing.length) return res.status(400).json({ message: `Required fields: ${missing.join(', ')}` });
    const result = await callProcedure('sp_register_student', [
      b.full_name, b.email, b.password, b.roll_number,
      Number(b.course_id), Number(b.branch_id), Number(b.academic_year), Number(b.semester)
    ]);
    res.status(201).json({ message: 'Student account created. You can now sign in.', user_id: result[0]?.[0]?.user_id });
  } catch (error) { next(error); }
});

router.post('/register/teacher', async (req, res, next) => {
  try {
    const b = req.body || {};
    const required = ['full_name','email','password','employee_code','department'];
    const missing = required.filter(k => b[k] === undefined || b[k] === '');
    if (missing.length) return res.status(400).json({ message: `Required fields: ${missing.join(', ')}` });
    const result = await callProcedure('sp_register_teacher', [
      b.full_name, b.email, b.password, b.employee_code, b.department, b.designation || ''
    ]);
    res.status(201).json({ message: 'Teacher registration submitted. Your account is pending administrator approval.', user_id: result[0]?.[0]?.user_id });
  } catch (error) { next(error); }
});

export default router;
